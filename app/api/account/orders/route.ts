import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's orders - match by userId OR by email (for orders placed before account linking)
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: user.id },
          { customerEmail: user.email }
        ]
      },
      include: {
        items: {
          include: {
            game: true,
            merch: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format orders for the frontend
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalCents,
      currency: 'USD',
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      shippingAddress: order.shippingAddress,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDeliveryDate?.toISOString(),
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        priceCents: item.priceCents,
        productType: item.game ? 'game' : 'merchandise',
        product: item.game ? {
          id: item.game.id,
          title: item.game.title,
          imageUrl: item.game.imageUrl
        } : item.merch ? {
          id: item.merch.id,
          name: item.merch.name,
          imageUrl: item.merch.imageUrl
        } : null
      }))
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}