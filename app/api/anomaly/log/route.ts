import { NextRequest, NextResponse } from 'next/server';
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
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const sensor = searchParams.get('sensor');
    const severity = searchParams.get('severity');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const vehicleId = searchParams.get('vehicle');
    const cursor = searchParams.get('cursor');

    const where: Record<string, unknown> = { 
      vehicle: {
        tenantId: tenantId,
        ...(vehicleId && vehicleId !== 'default-vehicle' ? { id: vehicleId } : {})
      }
    };
    
    if (sensor) where.sensor = sensor;
    if (severity) where.severity = severity;
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    // Cursor pagination (with fallback to offset if needed by UI, but we'll prefer cursor)
    // To not completely break the UI if it still sends 'page', we'll accept 'page' just for legacy offset
    const page = parseInt(searchParams.get('page') ?? '1');
    const useCursor = !!cursor;

    const queryArgs: any = {
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Fetch +1 to check if there is a next page for cursor
    };

    if (useCursor) {
      queryArgs.cursor = { id: cursor };
    } else {
      queryArgs.skip = (page - 1) * limit;
    }

    const events = await prisma.anomalyEvent.findMany(queryArgs);
    
    let nextCursor = null;
    if (events.length > limit) {
      const nextItem = events.pop();
      nextCursor = nextItem?.id;
    }

    // Still fetch count for the UI's 'total' and 'totalPages' display
    const total = await prisma.anomalyEvent.count({ where });

    return NextResponse.json({
      events,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      nextCursor
    });
  } catch (error) {
    console.error('Anomaly log error:', error);
    return NextResponse.json({
      events: [],
      total: 0,
      page: 1,
      totalPages: 0,
      nextCursor: null
    });
  }
}
