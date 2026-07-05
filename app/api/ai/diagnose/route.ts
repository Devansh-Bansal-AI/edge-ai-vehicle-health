import { NextRequest } from 'next/server';
import { fleetManager } from '@/lib/fleet';
import { streamDiagnosis, streamMaintenancePlan } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const tenantId = (session?.user as any)?.tenantId;

    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json().catch(() => ({}));
    const { message, chatHistory = [], mode = 'diagnose', vehicleId = 'default-vehicle' } = body as {
      message?: string;
      chatHistory?: Array<{ role: string; content: string }>;
      mode?: 'diagnose' | 'maintenance';
      vehicleId?: string;
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Valid message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify tenant ownership of the vehicle
    const dbVehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId: tenantId }
    });

    if (!dbVehicle) {
      return new Response(JSON.stringify({ error: 'Vehicle not found or unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const vehicle = fleetManager.getVehicle(vehicleId) ?? fleetManager.getVehicle('default-vehicle')!;
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let generator: AsyncGenerator<string>;

          if (mode === 'maintenance') {
            const rul = vehicle.engine.getRUL();
            const healthScore = vehicle.engine.getHealthScore();
            generator = streamMaintenancePlan(rul, healthScore);
          } else {
            const context = vehicle.engine.buildDiagnosticContext();
            generator = streamDiagnosis(message, context, chatHistory);
          }

          for await (const chunk of generator) {
            fullResponse += chunk;
            const event = `data: ${JSON.stringify({ text: chunk })}\n\n`;
            controller.enqueue(encoder.encode(event));
          }

          // Send done event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));

          // Persist diagnostic session
          try {
            const messages = [
              ...chatHistory,
              { role: 'user', content: message },
              { role: 'assistant', content: fullResponse },
            ];
            await prisma.diagnosticSession.create({
              data: {
                vehicleId: vehicle.id,
                messages: messages,
              },
            });
          } catch {
            // DB persistence failed - skip
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error('Gemini stream error:', errorMsg);
          const event = `data: ${JSON.stringify({ error: errorMsg })}\n\n`;
          controller.enqueue(encoder.encode(event));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Diagnose error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process diagnostic request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
