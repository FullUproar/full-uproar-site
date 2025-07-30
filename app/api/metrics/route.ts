import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

interface Metrics {
  timestamp: string;
  period: string;
  business: {
    totalRevenue: number;
    orderCount: number;
    averageOrderValue: number;
    topProducts: Array<{
      name: string;
      revenue: number;
      quantity: number;
    }>;
  };
  inventory: {
    totalProducts: number;
    lowStockItems: Array<{
      name: string;
      stock: number;
      type: 'game' | 'merch';
    }>;
    outOfStockCount: number;
  };
  performance: {
    apiRequests: {
      total: number;
      averageResponseTime: number;
      errorRate: number;
    };
    database: {
      queryCount: number;
      averageQueryTime: number;
    };
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check for API key in production
    if (process.env.NODE_ENV === 'production') {
      const apiKey = request.headers.get('x-api-key');
      if (apiKey !== process.env.METRICS_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const period = request.nextUrl.searchParams.get('period') || '7d';
    const startDate = getStartDate(period);

    // Business Metrics
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: ['completed', 'shipped'] },
      },
      include: {
        items: true,
      },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalCents, 0);
    const orderCount = orders.length;
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // Top Products
    const productRevenue = new Map<string, { revenue: number; quantity: number }>();
    
    for (const order of orders) {
      for (const item of order.items) {
        // Determine product type and ID based on the schema
        let key: string;
        if (item.gameId) {
          key = `game-${item.gameId}`;
        } else if (item.merchId) {
          key = `merch-${item.merchId}`;
        } else {
          continue; // Skip if neither gameId nor merchId is set
        }
        
        const current = productRevenue.get(key) || { revenue: 0, quantity: 0 };
        productRevenue.set(key, {
          revenue: current.revenue + item.priceCents * item.quantity,
          quantity: current.quantity + item.quantity,
        });
      }
    }

    // Get product names
    const topProductsData = await Promise.all(
      Array.from(productRevenue.entries())
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)
        .map(async ([key, data]) => {
          const [type, id] = key.split('-');
          let name = 'Unknown';
          
          if (type === 'game') {
            const game = await prisma.game.findUnique({ where: { id: parseInt(id) } });
            name = game?.title || 'Unknown Game';
          } else if (type === 'merch') {
            const merch = await prisma.merch.findUnique({ where: { id: parseInt(id) } });
            name = merch?.name || 'Unknown Merch';
          }
          
          return {
            name,
            revenue: data.revenue,
            quantity: data.quantity,
          };
        })
    );

    // Inventory Metrics
    const [games, merch] = await Promise.all([
      prisma.game.findMany({
        include: { inventory: true },
      }),
      prisma.merch.findMany({
        include: { inventory: true },
      }),
    ]);

    const lowStockThreshold = 10;
    const lowStockItems: Metrics['inventory']['lowStockItems'] = [];
    let outOfStockCount = 0;

    // Check game inventory
    for (const game of games) {
      const stock = game.inventory?.quantity || 0;
      if (stock === 0) {
        outOfStockCount++;
      } else if (stock < lowStockThreshold) {
        lowStockItems.push({
          name: game.title,
          stock,
          type: 'game',
        });
      }
    }

    // Check merch inventory
    for (const item of merch) {
      const totalStock = item.inventory?.reduce((sum, inv) => sum + inv.quantity, 0) || 0;
      if (totalStock === 0) {
        outOfStockCount++;
      } else if (totalStock < lowStockThreshold) {
        lowStockItems.push({
          name: item.name,
          stock: totalStock,
          type: 'merch',
        });
      }
    }

    // Performance Metrics (simplified - in production, use proper APM)
    const performanceMetrics = {
      apiRequests: {
        total: 0, // Would come from logging/APM
        averageResponseTime: 0,
        errorRate: 0,
      },
      database: {
        queryCount: 0, // Would come from Prisma middleware
        averageQueryTime: 0,
      },
    };

    const metrics: Metrics = {
      timestamp: new Date().toISOString(),
      period,
      business: {
        totalRevenue: totalRevenue / 100, // Convert to dollars
        orderCount,
        averageOrderValue: averageOrderValue / 100,
        topProducts: topProductsData,
      },
      inventory: {
        totalProducts: games.length + merch.length,
        lowStockItems: lowStockItems.sort((a, b) => a.stock - b.stock),
        outOfStockCount,
      },
      performance: performanceMetrics,
    };

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    logger.error('Metrics generation failed', error);
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}

function getStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}