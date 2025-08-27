import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    const adminCheck = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!adminCheck || (adminCheck.role !== 'ADMIN' && adminCheck.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d';
    
    // Parse range to get date filter
    let daysBack = 30;
    if (range === '7d') daysBack = 7;
    else if (range === '90d') daysBack = 90;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Fetch analytics events with proper typing
    const events = await prisma.analyticsEvent.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1000
    });

    // Fetch conversion data from orders
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate
        },
        status: {
          in: ['paid', 'processing', 'shipped', 'delivered']
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    // Process events for attribution analysis
    const processedEvents = events.map(event => ({
      id: event.id,
      type: event.eventType,
      userId: event.userId,
      sessionId: event.sessionId,
      source: (event.properties as any)?.source || 'direct',
      medium: (event.properties as any)?.medium || 'none',
      campaign: (event.properties as any)?.campaign || 'none',
      timestamp: event.createdAt,
      value: (event.properties as any)?.value || 0,
      properties: event.properties
    }));

    // Add purchase events from orders
    const purchaseEvents = orders.map(order => ({
      id: `order-${order.id}`,
      type: 'purchase',
      userId: order.userId,
      sessionId: null,
      source: 'direct', // Orders don't have UTM tracking in current schema
      medium: 'none',
      campaign: 'none',
      timestamp: order.createdAt,
      value: order.totalCents / 100,
      properties: {
        orderId: order.id,
        status: order.status
      }
    }));

    // Combine all events
    const allEvents = [...processedEvents, ...purchaseEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      events: allEvents,
      summary: {
        totalEvents: allEvents.length,
        uniqueUsers: new Set(allEvents.map(e => e.userId).filter(Boolean)).size,
        totalRevenue: allEvents
          .filter(e => e.type === 'purchase')
          .reduce((sum, e) => sum + (e.value || 0), 0),
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { events } = await request.json();
    
    // Process events in batch
    const analyticsEvents = events.map((event: any) => ({
      eventType: event.event,
      properties: event.properties,
      userId: userId || event.properties.userId,
      sessionId: event.properties.sessionId,
      timestamp: new Date(event.properties.timestamp),
      pageUrl: event.properties.pageUrl,
    }));
    
    // Store in database
    await prisma.analyticsEvent.createMany({
      data: analyticsEvents,
      skipDuplicates: true,
    });
    
    // For product impressions, update view counts
    const impressionEvents = events.filter((e: any) => e.event === 'product_impression');
    for (const event of impressionEvents) {
      const productId = event.properties.productId;
      if (productId) {
        // Check if it's a game or merch
        const game = await prisma.game.findUnique({ where: { id: productId } });
        if (game) {
          await prisma.game.update({
            where: { id: productId },
            data: { viewCount: { increment: 1 } },
          });
        } else {
          await prisma.merch.update({
            where: { id: productId },
            data: { viewCount: { increment: 1 } },
          });
        }
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    // Don't return error to client - analytics should fail silently
    return NextResponse.json({ success: true });
  }
}