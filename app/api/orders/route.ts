import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth as getSession } from '@/lib/auth-config';
import { Prisma } from '@prisma/client';
import { calculateTaxSync } from '@/lib/tax';
import { ADMIN_ROLES } from '@/lib/constants';
import { requireAdmin } from '@/lib/auth/require-admin';

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
    // Admin-only: listing all orders requires admin access
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

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
    // Get user ID if authenticated (needed for promo code tracking)
    const session = await getSession();
    const userId = session?.user?.id;

    // Get client IP for promo code abuse tracking
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Check if store is open (allow admins to bypass for testing)
    if (!STORE_OPEN) {
      let isAdmin = false;

      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
        });
        isAdmin = ADMIN_ROLES.includes(user?.role as any);
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.customerEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
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

      // Get shipping cost from selected method, or use default
      const shippingMethod = body.shippingMethod;
      const shippingCents = shippingMethod?.priceCents || 999; // Default to $9.99 if not specified

      // Handle promo code discount with FULL server-side validation
      let discountCents = 0;
      let promoCodeId: number | null = null;
      let promoCodeToRecord: { id: number; code: string } | null = null;

      if (body.promoCodeId) {
        const promoCode = await tx.promoCode.findUnique({
          where: { id: body.promoCodeId }
        });

        // Full server-side validation (don't trust client)
        if (promoCode) {
          const now = new Date();
          let isValid = true;
          let invalidReason = '';

          // Check if active
          if (!promoCode.isActive) {
            isValid = false;
            invalidReason = 'Promo code is no longer active';
          }

          // Check start date
          if (isValid && promoCode.startsAt && now < promoCode.startsAt) {
            isValid = false;
            invalidReason = 'Promo code is not yet active';
          }

          // Check expiry
          if (isValid && promoCode.expiresAt && now > promoCode.expiresAt) {
            isValid = false;
            invalidReason = 'Promo code has expired';
          }

          // Check max total uses
          if (isValid && promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
            isValid = false;
            invalidReason = 'Promo code has reached its usage limit';
          }

          // Check per-user limit (by userId, email, AND IP for guest abuse prevention)
          if (isValid) {
            const userUsageCount = await tx.promoCodeUsage.count({
              where: {
                promoCodeId: promoCode.id,
                OR: [
                  ...(userId ? [{ userId: userId }] : []),
                  { userEmail: body.customerEmail },
                  // Also check IP for guest users to prevent abuse with multiple emails
                  ...(!userId && clientIp !== 'unknown' ? [{ ipAddress: clientIp }] : [])
                ]
              }
            });

            if (userUsageCount >= promoCode.maxUsesPerUser) {
              isValid = false;
              invalidReason = 'You have already used this promo code the maximum number of times';
            }
          }

          // Check new customers only
          if (isValid && promoCode.newCustomersOnly) {
            const previousOrders = await tx.order.count({
              where: {
                OR: [
                  ...(userId ? [{ userId: userId }] : []),
                  { customerEmail: body.customerEmail }
                ],
                status: { notIn: ['cancelled', 'pending'] }
              }
            });

            if (previousOrders > 0) {
              isValid = false;
              invalidReason = 'Promo code is for new customers only';
            }
          }

          // Check specific user restrictions
          if (isValid && promoCode.specificUserIds) {
            const allowedUsers = JSON.parse(promoCode.specificUserIds) as string[];
            if (!userId || !allowedUsers.includes(userId)) {
              isValid = false;
              invalidReason = 'Promo code is not valid for your account';
            }
          }

          if (isValid) {
            // Server-side discount calculation (don't trust client value)
            const specificGameIds = promoCode.specificGameIds ? JSON.parse(promoCode.specificGameIds) as number[] : null;
            const specificMerchIds = promoCode.specificMerchIds ? JSON.parse(promoCode.specificMerchIds) as number[] : null;
            const excludedGameIds = promoCode.excludedGameIds ? JSON.parse(promoCode.excludedGameIds) as number[] : null;
            const excludedMerchIds = promoCode.excludedMerchIds ? JSON.parse(promoCode.excludedMerchIds) as number[] : null;

            let eligibleTotal = 0;

            for (const item of orderItems) {
              if (item.itemType === 'game' && item.gameId) {
                if (!promoCode.applicableToGames) continue;
                if (specificGameIds && !specificGameIds.includes(item.gameId)) continue;
                if (excludedGameIds && excludedGameIds.includes(item.gameId)) continue;
                eligibleTotal += item.priceCents * item.quantity;
              } else if (item.itemType === 'merch' && item.merchId) {
                if (!promoCode.applicableToMerch) continue;
                if (specificMerchIds && !specificMerchIds.includes(item.merchId)) continue;
                if (excludedMerchIds && excludedMerchIds.includes(item.merchId)) continue;
                eligibleTotal += item.priceCents * item.quantity;
              }
            }

            // Check minimum order value
            if (promoCode.minOrderCents && subtotalCents < promoCode.minOrderCents) {
              isValid = false;
              invalidReason = `Minimum order of $${(promoCode.minOrderCents / 100).toFixed(2)} required`;
            }

            if (isValid && eligibleTotal > 0) {
              // Calculate discount server-side
              if (promoCode.discountType === 'percentage') {
                discountCents = Math.floor(eligibleTotal * (promoCode.discountValue / 100));
              } else {
                discountCents = promoCode.discountValue;
              }

              // Apply max discount cap
              if (promoCode.maxDiscountCents && discountCents > promoCode.maxDiscountCents) {
                discountCents = promoCode.maxDiscountCents;
              }

              // Don't let discount exceed eligible total
              if (discountCents > eligibleTotal) {
                discountCents = eligibleTotal;
              }

              promoCodeId = promoCode.id;
              promoCodeToRecord = { id: promoCode.id, code: promoCode.code };

              // Increment usage counter atomically
              await tx.promoCode.update({
                where: { id: promoCode.id },
                data: { currentUses: { increment: 1 } }
              });
            }
          }

          // If promo was provided but invalid, reject the order
          if (!isValid && body.promoCodeId) {
            throw new Error(`Promo code invalid: ${invalidReason}`);
          }
        } else if (body.promoCodeId) {
          // Promo code ID provided but not found
          throw new Error('Promo code not found');
        }
      }

      // Calculate tax using shared tax calculation logic
      // Uses state-aware tax rates (e.g., no tax in DE, MT, NH, OR)
      // Tax is calculated on the discounted amount
      const taxableAmount = subtotalCents - discountCents;
      const taxResult = calculateTaxSync({
        subtotalCents: taxableAmount,
        shippingCents,
        shippingAddress: body.shippingAddressData || undefined
      });
      const taxCents = taxResult.taxCents;

      const totalCents = subtotalCents - discountCents + shippingCents + taxCents;

      // Create the order (still inside transaction)
      const order = await tx.order.create({
        data: {
          customerEmail: body.customerEmail,
          customerName: body.customerName,
          customerPhone: body.customerPhone,
          shippingAddress: body.shippingAddress,
          billingAddress: body.billingAddress || body.shippingAddress,
          totalCents,
          subtotalCents,
          discountCents,
          shippingCents,
          taxCents,
          promoCodeId,
          // Store selected shipping method details
          shippingCarrier: shippingMethod?.carrierCode || null,
          shippingMethod: shippingMethod ? `${shippingMethod.carrier} ${shippingMethod.service}` : null,
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
              notes: promoCodeId
                ? `Order created with promo code - inventory reserved`
                : 'Order created - inventory reserved'
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

      // Record promo code usage for tracking per-user limits and IP abuse
      if (promoCodeToRecord) {
        await tx.promoCodeUsage.create({
          data: {
            promoCodeId: promoCodeToRecord.id,
            orderId: order.id,
            userId: userId || null,
            userEmail: body.customerEmail,
            ipAddress: clientIp !== 'unknown' ? clientIp : null,
            discountApplied: discountCents
          }
        });
      }

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

// Update order status (admin only)
export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

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
