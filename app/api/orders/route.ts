import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const email = searchParams.get('email');
    
    const where: any = {};
    if (status) where.status = status;
    if (email) where.customerEmail = email;
    
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            game: true,
            merch: true
          }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.customerEmail || !body.customerName || !body.shippingAddress || !body.items || !Array.isArray(body.items)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Calculate totals
    let subtotalCents = 0;
    const orderItems = [];
    
    // Process each item and check inventory
    for (const item of body.items) {
      if (item.itemType === 'game') {
        const game = await prisma.game.findUnique({
          where: { id: item.gameId }
        });
        
        if (!game) {
          return NextResponse.json({ error: `Game ${item.gameId} not found` }, { status: 400 });
        }
        
        // Check stock
        if (game.stock < item.quantity) {
          return NextResponse.json({ 
            error: `Insufficient stock for ${game.title}. Available: ${game.stock}` 
          }, { status: 400 });
        }
        
        subtotalCents += game.priceCents * item.quantity;
        orderItems.push({
          itemType: 'game',
          gameId: item.gameId,
          quantity: item.quantity,
          priceCents: game.priceCents
        });
      } else if (item.itemType === 'merch') {
        const inventory = await prisma.inventory.findUnique({
          where: {
            merchId_size: {
              merchId: item.merchId,
              size: item.merchSize || null
            }
          },
          include: { merch: true }
        });
        
        if (!inventory) {
          return NextResponse.json({ error: `Merch item not found` }, { status: 400 });
        }
        
        // Check stock
        const availableStock = inventory.quantity - inventory.reserved;
        if (availableStock < item.quantity) {
          return NextResponse.json({ 
            error: `Insufficient stock for ${inventory.merch.name}${item.merchSize ? ` (${item.merchSize})` : ''}. Available: ${availableStock}` 
          }, { status: 400 });
        }
        
        subtotalCents += inventory.merch.priceCents * item.quantity;
        orderItems.push({
          itemType: 'merch',
          merchId: item.merchId,
          merchSize: item.merchSize,
          quantity: item.quantity,
          priceCents: inventory.merch.priceCents
        });
      }
    }
    
    // Calculate shipping (simple flat rate for now)
    const shippingCents = 999; // $9.99 flat rate
    
    // Calculate tax (simple 8% for now)
    const taxCents = Math.round((subtotalCents + shippingCents) * 0.08);
    
    const totalCents = subtotalCents + shippingCents + taxCents;
    
    // Create the order
    const order = await prisma.order.create({
      data: {
        customerEmail: body.customerEmail,
        customerName: body.customerName,
        shippingAddress: body.shippingAddress,
        billingAddress: body.billingAddress || body.shippingAddress,
        totalCents,
        shippingCents,
        taxCents,
        status: 'pending',
        items: {
          create: orderItems
        },
        statusHistory: {
          create: {
            status: 'pending',
            note: 'Order created'
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
    
    // Reserve inventory for merch items
    for (const item of body.items) {
      if (item.itemType === 'merch') {
        await prisma.inventory.update({
          where: {
            merchId_size: {
              merchId: item.merchId,
              size: item.merchSize || null
            }
          },
          data: {
            reserved: {
              increment: item.quantity
            }
          }
        });
      } else if (item.itemType === 'game') {
        // Reduce game stock
        await prisma.game.update({
          where: { id: item.gameId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }
    }
    
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

// Update order status
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    
    const body = await request.json();
    
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: body.status,
        trackingNumber: body.trackingNumber,
        notes: body.notes,
        statusHistory: {
          create: {
            status: body.status,
            note: body.statusNote
          }
        }
      },
      include: {
        items: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    // If order is cancelled, release reserved inventory
    if (body.status === 'cancelled') {
      const merchItems = order.items.filter(item => item.itemType === 'merch');
      for (const item of merchItems) {
        await prisma.inventory.update({
          where: {
            merchId_size: {
              merchId: item.merchId!,
              size: item.merchSize || null
            }
          },
          data: {
            reserved: {
              decrement: item.quantity
            }
          }
        });
      }
      
      // Restore game stock
      const gameItems = order.items.filter(item => item.itemType === 'game');
      for (const item of gameItems) {
        await prisma.game.update({
          where: { id: item.gameId! },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
      }
    }
    
    // If order is shipped, convert reserved to sold
    if (body.status === 'shipped') {
      const merchItems = order.items.filter(item => item.itemType === 'merch');
      for (const item of merchItems) {
        await prisma.inventory.update({
          where: {
            merchId_size: {
              merchId: item.merchId!,
              size: item.merchSize || null
            }
          },
          data: {
            quantity: {
              decrement: item.quantity
            },
            reserved: {
              decrement: item.quantity
            }
          }
        });
      }
    }
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}