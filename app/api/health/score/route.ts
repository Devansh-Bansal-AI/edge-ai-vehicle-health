import { NextRequest, NextResponse } from 'next/server';
import { fleetManager } from '@/lib/fleet';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('vehicle') ?? 'default-vehicle';
  
  const vehicle = fleetManager.getVehicle(vehicleId) ?? fleetManager.getVehicle('default-vehicle')!;

  return NextResponse.json({
    score: vehicle.engine.getHealthScore(),
    timestamp: new Date().toISOString(),
  });
}
