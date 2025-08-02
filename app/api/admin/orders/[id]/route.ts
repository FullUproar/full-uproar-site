import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check admin permission
    await requirePermission('admin:access');

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            game: {
              select: {
                title: true,
                slug: true
              }
            },
            merch: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        },
        statusHistory: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true
          }
        },
        shippingLabels: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        returns: {
          include: {
            items: true
          }
        },
        tickets: {
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order' },
      { status: error.message === 'Admin access required' ? 403 : 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check admin permission
    await requirePermission('admin:access');

    const updates = await request.json();
    const { status, statusNote, ...otherUpdates } = updates;

    // Start a transaction to update order and potentially create status history
    const result = await prisma.$transaction(async (tx) => {
      // Update order
      const order = await tx.order.update({
        where: { id },
        data: {
          ...otherUpdates,
          ...(status && { status }),
          // Update timestamps based on status
          ...(status === 'paid' && !otherUpdates.paidAt && { paidAt: new Date() }),
          ...(status === 'shipped' && !otherUpdates.shippedAt && { shippedAt: new Date() }),
          ...(status === 'delivered' && !otherUpdates.deliveredAt && { deliveredAt: new Date() }),
          ...(status === 'cancelled' && !otherUpdates.cancelledAt && { cancelledAt: new Date() }),
          ...(status === 'refunded' && !otherUpdates.refundedAt && { refundedAt: new Date() })
        }
      });

      // Create status history entry if status changed
      if (status) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            status,
            notes: statusNote || `Status updated to ${status}`
          }
        });

        // Handle inventory updates based on status
        if (status === 'cancelled' || status === 'refunded') {
          // Return inventory to stock
          const orderItems = await tx.orderItem.findMany({
            where: { orderId: id }
          });

          for (const item of orderItems) {
            if (item.itemType === 'game' && item.gameId) {
              await tx.gameInventory.updateMany({
                where: { gameId: item.gameId },
                data: {
                  quantity: { increment: item.quantity },
                  reserved: { decrement: Math.min(item.quantity, 0) }
                }
              });
            } else if (item.itemType === 'merch' && item.merchId && item.merchSize) {
              await tx.inventory.updateMany({
                where: { 
                  merchId: item.merchId,
                  size: item.merchSize
                },
                data: {
                  quantity: { increment: item.quantity },
                  reserved: { decrement: Math.min(item.quantity, 0) }
                }
              });
            }
          }
        }
      }

      return order;
    });

    // Fetch updated order with all relations
    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusHistory: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: error.message === 'Admin access required' ? 403 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check super admin permission for deletion
    await requirePermission('admin:super');

    // Soft delete by setting status to cancelled
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        statusHistory: {
          create: {
            status: 'cancelled',
            notes: 'Order cancelled by admin'
          }
        }
      }
    });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete order' },
      { status: error.message === 'Super admin access required' ? 403 : 500 }
    );
  }
}