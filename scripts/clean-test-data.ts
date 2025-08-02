import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestData() {
  console.log('🧹 Starting test data cleanup...');

  try {
    // Delete test support tickets
    console.log('Removing test support tickets...');
    const deletedTickets = await prisma.supportTicket.deleteMany({
      where: {
        OR: [
          { customerEmail: { contains: '@test.com' } },
          { ticketNumber: { startsWith: 'TKT' } }
        ]
      }
    });
    console.log(`✅ Deleted ${deletedTickets.count} test support tickets`);

    // Delete test returns
    console.log('Removing test returns...');
    const deletedReturns = await prisma.return.deleteMany({
      where: {
        OR: [
          { customerEmail: { contains: '@test.com' } },
          { rmaNumber: { startsWith: 'RMA' } }
        ]
      }
    });
    console.log(`✅ Deleted ${deletedReturns.count} test returns`);

    // Delete test orders
    console.log('Removing test orders...');
    const deletedOrders = await prisma.order.deleteMany({
      where: {
        OR: [
          { customerEmail: { contains: '@test.com' } },
          { paymentIntentId: { startsWith: 'pi_test_' } }
        ]
      }
    });
    console.log(`✅ Deleted ${deletedOrders.count} test orders`);

    // Delete test games
    console.log('Removing test games...');
    const testGameNames = [
      'Cosmic Chaos', 'Zombie Apocalypse Now', 'Pixel Warrior', 
      'Speed Demon Racing', 'Mystery Manor', 'Space Pirates',
      'Dragon Quest Ultra', 'Ninja Shadows', 'Robot Revolution', 'Time Traveler'
    ];
    const deletedGames = await prisma.game.deleteMany({
      where: {
        title: { in: testGameNames }
      }
    });
    console.log(`✅ Deleted ${deletedGames.count} test games`);

    // Delete test merch
    console.log('Removing test merchandise...');
    const testMerchNames = [
      'Fugly Logo T-Shirt', 'Chaos Hoodie', 'Pixel Mug', 
      'Gaming Mouse Pad', 'Collector Pin Set', 'Poster Pack',
      'Sticker Bomb Pack', 'Beanie Hat'
    ];
    const deletedMerch = await prisma.merch.deleteMany({
      where: {
        name: { in: testMerchNames }
      }
    });
    console.log(`✅ Deleted ${deletedMerch.count} test merchandise items`);

    // Delete test admin user
    console.log('Removing test admin user...');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: 'admin@fullproar.test'
      }
    });
    console.log(`✅ Deleted ${deletedUsers.count} test admin users`);

    // Summary
    console.log('\n📊 Cleanup Summary:');
    console.log(`- Support Tickets: ${deletedTickets.count}`);
    console.log(`- Returns: ${deletedReturns.count}`);
    console.log(`- Orders: ${deletedOrders.count}`);
    console.log(`- Games: ${deletedGames.count}`);
    console.log(`- Merchandise: ${deletedMerch.count}`);
    console.log(`- Test Users: ${deletedUsers.count}`);
    
    console.log('\n✅ Test data cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error cleaning test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Add confirmation prompt
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('⚠️  This will delete all test data. Are you sure? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    cleanTestData()
      .catch((error) => {
        console.error(error);
        process.exit(1);
      })
      .finally(() => {
        rl.close();
      });
  } else {
    console.log('Cleanup cancelled.');
    rl.close();
  }
});