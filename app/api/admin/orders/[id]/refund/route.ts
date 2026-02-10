import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    
    // Check admin permission
    await requirePermission('admin:access');
    
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const { amountCents, reason } = await request.json();

    // Get order with payment info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Validate refund amount
    const refundAmount = amountCents || order.totalCents;
    const totalRefundable = order.totalCents - (order.refundAmountCents || 0);
    
    if (refundAmount > totalRefundable) {
      return NextResponse.json(
        { error: 'Refund amount exceeds refundable amount' },
        { status: 400 }
      );
    }

    // Process refund based on payment method
    let refundId: string | null = null;
    let refundStatus = 'completed';
    let refundError: string | null = null;

    if (order.paymentIntentId && stripe) {
      // Process Stripe refund
      try {
        const refund = await stripe.refunds.create({
          payment_intent: order.paymentIntentId,
          amount: refundAmount,
          reason: reason || 'requested_by_customer',
          metadata: {
            orderId: order.id,
            adminUserId: user.id
          }
        });
        
        refundId = refund.id;
        refundStatus = refund.status || 'pending';
      } catch (stripeError: any) {
        console.error('Stripe refund error:', stripeError);
        refundError = stripeError.message;
        refundStatus = 'failed';
      }
    } else if ((process.env.NEXT_PUBLIC_CHECKOUT_MODE || 'dev') === 'dev') {
      // Test mode refund
      refundId = `test_refund_${Date.now()}`;
      refundStatus = 'succeeded';
    } else {
      // Manual refund (cash, check, etc)
      refundId = `manual_refund_${Date.now()}`;
      refundStatus = 'pending_manual';
    }

    // Update order in database
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        refundAmountCents: {
          increment: refundAmount
        },
        refundedAt: new Date(),
        status: refundAmount === order.totalCents ? 'refunded' : 'partially_refunded'
      }
    });

    // Create status history entry
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: updatedOrder.status,
        notes: `Refund processed: $${(refundAmount / 100).toFixed(2)}${reason ? ` - ${reason}` : ''}${refundError ? ` (Error: ${refundError})` : ''}`
      }
    });

    // Create order note
    await prisma.orderNote.create({
      data: {
        orderId,
        userId: user.id,
        note: `Processed refund of $${(refundAmount / 100).toFixed(2)}. Status: ${refundStatus}${refundId ? `. ID: ${refundId}` : ''}`,
        noteType: 'general'
      }
    });

    // Return items to inventory if full refund
    if (refundAmount === order.totalCents) {
      for (const item of order.items) {
        if (item.itemType === 'game' && item.gameId) {
          await prisma.gameInventory.updateMany({
            where: { gameId: item.gameId },
            data: {
              quantity: { increment: item.quantity }
            }
          });
        } else if (item.itemType === 'merch' && item.merchId && item.merchSize) {
          await prisma.inventory.updateMany({
            where: { 
              merchId: item.merchId,
              size: item.merchSize
            },
            data: {
              quantity: { increment: item.quantity }
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      refundId,
      refundStatus,
      refundAmount,
      order: updatedOrder
    });
  } catch (error: any) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process refund' },
      { status: 500 }
    );
  }
}