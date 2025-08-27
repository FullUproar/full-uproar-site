import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const detailed = searchParams.get('detailed') === 'true';
    
    // Fetch all games and merchandise
    const [games, merchandise] = await Promise.all([
      prisma.game.findMany({
        where: { archived: false },
        include: {
          inventory: true,
          orderItems: detailed ? {
            where: {
              order: {
                status: {
                  in: ['paid', 'processing', 'shipped', 'delivered']
                }
              }
            },
            select: {
              quantity: true,
              priceCents: true,
              order: {
                select: {
                  createdAt: true
                }
              }
            }
          } : false
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.merch.findMany({
        where: { archived: false },
        include: {
          inventory: true,
          orderItems: detailed ? {
            where: {
              order: {
                status: {
                  in: ['paid', 'processing', 'shipped', 'delivered']
                }
              }
            },
            select: {
              quantity: true,
              priceCents: true,
              order: {
                select: {
                  createdAt: true
                }
              }
            }
          } : false
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Process and combine products
    const allProducts = [
      ...games.map(game => ({
        id: game.id,
        name: game.title,
        sku: `GAME-${game.id.toString().padStart(8, '0')}`,
        category: 'GAME',
        priceCents: game.priceCents,
        stock: game.inventory?.quantity || 0,
        reorderPoint: 10, // Default reorder point
        lastRestocked: null,
        archived: game.archived,
        salesData: detailed ? calculateSalesMetrics(game.orderItems || []) : null,
        type: 'game' as const
      })),
      ...merchandise.map(merch => ({
        id: merch.id,
        name: merch.name,
        sku: `MERCH-${merch.id.toString().padStart(8, '0')}`,
        category: merch.category,
        priceCents: merch.priceCents,
        stock: merch.inventory?.reduce((sum, inv) => sum + inv.quantity, 0) || 0,
        reorderPoint: 10, // Default reorder point
        lastRestocked: null,
        archived: merch.archived,
        salesData: detailed ? calculateSalesMetrics(merch.orderItems || []) : null,
        type: 'merch' as const
      }))
    ];

    return NextResponse.json(allProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

function calculateSalesMetrics(orderItems: any[]) {
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  const recentItems = orderItems.filter(item => 
    new Date(item.order.createdAt) >= thirtyDaysAgo
  );
  
  return {
    totalSold: orderItems.reduce((sum, item) => sum + item.quantity, 0),
    totalRevenue: orderItems.reduce((sum, item) => sum + item.priceCents, 0) / 100,
    last30Days: {
      unitsSold: recentItems.reduce((sum, item) => sum + item.quantity, 0),
      revenue: recentItems.reduce((sum, item) => sum + item.priceCents, 0) / 100
    },
    averagePrice: orderItems.length > 0 
      ? orderItems.reduce((sum, item) => sum + item.priceCents, 0) / orderItems.length / 100
      : 0
  };
}