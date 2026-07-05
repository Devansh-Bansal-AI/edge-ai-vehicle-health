import { NextResponse } from 'next/server';
import { fleetManager } from '@/lib/fleet';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get fleet overview from memory
  const overview = fleetManager.getOverview();

  // Get vehicles owned by the tenant from DB
  const dbVehicles = await prisma.vehicle.findMany({
    where: { tenantId: tenantId },
    select: { id: true }
  });

  const tenantVehicleIds = new Set(dbVehicles.map(v => v.id));

  // Filter overview to only include tenant's vehicles
  const filteredVehicles = overview.vehicles.filter(v => tenantVehicleIds.has(v.id));

  // Recalculate fleet-wide stats based on filtered vehicles
  const totalVehicles = filteredVehicles.length;
  const totalCritical = filteredVehicles.reduce((sum, v) => sum + (v.status === 'critical' ? 1 : 0), 0);
  const fleetHealth = totalVehicles > 0 
    ? Math.round(filteredVehicles.reduce((sum, v) => sum + v.healthScore, 0) / totalVehicles)
    : 100;

  return NextResponse.json({
    totalVehicles,
    totalCritical,
    fleetHealth,
    vehicles: filteredVehicles
  });
}
