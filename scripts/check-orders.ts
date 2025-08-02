import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrders() {
  console.log('Checking all orders in database...\n');
  
  try {
    // Get all orders
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            game: true,
            merch: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Total orders found: ${orders.length}\n`);
    
    if (orders.length === 0) {
      console.log('No orders found in the database.');
    } else {
      orders.forEach((order, index) => {
        console.log(`Order ${index + 1}:`);
        console.log(`  ID: ${order.id}`);
        console.log(`  Customer: ${order.customerName} (${order.customerEmail})`);
        console.log(`  Status: ${order.status}`);
        console.log(`  Total: $${(order.totalCents / 100).toFixed(2)}`);
        console.log(`  Created: ${order.createdAt}`);
        console.log(`  Items: ${order.items.length}`);
        order.items.forEach(item => {
          const product = item.game || item.merch;
          console.log(`    - ${product?.title || product?.name} x${item.quantity}`);
        });
        console.log('');
      });
    }
    
    // Check for recent orders (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOrders = orders.filter(order => new Date(order.createdAt) > oneHourAgo);
    
    console.log(`\nOrders created in the last hour: ${recentOrders.length}`);
    
  } catch (error) {
    console.error('Error checking orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();