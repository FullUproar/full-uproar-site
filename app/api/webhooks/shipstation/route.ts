import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { sendOrderShippedNotification } from '@/lib/email';
import { sendDiscordShippingNotification } from '@/lib/discord';

/**
 * ShipStation Webhook Handler
 *
 * Receives notifications when orders are shipped in ShipStation
 * and updates our database with tracking information.
 *
 * Webhook Events:
 * - SHIP_NOTIFY: Order has been shipped
 * - ITEM_SHIP_NOTIFY: Individual item shipped (for split shipments)
 * - ORDER_NOTIFY: Order created/updated (less common to use)
 */

interface ShipStationWebhookPayload {
  resource_url: string;  // URL to fetch the full resource
  resource_type: 'SHIP_NOTIFY' | 'ITEM_SHIP_NOTIFY' | 'ORDER_NOTIFY';
}

interface ShipStationShipment {
  shipmentId: number;
  orderId: number;
  orderKey: string;
  orderNumber: string;
  createDate: string;
  shipDate: string;
  shipmentCost: number;
  insuranceCost: number;
  trackingNumber: string;
  isReturnLabel: boolean;
  batchNumber: string | null;
  carrierCode: string;
  serviceCode: string;
  packageCode: string;
  confirmation: string;
  warehouseId: number;
  voided: boolean;
  voidDate: string | null;
  marketplaceNotified: boolean;
  notifyErrorMessage: string | null;
  shipTo: {
    name: string;
    company: string | null;
    street1: string;
    street2: string | null;
    street3: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string | null;
    residential: boolean;
  };
  weight: {
    value: number;
    units: string;
  };
  dimensions: {
    length: number;
    width: number;
    height: number;
    units: string;
  } | null;
  shipmentItems: Array<{
    orderItemId: number;
    lineItemKey: string | null;
    sku: string;
    name: string;
    imageUrl: string | null;
    weight: { value: number; units: string } | null;
    quantity: number;
    unitPrice: number;
  }>;
}

// Verify webhook signature (if configured)
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  const webhookSecret = process.env.SHIPSTATION_WEBHOOK_SECRET;

  // If no secret configured, skip verification (not recommended for production)
  if (!webhookSecret) {
    console.warn('SHIPSTATION_WEBHOOK_SECRET not set - skipping signature verification');
    return true;
  }

  if (!signature) {
    return false;
  }

  // ShipStation uses HMAC-SHA256 for webhook signatures
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Fetch the full shipment data from ShipStation
async function fetchShipmentData(resourceUrl: string): Promise<ShipStationShipment[] | null> {
  const apiKey = process.env.SHIPSTATION_API_KEY;
  const apiSecret = process.env.SHIPSTATION_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('ShipStation API credentials not configured');
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

  const response = await fetch(resourceUrl, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('Failed to fetch shipment data:', response.status);
    return null;
  }

  const data = await response.json();
  return data.shipments || [data];
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('x-shipstation-signature');

    // Verify webhook authenticity
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid ShipStation webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload: ShipStationWebhookPayload = JSON.parse(body);

    console.log('ShipStation webhook received:', {
      type: payload.resource_type,
      url: payload.resource_url?.substring(0, 50) + '...',
    });

    // Handle different webhook types
    switch (payload.resource_type) {
      case 'SHIP_NOTIFY':
      case 'ITEM_SHIP_NOTIFY': {
        // Fetch the full shipment data
        const shipments = await fetchShipmentData(payload.resource_url);

        if (!shipments || shipments.length === 0) {
          console.error('No shipment data found');
          return NextResponse.json({ received: true, processed: false });
        }

        // Process each shipment
        for (const shipment of shipments) {
          await processShipment(shipment);
        }

        console.log(`Processed ${shipments.length} shipments in ${Date.now() - startTime}ms`);
        break;
      }

      case 'ORDER_NOTIFY': {
        // Order was created/updated in ShipStation
        // We typically don't need to do anything here since we're the source of truth
        console.log('Order notify received - no action needed');
        break;
      }

      default:
        console.log('Unknown webhook type:', payload.resource_type);
    }

    return NextResponse.json({ received: true, processed: true });

  } catch (error) {
    console.error('ShipStation webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function processShipment(shipment: ShipStationShipment) {
  const orderId = shipment.orderNumber; // We use our order ID as the order number

  if (!orderId) {
    console.error('No order number in shipment');
    return;
  }

  // Find the order in our database
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      trackingNumber: true,
      customerName: true,
      customerEmail: true,
      items: {
        include: {
          game: { select: { title: true, slug: true } },
          merch: { select: { name: true, slug: true } },
        },
      },
    },
  });

  if (!order) {
    console.error(`Order not found: ${orderId}`);
    return;
  }

  // Skip if already has tracking (idempotency)
  if (order.trackingNumber === shipment.trackingNumber) {
    console.log(`Order ${orderId} already has tracking - skipping`);
    return;
  }

  // Update order with shipping information
  await prisma.$transaction(async (tx) => {
    // Update order
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'shipped',
        trackingNumber: shipment.trackingNumber,
        shippingCarrier: shipment.carrierCode,
        shippingMethod: shipment.serviceCode,
        shippedAt: new Date(shipment.shipDate),
        // Estimate delivery based on carrier (basic estimate)
        estimatedDeliveryDate: calculateEstimatedDelivery(
          shipment.carrierCode,
          shipment.serviceCode,
          new Date(shipment.shipDate)
        ),
      },
    });

    // Add status history entry
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: 'shipped',
        notes: `Shipped via ${getCarrierName(shipment.carrierCode)} ${shipment.serviceCode}. Tracking: ${shipment.trackingNumber}`,
      },
    });

    // Save shipping label details
    await tx.shippingLabel.create({
      data: {
        orderId,
        carrier: shipment.carrierCode,
        trackingNumber: shipment.trackingNumber,
        labelUrl: '', // ShipStation doesn't include label in webhook
        costCents: Math.round(shipment.shipmentCost * 100),
        weight: shipment.weight?.value ? new Prisma.Decimal(shipment.weight.value) : null,
        length: shipment.dimensions?.length ? new Prisma.Decimal(shipment.dimensions.length) : null,
        width: shipment.dimensions?.width ? new Prisma.Decimal(shipment.dimensions.width) : null,
        height: shipment.dimensions?.height ? new Prisma.Decimal(shipment.dimensions.height) : null,
      },
    });
  });

  console.log(`Order ${orderId} updated with tracking: ${shipment.trackingNumber}`);

  // Send shipping notification email (non-critical — don't fail webhook if email fails)
  try {
    await sendOrderShippedNotification({
      orderId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      trackingNumber: shipment.trackingNumber,
      shippingCarrier: getCarrierName(shipment.carrierCode),
      items: order.items.map(item => ({
        quantity: item.quantity,
        priceCents: item.priceCents,
        merchSize: item.merchSize,
        game: item.game,
        merch: item.merch,
      })),
    });
  } catch (emailError) {
    console.error('Failed to send shipping notification email:', emailError);
  }

  // Discord notification for team (non-critical)
  sendDiscordShippingNotification({
    orderId,
    customerName: order.customerName,
    trackingNumber: shipment.trackingNumber,
    carrier: getCarrierName(shipment.carrierCode),
  }).catch(err => console.error('Discord shipping notification failed:', err));
}

function getCarrierName(carrierCode: string): string {
  const carriers: Record<string, string> = {
    'fedex': 'FedEx',
    'ups': 'UPS',
    'usps': 'USPS',
    'stamps_com': 'USPS',
    'dhl_express': 'DHL Express',
    'ups_walleted': 'UPS',
  };
  return carriers[carrierCode.toLowerCase()] || carrierCode;
}

function calculateEstimatedDelivery(
  carrierCode: string,
  serviceCode: string,
  shipDate: Date
): Date {
  // Basic estimates - in production you'd use carrier APIs
  const estimates: Record<string, number> = {
    // USPS
    'usps_priority_mail': 3,
    'usps_priority_mail_express': 2,
    'usps_first_class_mail': 5,
    'usps_parcel_select': 7,
    // UPS
    'ups_ground': 5,
    'ups_3_day_select': 3,
    'ups_2nd_day_air': 2,
    'ups_next_day_air': 1,
    'ups_next_day_air_saver': 1,
    // FedEx
    'fedex_ground': 5,
    'fedex_express_saver': 3,
    'fedex_2day': 2,
    'fedex_standard_overnight': 1,
    'fedex_priority_overnight': 1,
  };

  const daysToAdd = estimates[serviceCode.toLowerCase()] || 5;
  const estimated = new Date(shipDate);
  estimated.setDate(estimated.getDate() + daysToAdd);

  // Skip weekends for ground services
  if (daysToAdd >= 3) {
    const day = estimated.getDay();
    if (day === 0) estimated.setDate(estimated.getDate() + 1); // Sunday -> Monday
    if (day === 6) estimated.setDate(estimated.getDate() + 2); // Saturday -> Monday
  }

  return estimated;
}

// Need to import Prisma for Decimal type
import { Prisma } from '@prisma/client';
