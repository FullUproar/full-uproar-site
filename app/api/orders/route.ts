import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// Store is not yet open for orders - set to true when ready to launch
const STORE_OPEN = false;

// Order management API routes

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
    // Check if store is open (allow admins to bypass for testing)
    if (!STORE_OPEN) {
      const { userId } = await auth();
      let isAdmin = false;

      if (userId) {
        const user = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { role: true }
        });
        isAdmin = user?.role === 'ADMIN';
      }

      if (!isAdmin) {
        return NextResponse.json({
          error: 'Store coming soon! Our game mods launch Spring 2026.'
        }, { status: 503 });
      }
    }

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
        // First check if the merch item exists
        const merch = await prisma.merch.findUnique({
          where: { id: item.merchId }
        });
        
        if (!merch) {
          return NextResponse.json({ error: `Merchandise item ${item.merchId} not found` }, { status: 400 });
        }
        
        // For POD items, we don't need inventory records
        if (merch.isPrintify) {
          subtotalCents += merch.priceCents * item.quantity;
          orderItems.push({
            itemType: 'merch',
            merchId: item.merchId,
            merchSize: item.merchSize,
            quantity: item.quantity,
            priceCents: merch.priceCents
          });
        } else {
          // For regular inventory items, check inventory
          const inventory = await prisma.inventory.findFirst({
            where: {
              merchId: item.merchId,
              size: item.merchSize || null
            }
          });
          
          if (!inventory) {
            // If no inventory record exists, check if it's a non-sized item
            if (!item.merchSize) {
              // Create an inventory record for non-sized items if it doesn't exist
              const newInventory = await prisma.inventory.create({
                data: {
                  merchId: item.merchId,
                  size: null,
                  quantity: 0,
                  reserved: 0
                }
              });
              return NextResponse.json({ 
                error: `No stock available for ${merch.name}` 
              }, { status: 400 });
            }
            return NextResponse.json({ error: `Size ${item.merchSize} not available for ${merch.name}` }, { status: 400 });
          }
          
          const availableStock = inventory.quantity - inventory.reserved;
          if (availableStock < item.quantity) {
            return NextResponse.json({ 
              error: `Insufficient stock for ${merch.name}${item.merchSize ? ` (${item.merchSize})` : ''}. Available: ${availableStock}` 
            }, { status: 400 });
          }
          
          subtotalCents += merch.priceCents * item.quantity;
          orderItems.push({
            itemType: 'merch',
            merchId: item.merchId,
            merchSize: item.merchSize,
            quantity: item.quantity,
            priceCents: merch.priceCents
          });
        }
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
            notes: 'Order created'
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
    
    // Reserve inventory for merch items (skip Printify POD items) and reduce game stock
    for (const item of orderItems) {
      if (item.itemType === 'merch' && item.merchId) {
        const merch = await prisma.merch.findUnique({
          where: { id: item.merchId }
        });
        
        // Only reserve inventory for non-POD items
        if (!merch?.isPrintify) {
          await prisma.inventory.updateMany({
            where: {
              merchId: item.merchId,
              size: item.merchSize || null
            },
            data: {
              reserved: {
                increment: item.quantity
              }
            }
          });
        }
      } else if (item.itemType === 'game' && item.gameId) {
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
            notes: body.statusNote
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
        await prisma.inventory.updateMany({
          where: {
            merchId: item.merchId!,
            size: item.merchSize || null
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
        await prisma.inventory.updateMany({
          where: {
            merchId: item.merchId!,
            size: item.merchSize || null
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