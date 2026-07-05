import { NextRequest, NextResponse } from 'next/server';
import { fleetManager } from '@/lib/fleet';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const tenantId = (session?.user as any)?.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicle') ?? 'default-vehicle';

    // Verify tenant ownership of the vehicle
    const dbVehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId: tenantId }
    });

    if (!dbVehicle) {
      return NextResponse.json({ error: 'Vehicle not found or unauthorized' }, { status: 403 });
    }

    const vehicle = fleetManager.getVehicle(vehicleId) ?? fleetManager.getVehicle('default-vehicle')!;
    const rul = vehicle.engine.getRUL();

    const enriched = rul.map(component => ({
      ...component,
      predictedServiceDate: new Date(
        Date.now() + component.daysLeft * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0],
      percentRemaining: Math.round((component.daysLeft / component.totalDays) * 100),
    }));

    return NextResponse.json({ components: enriched });
  } catch (error) {
    console.error('RUL fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch RUL' }, { status: 500 });
  }
}
