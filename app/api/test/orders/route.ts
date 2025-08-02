import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/utils/error-handler';
import { isTestMode } from '@/app/api/admin/test-mode/route';

const testCustomers = [
  { name: 'Test Customer 1', email: 'test1@example.com' },
  { name: 'Test Customer 2', email: 'test2@example.com' },
  { name: 'Test Customer 3', email: 'test3@example.com' },
];

const testAddresses = [
  '123 Test Street, Test City, TS 12345',
  '456 Sample Ave, Demo Town, DM 67890',
  '789 Example Blvd, Trial City, TR 54321',
];

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Check if test mode is enabled
  if (!isTestMode()) {
    return NextResponse.json(
      { error: 'Test mode is not enabled' },
      { status: 403 }
    );
  }

  // Generate a single test order preview
  const games = await prisma.game.findMany({ take: 5 });
  const merch = await prisma.merch.findMany({ take: 5 });
  
  const customer = testCustomers[Math.floor(Math.random() * testCustomers.length)];
  const address = testAddresses[Math.floor(Math.random() * testAddresses.length)];
  
  const testOrder = {
    customer,
    shippingAddress: address,
    billingAddress: address,
    items: [
      ...(games.length > 0 ? [{
        type: 'game',
        item: games[0],
        quantity: 1,
        price: games[0].priceCents
      }] : []),
      ...(merch.length > 0 ? [{
        type: 'merch',
        item: merch[0],
        quantity: 2,
        price: merch[0].priceCents
      }] : [])
    ],
    subtotal: 0,
    shipping: 999,
    tax: 0,
    total: 0
  };
  
  testOrder.subtotal = testOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  testOrder.tax = Math.round(testOrder.subtotal * 0.08);
  testOrder.total = testOrder.subtotal + testOrder.shipping + testOrder.tax;
  
  return NextResponse.json({
    message: 'Test order preview',
    order: testOrder
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Check admin permission
  await requirePermission('admin:access');
  
  // Check if test mode is enabled
  if (!isTestMode()) {
    return NextResponse.json(
      { error: 'Test mode is not enabled' },
      { status: 403 }
    );
  }

  // Get available products
  const games = await prisma.game.findMany({ 
    where: { stock: { gt: 0 } },
    take: 10 
  });
  
  const merchItems = await prisma.merch.findMany({ 
    where: { stock: { gt: 0 } },
    take: 10 
  });
  
  if (games.length === 0 && merchItems.length === 0) {
    return NextResponse.json(
      { error: 'No products available for test order' },
      { status: 400 }
    );
  }

  // Generate random order
  const customer = testCustomers[Math.floor(Math.random() * testCustomers.length)];
  const address = testAddresses[Math.floor(Math.random() * testAddresses.length)];
  
  // Build order items
  const orderItems = [];
  let subtotal = 0;
  
  // Add 1-3 random items
  const itemCount = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < itemCount; i++) {
    const useGame = Math.random() > 0.5 && games.length > 0;
    
    if (useGame) {
      const game = games[Math.floor(Math.random() * games.length)];
      const quantity = Math.floor(Math.random() * 2) + 1;
      orderItems.push({
        itemType: 'game',
        gameId: game.id,
        quantity,
        priceCents: game.priceCents
      });
      subtotal += game.priceCents * quantity;
    } else if (merchItems.length > 0) {
      const merch = merchItems[Math.floor(Math.random() * merchItems.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      orderItems.push({
        itemType: 'merch',
        merchId: merch.id,
        merchSize: merch.sizes ? merch.sizes[0] : undefined,
        quantity,
        priceCents: merch.priceCents
      });
      subtotal += merch.priceCents * quantity;
    }
  }
  
  const shipping = subtotal > 5000 ? 0 : 999;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shipping + tax;
  
  // Create the order
  const order = await prisma.order.create({
    data: {
      customerEmail: customer.email,
      customerName: customer.name,
      shippingAddress: address,
      billingAddress: address,
      totalCents: total,
      shippingCents: shipping,
      taxCents: tax,
      status: 'paid',
      paymentIntentId: `pi_test_${Date.now()}`,
      paidAt: new Date(),
      items: {
        create: orderItems
      },
      statusHistory: {
        create: {
          status: 'paid',
          notes: 'Test order created via API'
        }
      }
    },
    include: {
      items: {
        include: {
          game: true,
          merch: true
        }
      }
    }
  });
  
  return NextResponse.json({
    message: 'Test order created successfully',
    order: {
      id: order.id,
      customerName: order.customerName,
      total: order.totalCents / 100,
      itemCount: order.items.length,
      viewUrl: `/admin/orders/${order.id}`
    }
  });
});