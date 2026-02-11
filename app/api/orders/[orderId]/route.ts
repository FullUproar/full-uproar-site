import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isSimulatedMode } from '@/lib/payment-mode';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            game: {
              select: {
                title: true,
                slug: true,
                imageUrl: true
              }
            },
            merch: {
              select: {
                name: true,
                slug: true,
                imageUrl: true
              }
            }
          }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// Confirm simulated payment (dev mode only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();

    if (body.action === 'simulate-payment') {
      if (!isSimulatedMode()) {
        return NextResponse.json(
          { error: 'Simulated payments not available in this mode' },
          { status: 403 }
        );
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true }
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      if (order.status !== 'pending') {
        return NextResponse.json(
          { error: `Cannot confirm payment for order with status: ${order.status}` },
          { status: 400 }
        );
      }

      const updatedOrder = await prisma.$transaction(async (tx) => {
        const updated = await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'paid',
            paidAt: new Date(),
          }
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status: 'paid',
            notes: 'Simulated payment confirmed'
          }
        });

        return updated;
      });

      return NextResponse.json(updatedOrder);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}