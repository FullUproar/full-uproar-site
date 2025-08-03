import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearTestOrders() {
  console.log('🧹 Starting test order cleanup...\n');

  try {
    // First, let's see what we have
    const orderCount = await prisma.order.count();
    const orderItemCount = await prisma.orderItem.count();
    
    console.log(`Found ${orderCount} orders with ${orderItemCount} order items\n`);

    if (orderCount === 0) {
      console.log('No orders to delete!');
      return;
    }

    // Show some order details
    const orders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        items: {
          include: {
            game: true,
            merch: true
          }
        }
      }
    });

    console.log('Recent orders:');
    orders.forEach(order => {
      const itemCount = order.items.length;
      const total = (order.totalCents / 100).toFixed(2);
      const userName = order.user?.displayName || order.user?.email || 'Guest';
      console.log(`- Order ${order.id.substring(0, 8)} by ${userName} - $${total} (${itemCount} items) - ${order.status}`);
    });

    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will delete ALL orders and order items!');
    console.log('This action cannot be undone.\n');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise<string>((resolve) => {
      readline.question('Type "DELETE ALL ORDERS" to confirm: ', resolve);
    });
    readline.close();

    if (answer !== 'DELETE ALL ORDERS') {
      console.log('\n❌ Cancelled - no orders were deleted');
      return;
    }

    console.log('\n🗑️  Deleting all orders...');

    // Delete in correct order to avoid foreign key constraints
    // 1. Delete order status history
    const statusHistoryDeleted = await prisma.orderStatusHistory.deleteMany({});
    console.log(`✓ Deleted ${statusHistoryDeleted.count} order status history records`);

    // 2. Delete order items
    const itemsDeleted = await prisma.orderItem.deleteMany({});
    console.log(`✓ Deleted ${itemsDeleted.count} order items`);

    // 3. Delete orders
    const ordersDeleted = await prisma.order.deleteMany({});
    console.log(`✓ Deleted ${ordersDeleted.count} orders`);

    // 4. Reset any reserved inventory
    const inventoryReset = await prisma.inventory.updateMany({
      where: { reserved: { gt: 0 } },
      data: { reserved: 0 }
    });
    console.log(`✓ Reset reserved inventory for ${inventoryReset.count} items`);

    const gameInventoryReset = await prisma.gameInventory.updateMany({
      where: { reserved: { gt: 0 } },
      data: { reserved: 0 }
    });
    console.log(`✓ Reset reserved game inventory for ${gameInventoryReset.count} items`);

    console.log('\n✅ Test order cleanup complete!');
    console.log('You can now delete games and merchandise without order constraints.');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
clearTestOrders().catch(console.error);