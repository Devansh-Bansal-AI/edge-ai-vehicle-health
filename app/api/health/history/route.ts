import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const tenantId = (session?.user as any)?.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const hours = parseInt(searchParams.get('hours') ?? '24');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '200'), 500);

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const snapshots = await prisma.healthSnapshot.findMany({
      where: {
        vehicle: {
          tenantId: tenantId,
          ...(vehicleId ? { id: vehicleId } : {}),
        },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: {
        id: true,
        score: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ snapshots, hours });
  } catch (error) {
    console.error('Health history error:', error);
    return NextResponse.json({ snapshots: [], hours: 24 });
  }
}
