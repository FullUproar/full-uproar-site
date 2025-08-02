import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testOrdersAPI() {
  console.log('Testing orders API response structure...\n');
  
  try {
    // First, let's check what the raw database query returns
    const orders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        items: {
          include: {
            game: {
              select: {
                title: true,
                slug: true
              }
            },
            merch: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        },
        statusHistory: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
    
    console.log(`Found ${orders.length} orders\n`);
    
    // Check the first order
    if (orders.length > 0) {
      console.log('First order structure:');
      console.log('ID:', orders[0].id);
      console.log('Customer Name:', orders[0].customerName);
      console.log('Customer Email:', orders[0].customerEmail);
      console.log('Status:', orders[0].status);
      console.log('Total:', orders[0].totalCents / 100);
      console.log('Created:', orders[0].createdAt);
      console.log('Has user?', !!orders[0].user);
      console.log('Items count:', orders[0].items.length);
    }
    
    // Now let's check what stats would be
    const stats = await prisma.order.aggregate({
      _count: true,
      _sum: {
        totalCents: true
      },
      where: {
        status: {
          notIn: ['cancelled', 'refunded']
        }
      }
    });
    
    console.log('\nStats calculation:');
    console.log('Total orders (non-cancelled):', stats._count);
    console.log('Total revenue:', (stats._sum.totalCents || 0) / 100);
    
    // Check the expected API response structure
    const apiResponse = {
      orders: orders.map(order => ({
        ...order,
        refundAmountCents: order.refundAmountCents || 0,
        shippingCents: order.shippingCents || 0,
        taxCents: order.taxCents || 0
      })),
      pagination: {
        page: 1,
        limit: 20,
        totalPages: 3,
        totalCount: 52
      },
      stats: {
        totalOrders: stats._count,
        totalRevenue: stats._sum.totalCents || 0,
        pendingOrders: 0,
        shippedToday: 0
      }
    };
    
    console.log('\nExpected API response structure:');
    console.log('- orders: Array of', apiResponse.orders.length, 'orders');
    console.log('- pagination: Object with page info');
    console.log('- stats: Object with aggregated data');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOrdersAPI();