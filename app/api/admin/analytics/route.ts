import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/utils/error-handler';

export const GET = withErrorHandler(async (request: NextRequest) => {
  await requirePermission('admin:access');
  
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get('range') || '7d';
  const type = searchParams.get('type') || 'overview';
  
  // Calculate date range
  const now = new Date();
  const startDate = new Date();
  
  switch (range) {
    case '24h':
      startDate.setDate(now.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
  }
  
  if (type === 'overview') {
    // Get overview metrics
    const [
      totalPageViews,
      uniqueVisitors,
      totalOrders,
      conversionEvents,
      topProducts,
      recentEvents
    ] = await Promise.all([
      // Total page views
      prisma.analyticsEvent.count({
        where: {
          eventType: 'page_view',
          timestamp: { gte: startDate }
        }
      }),
      
      // Unique visitors
      prisma.analyticsEvent.findMany({
        where: {
          timestamp: { gte: startDate }
        },
        select: { sessionId: true },
        distinct: ['sessionId']
      }),
      
      // Total orders
      prisma.order.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // Conversion events
      prisma.analyticsEvent.count({
        where: {
          eventType: 'checkout_complete',
          timestamp: { gte: startDate }
        }
      }),
      
      // Top viewed products
      prisma.analyticsEvent.groupBy({
        by: ['properties'],
        where: {
          eventType: 'product_impression',
          timestamp: { gte: startDate }
        },
        _count: true,
        orderBy: {
          _count: {
            properties: 'desc'
          }
        },
        take: 10
      }),
      
      // Recent events
      prisma.analyticsEvent.findMany({
        where: {
          timestamp: { gte: startDate }
        },
        orderBy: { timestamp: 'desc' },
        take: 50
      })
    ]);
    
    return NextResponse.json({
      overview: {
        pageViews: totalPageViews,
        uniqueVisitors: uniqueVisitors.length,
        orders: totalOrders,
        conversions: conversionEvents,
        conversionRate: uniqueVisitors.length > 0 
          ? ((conversionEvents / uniqueVisitors.length) * 100).toFixed(2) 
          : 0
      },
      topProducts: topProducts.map(p => {
        const props = p.properties as any;
        return {
          productId: props.productId,
          productName: props.productName,
          views: p._count
        };
      }),
      recentActivity: recentEvents
    });
  }
  
  if (type === 'funnel') {
    // Get conversion funnel data
    const [
      productViews,
      addToCartEvents,
      checkoutStarts,
      checkoutCompletes
    ] = await Promise.all([
      prisma.analyticsEvent.count({
        where: {
          eventType: 'product_impression',
          timestamp: { gte: startDate }
        }
      }),
      prisma.analyticsEvent.count({
        where: {
          eventType: 'product_add_to_cart',
          timestamp: { gte: startDate }
        }
      }),
      prisma.analyticsEvent.count({
        where: {
          eventType: 'checkout_start',
          timestamp: { gte: startDate }
        }
      }),
      prisma.analyticsEvent.count({
        where: {
          eventType: 'checkout_complete',
          timestamp: { gte: startDate }
        }
      })
    ]);
    
    return NextResponse.json({
      funnel: [
        { stage: 'Product Views', count: productViews },
        { stage: 'Added to Cart', count: addToCartEvents },
        { stage: 'Checkout Started', count: checkoutStarts },
        { stage: 'Order Completed', count: checkoutCompletes }
      ]
    });
  }
  
  if (type === 'products') {
    // Get product performance data - using PostgreSQL JSON operators
    const productStats = await prisma.$queryRaw`
      SELECT 
        properties->>'productId' as product_id,
        properties->>'productName' as product_name,
        COUNT(CASE WHEN "eventType" = 'product_impression' THEN 1 END) as views,
        COUNT(CASE WHEN "eventType" = 'product_click' THEN 1 END) as clicks,
        COUNT(CASE WHEN "eventType" = 'product_add_to_cart' THEN 1 END) as adds_to_cart
      FROM "AnalyticsEvent"
      WHERE timestamp >= ${startDate}
        AND properties->>'productId' IS NOT NULL
      GROUP BY properties->>'productId', properties->>'productName'
      ORDER BY views DESC
      LIMIT 50
    `;
    
    return NextResponse.json({ products: productStats });
  }
  
  // Time series data
  if (type === 'timeseries') {
    const events = await prisma.analyticsEvent.findMany({
      where: {
        timestamp: { gte: startDate },
        eventType: {
          in: ['page_view', 'product_add_to_cart', 'checkout_complete']
        }
      },
      select: {
        eventType: true,
        timestamp: true
      },
      orderBy: { timestamp: 'asc' }
    });
    
    return NextResponse.json({ timeseries: events });
  }
  
  // A/B test results
  if (type === 'ab') {
    const experiment = 'homepage_v3';

    const [impressionEvents, ctaClicks, shopPageViews] = await Promise.all([
      // All impression events for this experiment
      prisma.analyticsEvent.findMany({
        where: { eventType: 'ab_impression', timestamp: { gte: startDate } },
        select: { sessionId: true, properties: true },
      }),
      // Explicit CTA clicks (variant B)
      prisma.analyticsEvent.count({
        where: { eventType: 'ab_cta_click', timestamp: { gte: startDate } },
      }),
      // Any shop page visits (used as conversion proxy for both variants)
      prisma.analyticsEvent.findMany({
        where: {
          eventType: 'page_view',
          pageUrl: { contains: '/shop' },
          timestamp: { gte: startDate },
        },
        select: { sessionId: true },
      }),
    ]);

    const shopSessionIds = new Set(shopPageViews.map((e) => e.sessionId));

    const sessionsA = new Set(
      impressionEvents
        .filter((e) => (e.properties as any)?.variant === 'A' && (e.properties as any)?.experiment === experiment)
        .map((e) => e.sessionId),
    );
    const sessionsB = new Set(
      impressionEvents
        .filter((e) => (e.properties as any)?.variant === 'B' && (e.properties as any)?.experiment === experiment)
        .map((e) => e.sessionId),
    );

    const convA = [...sessionsA].filter((s) => shopSessionIds.has(s)).length;
    const convB = [...sessionsB].filter((s) => shopSessionIds.has(s)).length;
    const rateA = sessionsA.size > 0 ? (convA / sessionsA.size) * 100 : 0;
    const rateB = sessionsB.size > 0 ? (convB / sessionsB.size) * 100 : 0;

    return NextResponse.json({
      ab: {
        experiment,
        variantA: {
          label: 'Current Homepage',
          impressions: sessionsA.size,
          conversions: convA,
          rate: parseFloat(rateA.toFixed(1)),
          ctaClicks: null,
        },
        variantB: {
          label: 'Troublemaker v3',
          impressions: sessionsB.size,
          conversions: convB,
          rate: parseFloat(rateB.toFixed(1)),
          ctaClicks,
        },
      },
    });
  }

  return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
});