import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { paymentLogger } from '@/lib/services/logger';
import { withErrorHandler } from '@/lib/utils/error-handler';
import { sendOrderConfirmation } from '@/lib/email';
import { syncOrderToShipStation, isShipStationConfigured } from '@/lib/shipping/shipstation';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();

  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  // Log webhook received
  paymentLogger.info('Stripe webhook received', {
    signature: signature?.substring(0, 20) + '...',
    bodyLength: body.length
  });

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        const orderId = paymentIntent.metadata.orderId;

        if (!orderId) {
          console.error('No orderId in payment intent metadata');
          // Still return 200 - we don't want Stripe to retry for missing metadata
          break;
        }

        // IDEMPOTENCY CHECK: Verify order exists and isn't already paid
        const existingOrder = await prisma.order.findUnique({
          where: { id: orderId },
          select: { id: true, status: true, paidAt: true, paymentIntentId: true }
        });

        if (!existingOrder) {
          console.error(`Order ${orderId} not found for payment intent ${paymentIntent.id}`);
          // Return 200 to prevent Stripe retries - order may have been deleted
          break;
        }

        // CRITICAL: If already paid, skip processing (idempotent)
        if (existingOrder.status === 'paid' || existingOrder.paidAt) {
          console.log(`Order ${orderId} already marked as paid - skipping duplicate webhook`);
          paymentLogger.info('Duplicate payment webhook skipped', {
            orderId,
            paymentIntentId: paymentIntent.id,
            existingStatus: existingOrder.status
          });
          break;
        }

        // Use transaction to ensure atomic update
        const order = await prisma.$transaction(async (tx) => {
          // Double-check status inside transaction (prevent race with other webhook)
          const orderToUpdate = await tx.order.findUnique({
            where: { id: orderId },
            include: {
              items: {
                include: {
                  game: true,
                  merch: true
                }
              }
            }
          });

          if (!orderToUpdate || orderToUpdate.status === 'paid') {
            return orderToUpdate; // Return existing - idempotent
          }

          // Update order status to paid
          const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: {
              status: 'paid',
              paidAt: new Date(),
              paymentIntentId: paymentIntent.id,
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

          // Create status history entry
          await tx.orderStatusHistory.create({
            data: {
              orderId: updatedOrder.id,
              status: 'paid',
              notes: `Payment confirmed via Stripe: ${paymentIntent.id}`
            }
          });

          // NOTE: Inventory is already RESERVED during order creation.
          // We do NOT decrement inventory here - that happens when order ships.
          // Inventory flow:
          // 1. Order created → inventory RESERVED (quantity stays same, reserved increases)
          // 2. Payment succeeds → status updated (this webhook - NO inventory change)
          // 3. Order ships → inventory COMMITTED (quantity decreases, reserved decreases)
          // 4. Order cancelled/refunded → inventory RELEASED (reserved decreases)

          return updatedOrder;
        });

        if (!order) {
          console.error(`Failed to update order ${orderId}`);
          break;
        }

        // Sync order to ShipStation for fulfillment (non-critical)
        if (isShipStationConfigured()) {
          try {
            await syncOrderToShipStation(order);
            paymentLogger.info('Order synced to ShipStation', { orderId: order.id });
          } catch (shipStationError) {
            // Log but don't fail the webhook if ShipStation sync fails
            console.error('Failed to sync order to ShipStation:', shipStationError);
            paymentLogger.error(
              `ShipStation sync failed for order ${order.id}`,
              shipStationError instanceof Error ? shipStationError : new Error('Unknown error')
            );
          }
        }

        // Send order confirmation email (outside transaction - non-critical)
        try {
          await sendOrderConfirmation({
            orderId: order.id,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            shippingAddress: order.shippingAddress,
            items: order.items.map(item => ({
              quantity: item.quantity,
              priceCents: item.priceCents,
              merchSize: item.merchSize,
              game: item.game ? { title: item.game.title, slug: item.game.slug } : null,
              merch: item.merch ? { name: item.merch.name, slug: item.merch.slug } : null
            })),
            totalCents: order.totalCents,
            shippingCents: order.shippingCents,
            taxCents: order.taxCents,
            paidAt: order.paidAt || new Date()
          });
          paymentLogger.info('Order confirmation email sent', { orderId: order.id });
        } catch (emailError) {
          // Log but don't fail the webhook if email fails
          console.error('Failed to send order confirmation email:', emailError);
          paymentLogger.error(
            `Order confirmation email failed for order ${order.id}`,
            emailError instanceof Error ? emailError : new Error('Unknown error')
          );
        }

        paymentLogger.info('Payment succeeded', {
          orderId,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          processingTime: Date.now() - startTime
        });
        console.log(`Order ${orderId} marked as paid`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        const orderId = paymentIntent.metadata.orderId;

        if (!orderId) break;

        // IDEMPOTENCY CHECK
        const existingOrder = await prisma.order.findUnique({
          where: { id: orderId },
          select: { status: true }
        });

        if (!existingOrder) {
          console.log(`Order ${orderId} not found for failed payment`);
          break;
        }

        // Skip if already in a terminal state
        if (['paid', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(existingOrder.status)) {
          console.log(`Order ${orderId} already in terminal state ${existingOrder.status} - skipping`);
          break;
        }

        // Use transaction to release inventory atomically
        await prisma.$transaction(async (tx) => {
          // Update order status
          await tx.order.update({
            where: { id: orderId },
            data: {
              status: 'payment_failed',
            }
          });

          // Create status history entry
          await tx.orderStatusHistory.create({
            data: {
              orderId,
              status: 'payment_failed',
              notes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`
            }
          });

          // Release inventory reservations
          const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { items: true }
          });

          if (order) {
            for (const item of order.items) {
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
                // FIX: Handle both sized and non-sized merch
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
        });

        paymentLogger.warn('Payment failed', {
          orderId,
          paymentIntentId: paymentIntent.id,
          error: paymentIntent.last_payment_error?.message
        });
        console.log(`Order ${orderId} payment failed - inventory released`);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as any;
        const paymentIntentId = charge.payment_intent;

        // Find order by payment intent ID
        const order = await prisma.order.findFirst({
          where: { paymentIntentId },
          include: { items: true }
        });

        if (!order) {
          console.log(`No order found for refunded charge ${charge.id}`);
          break;
        }

        // IDEMPOTENCY: Check if already refunded
        const isFullRefund = charge.amount_refunded === charge.amount;
        const newStatus = isFullRefund ? 'refunded' : 'partially_refunded';

        if (order.status === 'refunded' && isFullRefund) {
          console.log(`Order ${order.id} already refunded - skipping`);
          break;
        }

        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: newStatus,
              refundedAt: new Date(),
              refundAmountCents: charge.amount_refunded
            }
          });

          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: newStatus,
              notes: `Refund processed: $${(charge.amount_refunded / 100).toFixed(2)}`
            }
          });

          // For full refunds, restore inventory if order wasn't shipped yet
          // (If shipped, inventory was already committed and can't be restored)
          if (isFullRefund && order.status === 'paid') {
            for (const item of order.items) {
              if (item.itemType === 'game' && item.gameId) {
                await tx.gameInventory.updateMany({
                  where: { gameId: item.gameId },
                  data: {
                    reserved: { decrement: item.quantity }
                  }
                });
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
            paymentLogger.info('Inventory restored for refund', { orderId: order.id });
          }
        });

        paymentLogger.info('Refund processed', {
          orderId: order.id,
          chargeId: charge.id,
          amountRefunded: charge.amount_refunded,
          isFullRefund
        });
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    paymentLogger.error(
      `Webhook processing failed for event ${event.type} (${event.id})`,
      error instanceof Error ? error : new Error(error?.message || 'Unknown error')
    );

    // Return 500 so Stripe will retry
    // But if it's a known issue (like order not found), we might want 200
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
});
