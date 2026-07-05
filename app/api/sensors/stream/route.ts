import { fleetManager } from '@/lib/fleet';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const TICK_INTERVAL = 300; // ms
const FLUSH_INTERVAL = 5000; // ms

// Ensure vehicle exists in DB and is assigned to the current tenant
async function ensureVehicle(vehicleId: string, name: string, vin: string, tenantId: string) {
  try {
    await prisma.vehicle.upsert({
      where: { vin },
      update: { tenantId }, // Ensure it belongs to the active tenant
      create: {
        id: vehicleId,
        name,
        vin,
        tenantId,
      },
    });
  } catch {
    // DB persistence failed - skip
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('vehicle') ?? 'default-vehicle';
  
  const vehicle = fleetManager.getVehicle(vehicleId) ?? fleetManager.getVehicle('default-vehicle')!;
  
  await ensureVehicle(vehicle.id, vehicle.name, vehicle.vin, tenantId);

  const encoder = new TextEncoder();

  let intervalId: ReturnType<typeof setInterval>;
  let flushId: ReturnType<typeof setInterval>;
  let heartbeatId: ReturnType<typeof setInterval>;
  let closed = false;

  // Batching buffers
  let anomalyBuffer: any[] = [];
  let healthSnapshotBuffer: any[] = [];

  const cleanup = () => {
    closed = true;
    clearInterval(intervalId);
    clearInterval(flushId);
    clearInterval(heartbeatId);
  };

  const stream = new ReadableStream({
    start(controller) {
      // 1. Tick engine every 300ms and buffer DB writes
      intervalId = setInterval(() => {
        if (closed) return;
        try {
          const data = vehicle.engine.tick();

          // Buffer anomalies
          for (const anomaly of data.anomalies) {
            anomalyBuffer.push({
              vehicleId: vehicle.id,
              sensor: anomaly.sensor,
              faultType: anomaly.faultType,
              zScore: anomaly.zScore,
              severity: anomaly.severity,
              duration: anomaly.duration,
            });
          }

          // Buffer health snapshot (engine class says persist every 60s)
          if (vehicle.engine.getShouldPersistHealth()) {
            healthSnapshotBuffer.push({
              vehicleId: vehicle.id,
              score: data.healthScore,
            });
          }

          if (!closed) {
            const event = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(event));
          }
        } catch (error) {
          console.error('SSE tick error:', error);
        }
      }, TICK_INTERVAL);

      // 2. Async Flush DB every 5 seconds (Batching)
      flushId = setInterval(async () => {
        if (anomalyBuffer.length === 0 && healthSnapshotBuffer.length === 0) return;

        // Copy buffers and clear them to prevent locking during async write
        const anomaliesToPersist = [...anomalyBuffer];
        const snapshotsToPersist = [...healthSnapshotBuffer];
        anomalyBuffer = [];
        healthSnapshotBuffer = [];

        try {
          if (anomaliesToPersist.length > 0) {
            await prisma.anomalyEvent.createMany({
              data: anomaliesToPersist,
              skipDuplicates: true,
            });
          }
          if (snapshotsToPersist.length > 0) {
            await prisma.healthSnapshot.createMany({
              data: snapshotsToPersist,
              skipDuplicates: true,
            });
          }
        } catch (error) {
          console.error('Failed to flush batches to DB:', error);
        }
      }, FLUSH_INTERVAL);

      // Heartbeat every 15s
      heartbeatId = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          // Connection closed
        }
      }, 15000);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
