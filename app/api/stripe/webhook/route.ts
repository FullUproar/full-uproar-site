import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { InventoryService } from '@/lib/services/inventory-service';
import { paymentLogger } from '@/lib/services/logger';
import { withErrorHandler } from '@/lib/utils/error-handler';
import Stripe from 'stripe';

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
          break;
        }

        // Update order status
        const order = await prisma.order.update({
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
        await prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: 'paid',
            notes: `Payment confirmed via Stripe: ${paymentIntent.id}`
          }
        });

        // Convert inventory reservations to actual decrements
        for (const item of order.items) {
          if (item.itemType === 'game' && item.gameId) {
            await prisma.gameInventory.updateMany({
              where: { 
                gameId: item.gameId,
                reserved: { gte: item.quantity }
              },
              data: {
                quantity: { decrement: item.quantity },
                reserved: { decrement: item.quantity }
              }
            });
          } else if (item.itemType === 'merch' && item.merchId && item.merchSize) {
            await prisma.inventory.updateMany({
              where: { 
                merchId: item.merchId,
                size: item.merchSize,
                reserved: { gte: item.quantity }
              },
              data: {
                quantity: { decrement: item.quantity },
                reserved: { decrement: item.quantity }
              }
            });
          }
        }

        console.log(`Order ${orderId} marked as paid`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        const orderId = paymentIntent.metadata.orderId;

        if (!orderId) break;

        // Update order status
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'payment_failed',
          }
        });

        // Create status history entry
        await prisma.orderStatusHistory.create({
          data: {
            orderId,
            status: 'payment_failed',
            notes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`
          }
        });

        // Release inventory reservations
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true }
        });

        if (order) {
          for (const item of order.items) {
            if (item.itemType === 'game' && item.gameId) {
              await prisma.gameInventory.updateMany({
                where: { gameId: item.gameId },
                data: {
                  reserved: { decrement: item.quantity }
                }
              });
            } else if (item.itemType === 'merch' && item.merchId && item.merchSize) {
              await prisma.inventory.updateMany({
                where: { 
                  merchId: item.merchId,
                  size: item.merchSize
                },
                data: {
                  reserved: { decrement: item.quantity }
                }
              });
            }
          }
        }

        console.log(`Order ${orderId} payment failed`);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as any;
        const paymentIntentId = charge.payment_intent;

        // Find order by payment intent ID
        const order = await prisma.order.findFirst({
          where: { paymentIntentId }
        });

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: charge.amount_refunded === charge.amount ? 'refunded' : 'partially_refunded',
              refundedAt: new Date(),
              refundAmountCents: charge.amount_refunded
            }
          });

          await prisma.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: charge.amount_refunded === charge.amount ? 'refunded' : 'partially_refunded',
              notes: `Refund processed: $${(charge.amount_refunded / 100).toFixed(2)}`
            }
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
});