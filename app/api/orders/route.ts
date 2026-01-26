import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';

// Store open status - controlled by env var NEXT_PUBLIC_STORE_OPEN
const STORE_OPEN = process.env.NEXT_PUBLIC_STORE_OPEN === 'true';

// Custom error for inventory issues
class InventoryError extends Error {
  constructor(message: string, public itemName: string) {
    super(message);
    this.name = 'InventoryError';
  }
}

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

    if (body.items.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one item' }, { status: 400 });
    }

    // Use a serializable transaction to prevent race conditions
    // This ensures atomic stock check + reservation
    const result = await prisma.$transaction(async (tx) => {
      let subtotalCents = 0;
      const orderItems: Array<{
        itemType: string;
        gameId?: number;
        merchId?: number;
        merchSize?: string | null;
        quantity: number;
        priceCents: number;
        isPrintify?: boolean;
      }> = [];

      // Process each item with atomic stock check and reservation
      for (const item of body.items) {
        if (item.itemType === 'game') {
          // Fetch game with lock (FOR UPDATE in Serializable)
          const game = await tx.game.findUnique({
            where: { id: item.gameId }
          });

          if (!game) {
            throw new InventoryError(`Game not found`, `Game ID: ${item.gameId}`);
          }

          // Get or create GameInventory record
          let gameInventory = await tx.gameInventory.findUnique({
            where: { gameId: item.gameId }
          });

          if (!gameInventory) {
            // Create GameInventory from Game.stock if it doesn't exist
            gameInventory = await tx.gameInventory.create({
              data: {
                gameId: item.gameId,
                quantity: game.stock,
                reserved: 0
              }
            });
          }

          // Check available stock (quantity - reserved)
          const availableStock = gameInventory.quantity - gameInventory.reserved;
          if (availableStock < item.quantity) {
            throw new InventoryError(
              `Insufficient stock for ${game.title}. Available: ${availableStock}`,
              game.title
            );
          }

          // Reserve the inventory atomically
          const reserveResult = await tx.gameInventory.updateMany({
            where: {
              gameId: item.gameId,
              // Double-check available stock in the same query (prevents race)
              quantity: { gte: gameInventory.reserved + item.quantity }
            },
            data: {
              reserved: { increment: item.quantity }
            }
          });

          if (reserveResult.count === 0) {
            throw new InventoryError(
              `Failed to reserve stock for ${game.title}. Item may have been purchased by another customer.`,
              game.title
            );
          }

          // Also sync Game.stock for backward compatibility
          await tx.game.update({
            where: { id: item.gameId },
            data: { stock: { decrement: item.quantity } }
          });

          subtotalCents += game.priceCents * item.quantity;
          orderItems.push({
            itemType: 'game',
            gameId: item.gameId,
            quantity: item.quantity,
            priceCents: game.priceCents
          });

        } else if (item.itemType === 'merch') {
          const merch = await tx.merch.findUnique({
            where: { id: item.merchId }
          });

          if (!merch) {
            throw new InventoryError(`Merchandise not found`, `Merch ID: ${item.merchId}`);
          }

          // For POD items (Printify), no inventory management needed
          if (merch.isPrintify) {
            subtotalCents += merch.priceCents * item.quantity;
            orderItems.push({
              itemType: 'merch',
              merchId: item.merchId,
              merchSize: item.merchSize || null,
              quantity: item.quantity,
              priceCents: merch.priceCents,
              isPrintify: true
            });
            continue;
          }

          // For regular inventory items, check and reserve atomically
          const inventory = await tx.inventory.findFirst({
            where: {
              merchId: item.merchId,
              size: item.merchSize || null
            }
          });

          if (!inventory) {
            const sizeText = item.merchSize ? ` (Size: ${item.merchSize})` : '';
            throw new InventoryError(
              `${merch.name}${sizeText} is not available`,
              merch.name
            );
          }

          const availableStock = inventory.quantity - inventory.reserved;
          if (availableStock < item.quantity) {
            const sizeText = item.merchSize ? ` (${item.merchSize})` : '';
            throw new InventoryError(
              `Insufficient stock for ${merch.name}${sizeText}. Available: ${availableStock}`,
              merch.name
            );
          }

          // Reserve inventory atomically with double-check
          const reserveResult = await tx.inventory.updateMany({
            where: {
              merchId: item.merchId,
              size: item.merchSize || null,
              // Double-check available stock in the same query (prevents race)
              quantity: { gte: inventory.reserved + item.quantity }
            },
            data: {
              reserved: { increment: item.quantity }
            }
          });

          if (reserveResult.count === 0) {
            const sizeText = item.merchSize ? ` (${item.merchSize})` : '';
            throw new InventoryError(
              `Failed to reserve ${merch.name}${sizeText}. Item may have been purchased by another customer.`,
              merch.name
            );
          }

          subtotalCents += merch.priceCents * item.quantity;
          orderItems.push({
            itemType: 'merch',
            merchId: item.merchId,
            merchSize: item.merchSize || null,
            quantity: item.quantity,
            priceCents: merch.priceCents,
            isPrintify: false
          });
        }
      }

      // Calculate shipping (simple flat rate for now)
      const shippingCents = subtotalCents >= 5000 ? 0 : 999; // Free shipping over $50

      // Calculate tax (simple 8% for now)
      const taxCents = Math.round((subtotalCents + shippingCents) * 0.08);

      const totalCents = subtotalCents + shippingCents + taxCents;

      // Create the order (still inside transaction)
      const order = await tx.order.create({
        data: {
          customerEmail: body.customerEmail,
          customerName: body.customerName,
          customerPhone: body.customerPhone,
          shippingAddress: body.shippingAddress,
          billingAddress: body.billingAddress || body.shippingAddress,
          totalCents,
          shippingCents,
          taxCents,
          status: 'pending',
          items: {
            create: orderItems.map(item => ({
              itemType: item.itemType,
              gameId: item.gameId,
              merchId: item.merchId,
              merchSize: item.merchSize,
              quantity: item.quantity,
              priceCents: item.priceCents
            }))
          },
          statusHistory: {
            create: {
              status: 'pending',
              notes: 'Order created - inventory reserved'
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

      return order;
    }, {
      // Use Serializable isolation to prevent phantom reads and race conditions
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10000, // 10 seconds max wait for transaction slot
      timeout: 30000, // 30 seconds timeout for the transaction
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Error creating order:', error);

    // Return specific error messages for inventory issues
    if (error instanceof InventoryError) {
      return NextResponse.json({
        error: error.message,
        itemName: error.itemName
      }, { status: 400 });
    }

    // Handle Prisma transaction errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2034') {
        // Transaction conflict - another order grabbed the inventory
        return NextResponse.json({
          error: 'Unable to complete order due to high demand. Please try again.'
        }, { status: 409 });
      }
    }

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

    // Use transaction for status updates that affect inventory
    const order = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!existingOrder) {
        throw new Error('Order not found');
      }

      // Prevent invalid status transitions
      const invalidTransitions: Record<string, string[]> = {
        'paid': ['pending'], // Can't go back to pending after paid
        'shipped': ['pending', 'payment_pending'], // Can't go back before paid
        'delivered': ['pending', 'payment_pending', 'paid'], // Can only come from shipped
        'refunded': ['pending', 'payment_pending'], // Must be paid first
      };

      if (invalidTransitions[existingOrder.status]?.includes(body.status)) {
        throw new Error(`Cannot change status from ${existingOrder.status} to ${body.status}`);
      }

      // Update the order
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: body.status,
          trackingNumber: body.trackingNumber,
          notes: body.notes,
          ...(body.status === 'paid' && { paidAt: new Date() }),
          ...(body.status === 'shipped' && { shippedAt: new Date() }),
          ...(body.status === 'delivered' && { deliveredAt: new Date() }),
          ...(body.status === 'cancelled' && { cancelledAt: new Date() }),
          ...(body.status === 'refunded' && { refundedAt: new Date() }),
          statusHistory: {
            create: {
              status: body.status,
              notes: body.statusNote || `Status changed to ${body.status}`
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

      // Handle inventory changes based on status
      if (body.status === 'cancelled' && existingOrder.status !== 'cancelled') {
        // Release reserved inventory
        for (const item of existingOrder.items) {
          if (item.itemType === 'game' && item.gameId) {
            await tx.gameInventory.updateMany({
              where: { gameId: item.gameId },
              data: {
                reserved: { decrement: item.quantity }
              }
            });
            // Restore Game.stock for backward compatibility
            await tx.game.update({
              where: { id: item.gameId },
              data: { stock: { increment: item.quantity } }
            });
          } else if (item.itemType === 'merch' && item.merchId) {
            await tx.inventory.updateMany({
              where: {
                merchId: item.merchId,
                size: item.merchSize || null
              },
              data: {
                reserved: { decrement: item.quantity }
              }
            });
          }
        }
      }

      // If order is shipped, convert reserved to sold (decrement both quantity and reserved)
      if (body.status === 'shipped' && existingOrder.status !== 'shipped') {
        for (const item of existingOrder.items) {
          if (item.itemType === 'merch' && item.merchId) {
            await tx.inventory.updateMany({
              where: {
                merchId: item.merchId,
                size: item.merchSize || null
              },
              data: {
                quantity: { decrement: item.quantity },
                reserved: { decrement: item.quantity }
              }
            });
          }
          // For games, quantity is already decremented at order time, just clear reserved
          if (item.itemType === 'game' && item.gameId) {
            await tx.gameInventory.updateMany({
              where: { gameId: item.gameId },
              data: {
                quantity: { decrement: item.quantity },
                reserved: { decrement: item.quantity }
              }
            });
          }
        }
      }

      return updatedOrder;
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({
      error: error.message || 'Failed to update order'
    }, { status: error.message === 'Order not found' ? 404 : 500 });
  }
}
