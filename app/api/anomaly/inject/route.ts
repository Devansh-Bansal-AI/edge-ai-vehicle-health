import { NextRequest, NextResponse } from 'next/server';
import { fleetManager } from '@/lib/fleet';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const tenantId = (session?.user as any)?.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { sensor, faultType, scenarioId, vehicleId = 'default-vehicle' } = body as {
      sensor?: string;
      faultType?: string;
      scenarioId?: string;
      vehicleId?: string;
    };

    // Verify tenant ownership of the vehicle
    const dbVehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId: tenantId }
    });

    if (!dbVehicle) {
      return NextResponse.json({ error: 'Vehicle not found or unauthorized' }, { status: 403 });
    }

    const vehicle = fleetManager.getVehicle(vehicleId) ?? fleetManager.getVehicle('default-vehicle')!;

    // Scenario injection
    if (scenarioId) {
      const result = vehicle.engine.injectScenario(scenarioId);
      if (!result.activated) {
        return NextResponse.json({ error: 'Unknown scenario' }, { status: 400 });
      }

      // Persist a marker anomaly event for the scenario
      try {
        await prisma.anomalyEvent.create({
          data: {
            vehicleId: vehicle.id,
            sensor: result.scenario.steps[0]?.sensor ?? 'unknown',
            faultType: `scenario:${result.scenario.id}`,
            zScore: 0,
            severity: 'critical',
            duration: 0,
          },
        });
      } catch {
        // DB persistence failed - skip
      }

      return NextResponse.json({
        success: true,
        scenario: {
          id: result.scenario.id,
          name: result.scenario.name,
          icon: result.scenario.icon,
          description: result.scenario.description,
          stepsCount: result.scenario.steps.length,
        },
      });
    }

    // Single anomaly injection (legacy)
    const anomaly = vehicle.engine.injectAnomaly(sensor, faultType);

    // Persist to DB
    try {
      await prisma.anomalyEvent.create({
        data: {
          vehicleId: vehicle.id,
          sensor: anomaly.sensor,
          faultType: anomaly.faultType,
          zScore: anomaly.zScore,
          severity: anomaly.severity,
          duration: anomaly.duration,
        },
      });
    } catch {
      // DB persistence failed - skip
    }

    return NextResponse.json({
      success: true,
      anomaly: {
        sensor: anomaly.sensor,
        sensorName: anomaly.sensorName,
        faultType: anomaly.faultType,
        duration: anomaly.duration,
      },
    });
  } catch (error) {
    console.error('Inject anomaly error:', error);
    return NextResponse.json({ error: 'Failed to inject anomaly' }, { status: 500 });
  }
}
