import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test data arrays
const testGames = [
  { name: 'Cosmic Chaos', description: 'An intergalactic adventure', priceCents: 2499, stock: 100 },
  { name: 'Zombie Apocalypse Now', description: 'Survive the undead hordes', priceCents: 3999, stock: 50 },
  { name: 'Pixel Warrior', description: 'Retro-style combat', priceCents: 1999, stock: 200 },
  { name: 'Speed Demon Racing', description: 'High-octane racing action', priceCents: 4999, stock: 75 },
  { name: 'Mystery Manor', description: 'Solve puzzles in a haunted house', priceCents: 2999, stock: 150 },
  { name: 'Space Pirates', description: 'Plunder the galaxy', priceCents: 3499, stock: 5 }, // Low stock
  { name: 'Dragon Quest Ultra', description: 'Epic fantasy RPG', priceCents: 5999, stock: 0 }, // Out of stock
  { name: 'Ninja Shadows', description: 'Stealth action gameplay', priceCents: 3999, stock: 80 },
  { name: 'Robot Revolution', description: 'AI uprising survival', priceCents: 4499, stock: 60 },
  { name: 'Time Traveler', description: 'Change history itself', priceCents: 4999, stock: 90 },
];

const testMerch = [
  { name: 'Fugly Logo T-Shirt', description: 'Classic cotton tee', category: 'apparel', priceCents: 2499, hasInventory: true, stockPerSize: 40 },
  { name: 'Chaos Hoodie', description: 'Warm and chaotic', category: 'apparel', priceCents: 4999, hasInventory: true, stockPerSize: 20 },
  { name: 'Pixel Mug', description: 'For your morning chaos', category: 'accessories', priceCents: 1499, hasInventory: true, stock: 300 },
  { name: 'Gaming Mouse Pad', description: 'Extra large for epic battles', category: 'accessories', priceCents: 1999, hasInventory: true, stock: 150 },
  { name: 'Collector Pin Set', description: 'Limited edition pins', category: 'collectibles', priceCents: 999, hasInventory: true, stock: 10 }, // Low stock
  { name: 'Poster Pack', description: 'Game art collection', category: 'prints', priceCents: 1999, hasInventory: true, stock: 0 }, // Out of stock
  { name: 'Sticker Bomb Pack', description: '50 random stickers', category: 'accessories', priceCents: 799, hasInventory: true, stock: 500 },
  { name: 'Beanie Hat', description: 'Keep warm in style', category: 'apparel', priceCents: 1999, hasInventory: true, stockPerSize: 15 },
];

const testCustomers = [
  { email: 'john.gamer@test.com', name: 'John Gamer' },
  { email: 'jane.player@test.com', name: 'Jane Player' },
  { email: 'bob.speedrun@test.com', name: 'Bob Speedrun' },
  { email: 'alice.pro@test.com', name: 'Alice Pro' },
  { email: 'charlie.casual@test.com', name: 'Charlie Casual' },
];

const orderStatuses = ['pending', 'paid', 'processing', 'picking', 'packing', 'ready', 'shipped', 'delivered', 'cancelled'];

async function seedTestData() {
  console.log('🌱 Starting test data seed...');

  try {
    // Create test admin user
    console.log('Creating test admin user...');
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@fullproar.test' },
      update: {},
      create: {
        email: 'admin@fullproar.test',
        username: 'testadmin',
        displayName: 'Test Admin',
        role: 'SUPER_ADMIN',
      }
    });

    // Create test games
    console.log('Creating test games...');
    const games = [];
    for (const gameData of testGames) {
      const game = await prisma.game.create({
        data: {
          title: gameData.name,
          description: gameData.description,
          priceCents: gameData.priceCents,
          slug: gameData.name.toLowerCase().replace(/\s+/g, '-'),
          imageUrl: `https://via.placeholder.com/400x300?text=${encodeURIComponent(gameData.name)}`,
          featured: Math.random() > 0.7,
          stock: gameData.stock,
          players: '2-4',
          timeToPlay: '30-60 min',
          ageRating: '12+',
          launchDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date in past year
        }
      });
      games.push(game);
    }

    // Create test merch
    console.log('Creating test merchandise...');
    const merchItems = [];
    for (const merchData of testMerch) {
      const merch = await prisma.merch.create({
        data: {
          name: merchData.name,
          description: merchData.description,
          category: merchData.category,
          priceCents: merchData.priceCents,
          slug: merchData.name.toLowerCase().replace(/\s+/g, '-'),
          imageUrl: `https://via.placeholder.com/400x400?text=${encodeURIComponent(merchData.name)}`,
          featured: Math.random() > 0.7,
          sizes: merchData.category === 'apparel' ? 'S,M,L,XL,XXL' : undefined,
        }
      });
      
      // Create inventory for merch
      if (merchData.hasInventory) {
        if (merchData.category === 'apparel' && merchData.stockPerSize) {
          // Create inventory for each size
          const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
          for (const size of sizes) {
            await prisma.inventory.create({
              data: {
                merchId: merch.id,
                size,
                quantity: merchData.stockPerSize,
              }
            });
          }
        } else if (merchData.stock !== undefined) {
          // Create single inventory entry
          await prisma.inventory.create({
            data: {
              merchId: merch.id,
              quantity: merchData.stock,
            }
          });
        }
      }
      
      merchItems.push(merch);
    }

    // Create test orders
    console.log('Creating test orders...');
    let orderCount = 0;
    for (let i = 0; i < 50; i++) {
      const customer = testCustomers[Math.floor(Math.random() * testCustomers.length)];
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const itemCount = Math.floor(Math.random() * 4) + 1;
      
      // Build order items
      const orderItems = [];
      let subtotal = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const isGame = Math.random() > 0.5;
        const item = isGame 
          ? games[Math.floor(Math.random() * games.length)]
          : merchItems[Math.floor(Math.random() * merchItems.length)];
        
        const quantity = Math.floor(Math.random() * 3) + 1;
        const itemTotal = item.priceCents * quantity;
        subtotal += itemTotal;
        
        orderItems.push({
          itemType: isGame ? 'game' : 'merch',
          gameId: isGame ? item.id : undefined,
          merchId: !isGame ? item.id : undefined,
          merchSize: !isGame && (item as any).sizes ? (item as any).sizes.split(',')[Math.floor(Math.random() * (item as any).sizes.split(',').length)] : undefined,
          quantity,
          priceCents: item.priceCents,
        });
      }
      
      const shipping = subtotal > 5000 ? 0 : 999;
      const tax = Math.round(subtotal * 0.08);
      const total = subtotal + shipping + tax;
      
      const order = await prisma.order.create({
        data: {
          customerEmail: customer.email,
          customerName: customer.name,
          shippingAddress: `${Math.floor(Math.random() * 9999)} Test Street, Test City, TS 12345`,
          billingAddress: `${Math.floor(Math.random() * 9999)} Test Street, Test City, TS 12345`,
          totalCents: total,
          shippingCents: shipping,
          taxCents: tax,
          status,
          paymentIntentId: status !== 'pending' ? `pi_test_${Date.now()}_${i}` : undefined,
          paidAt: ['paid', 'processing', 'picking', 'packing', 'ready', 'shipped', 'delivered'].includes(status) 
            ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) 
            : undefined,
          shippedAt: ['shipped', 'delivered'].includes(status)
            ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            : undefined,
          deliveredAt: status === 'delivered'
            ? new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000)
            : undefined,
          items: {
            create: orderItems
          },
          statusHistory: {
            create: {
              status
            }
          }
        }
      });
      
      orderCount++;
      
      // Create some returns for delivered orders
      if (status === 'delivered' && Math.random() > 0.7) {
        const returnStatus = ['requested', 'approved', 'received', 'completed'][Math.floor(Math.random() * 4)];
        
        // Get the actual order items to reference them properly
        const createdOrder = await prisma.order.findUnique({
          where: { id: order.id },
          include: { items: true }
        });
        
        if (createdOrder && createdOrder.items.length > 0) {
          await prisma.return.create({
            data: {
              rmaNumber: `RMA${Date.now()}${i}`,
              orderId: order.id,
              customerEmail: customer.email,
              status: returnStatus,
              reason: ['defective', 'wrong_item', 'not_as_described', 'no_longer_needed'][Math.floor(Math.random() * 4)],
              customerNotes: 'Test return reason',
              refundAmountCents: returnStatus === 'completed' ? Math.round(total * 0.9) : undefined,
              items: {
                create: [{
                  orderItemId: createdOrder.items[0].id,
                  quantity: 1,
                  reason: 'Testing return',
                  condition: 'like_new'
                }]
              }
            }
          });
        }
      }
    }
    
    console.log(`✅ Created ${orderCount} test orders`);

    // Create test support tickets
    console.log('Creating test support tickets...');
    const ticketCount = 15;
    for (let i = 0; i < ticketCount; i++) {
      const customer = testCustomers[Math.floor(Math.random() * testCustomers.length)];
      const ticketStatus = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'][Math.floor(Math.random() * 5)];
      
      await prisma.supportTicket.create({
        data: {
          ticketNumber: `TKT${Date.now()}${i}`,
          customerName: customer.name,
          customerEmail: customer.email,
          category: ['order_issue', 'payment_issue', 'shipping', 'product_question', 'other'][Math.floor(Math.random() * 5)],
          priority: ['low', 'normal', 'high', 'urgent'][Math.floor(Math.random() * 4)],
          status: ticketStatus,
          subject: `Test ticket ${i + 1}`,
          messages: {
            create: [
              {
                senderType: 'customer',
                message: 'I have an issue with my order. Can you help?',
                isInternal: false
              },
              {
                senderType: 'staff',
                message: 'I\'d be happy to help you with that. Let me look into it.',
                isInternal: false
              }
            ]
          }
        }
      });
    }
    
    console.log(`✅ Created ${ticketCount} test support tickets`);

    // Summary
    console.log('\n📊 Test Data Summary:');
    console.log(`- Games: ${games.length}`);
    console.log(`- Merchandise: ${merchItems.length}`);
    console.log(`- Orders: ${orderCount}`);
    console.log(`- Support Tickets: ${ticketCount}`);
    console.log(`- Test Admin: admin@fullproar.test (password: testadmin123)`);
    
    console.log('\n✅ Test data seeding completed!');
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedTestData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });