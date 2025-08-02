import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ShippingService } from '@/lib/shipping/shipping-service';

export async function POST(request: NextRequest) {
  try {
    // Check admin permission
    await requirePermission('admin:access');

    const { 
      orderId, 
      carrier, 
      service,
      packageDetails,
      fromAddress,
      toAddress 
    } = await request.json();

    // Validate required fields
    if (!orderId || !carrier || !service) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Parse addresses if not provided
    const from = fromAddress || {
      name: 'Full Uproar Games',
      street1: '123 Chaos Street',
      city: 'Game City',
      state: 'CA',
      zip: '90210',
      country: 'US',
      email: 'shipping@fulluproar.com'
    };

    const to = toAddress || ShippingService.parseAddress(order.shippingAddress);
    
    // Add customer info to address
    to.name = to.name || order.customerName;
    to.email = to.email || order.customerEmail;
    to.phone = to.phone || order.customerPhone;

    // Calculate package details if not provided
    const pkg = packageDetails || {
      weight: Math.max(order.items.reduce((sum, item) => {
        // Estimate weight: 8oz for games, 6oz for merch
        const itemWeight = item.itemType === 'game' ? 8 : 6;
        return sum + (itemWeight * item.quantity);
      }, 0), 4), // Minimum 4oz
      length: 12,
      width: 9,
      height: 3,
      value: order.totalCents
    };

    // Create shipping label
    const label = await ShippingService.createLabel(
      orderId,
      from,
      to,
      pkg,
      carrier,
      service
    );

    return NextResponse.json({
      success: true,
      label,
      message: `Label created successfully. Tracking: ${label.trackingNumber}`
    });
  } catch (error: any) {
    console.error('Error creating shipping label:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create shipping label' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin permission
    await requirePermission('admin:access');

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    const where = orderId ? { orderId } : {};

    const labels = await prisma.shippingLabel.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    return NextResponse.json(labels);
  } catch (error: any) {
    console.error('Error fetching shipping labels:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch shipping labels' },
      { status: 500 }
    );
  }
}