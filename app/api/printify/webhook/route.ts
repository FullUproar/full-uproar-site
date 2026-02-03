import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paymentLogger } from '@/lib/services/logger';

// Printify webhook event types
type PrintifyEventType =
  | 'order:created'
  | 'order:sent-to-production'
  | 'order:shipment:created'
  | 'order:shipment:delivered'
  | 'order:cancelled';

interface PrintifyShipment {
  carrier: string;
  number: string;
  url: string;
  delivered_at?: string;
}

interface PrintifyWebhookPayload {
  id: string;
  type: PrintifyEventType;
  created_at: string;
  resource: {
    id: string;
    external_id?: string;
    status: string;
    shipping_method: number;
    shipments?: PrintifyShipment[];
    created_at: string;
    sent_to_production_at?: string;
    fulfilled_at?: string;
  };
}

// Map Printify statuses to our order statuses
function mapPrintifyStatus(printifyStatus: string, eventType: PrintifyEventType): string {
  switch (eventType) {
    case 'order:sent-to-production':
      return 'processing';
    case 'order:shipment:created':
      return 'shipped';
    case 'order:shipment:delivered':
      return 'delivered';
    case 'order:cancelled':
      return 'cancelled';
    default:
      return printifyStatus;
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as PrintifyWebhookPayload;

    console.log('Printify webhook received:', {
      type: payload.type,
      orderId: payload.resource?.external_id || payload.resource?.id
    });

    // Find the order by external_id (our order ID) or by checking order history
    const orderId = payload.resource.external_id;

    if (!orderId) {
      // Try to find order by Printify order ID in status history
      const historyEntry = await prisma.orderStatusHistory.findFirst({
        where: {
          notes: { contains: payload.resource.id }
        },
        select: { orderId: true }
      });

      if (!historyEntry) {
        console.log(`No order found for Printify order ${payload.resource.id}`);
        return NextResponse.json({ received: true, matched: false });
      }

      // Process with found order ID
      await processWebhook(historyEntry.orderId, payload);
      return NextResponse.json({ received: true, matched: true });
    }

    await processWebhook(orderId, payload);
    return NextResponse.json({ received: true, matched: true });

  } catch (error) {
    console.error('Error processing Printify webhook:', error);
    paymentLogger.error(
      'Printify webhook processing failed',
      error instanceof Error ? error : new Error('Unknown error')
    );
    // Return 200 to prevent retries for errors we can't fix
    return NextResponse.json({ received: true, error: 'Processing failed' });
  }
}

async function processWebhook(orderId: string, payload: PrintifyWebhookPayload) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, trackingNumber: true, shippingCarrier: true }
  });

  if (!order) {
    console.log(`Order ${orderId} not found for Printify webhook`);
    return;
  }

  // Build update data based on event type
  const updateData: {
    status?: string;
    trackingNumber?: string;
    shippingCarrier?: string;
    shippedAt?: Date;
    deliveredAt?: Date;
  } = {};

  let statusNote = '';

  switch (payload.type) {
    case 'order:sent-to-production':
      updateData.status = 'processing';
      statusNote = 'Printify: Order sent to production';
      break;

    case 'order:shipment:created':
      updateData.status = 'shipped';
      updateData.shippedAt = new Date();

      // Extract tracking info from shipments
      if (payload.resource.shipments && payload.resource.shipments.length > 0) {
        const shipment = payload.resource.shipments[0];
        updateData.trackingNumber = shipment.number;
        updateData.shippingCarrier = shipment.carrier;
        statusNote = `Printify: Shipped via ${shipment.carrier} - ${shipment.number}${shipment.url ? ` (${shipment.url})` : ''}`;
      } else {
        statusNote = 'Printify: Order shipped';
      }
      break;

    case 'order:shipment:delivered':
      updateData.status = 'delivered';
      updateData.deliveredAt = new Date();
      statusNote = 'Printify: Order delivered';
      break;

    case 'order:cancelled':
      // Only cancel if not already shipped/delivered
      if (!['shipped', 'delivered'].includes(order.status)) {
        updateData.status = 'cancelled';
        statusNote = 'Printify: Order cancelled by provider';
      } else {
        statusNote = `Printify: Cancellation received but order already ${order.status}`;
      }
      break;

    default:
      statusNote = `Printify: ${payload.type}`;
  }

  // Update order if we have changes
  if (Object.keys(updateData).length > 0) {
    await prisma.order.update({
      where: { id: orderId },
      data: updateData
    });
  }

  // Always log the event in order history
  await prisma.orderStatusHistory.create({
    data: {
      orderId,
      status: updateData.status || order.status,
      notes: statusNote
    }
  });

  paymentLogger.info('Printify webhook processed', {
    orderId,
    eventType: payload.type,
    newStatus: updateData.status || 'unchanged'
  });

  console.log(`Printify webhook processed for order ${orderId}: ${payload.type}`);
}

// GET endpoint to verify webhook is accessible
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Printify webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
