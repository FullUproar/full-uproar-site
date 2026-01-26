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
      // Get the current order state first
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!existingOrder) {
        throw new Error('Order not found');
      }

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
      if (status && status !== existingOrder.status) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            status,
            notes: statusNote || `Status updated to ${status}`
          }
        });

        // Handle inventory updates based on status transition
        // Only process if actually changing to cancelled/refunded from a non-terminal state
        if ((status === 'cancelled' || status === 'refunded') &&
            !['cancelled', 'refunded'].includes(existingOrder.status)) {

          const wasShipped = ['shipped', 'delivered'].includes(existingOrder.status);

          for (const item of existingOrder.items) {
            if (item.itemType === 'game' && item.gameId) {
              if (wasShipped) {
                // Order was shipped - need to restore quantity (inventory was committed)
                await tx.gameInventory.updateMany({
                  where: { gameId: item.gameId },
                  data: {
                    quantity: { increment: item.quantity }
                  }
                });
              } else {
                // Order wasn't shipped - just release the reservation
                await tx.gameInventory.updateMany({
                  where: { gameId: item.gameId },
                  data: {
                    reserved: { decrement: item.quantity }
                  }
                });
              }
              // Always restore Game.stock for backward compatibility
              await tx.game.update({
                where: { id: item.gameId },
                data: {
                  stock: { increment: item.quantity }
                }
              });
            } else if (item.itemType === 'merch' && item.merchId) {
              // FIX: Handle both sized AND non-sized merch items
              if (wasShipped) {
                // Order was shipped - restore quantity
                await tx.inventory.updateMany({
                  where: {
                    merchId: item.merchId,
                    size: item.merchSize || null
                  },
                  data: {
                    quantity: { increment: item.quantity }
                  }
                });
              } else {
                // Order wasn't shipped - just release reservation
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
        }

        // Handle shipped status - commit inventory (decrease both quantity and reserved)
        if (status === 'shipped' && existingOrder.status !== 'shipped') {
          for (const item of existingOrder.items) {
            if (item.itemType === 'game' && item.gameId) {
              await tx.gameInventory.updateMany({
                where: { gameId: item.gameId },
                data: {
                  quantity: { decrement: item.quantity },
                  reserved: { decrement: item.quantity }
                }
              });
            } else if (item.itemType === 'merch' && item.merchId) {
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
          }
        }
      }

      return order;
    });

    // Fetch updated order with all relations
    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            game: true,
            merch: true
          }
        },
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
      { status: error.message === 'Admin access required' ? 403 : error.message === 'Order not found' ? 404 : 500 }
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

    // Use transaction to properly release inventory when cancelling
    const order = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!existingOrder) {
        throw new Error('Order not found');
      }

      // Skip inventory release if already cancelled
      if (existingOrder.status !== 'cancelled') {
        const wasShipped = ['shipped', 'delivered'].includes(existingOrder.status);

        // Release inventory
        for (const item of existingOrder.items) {
          if (item.itemType === 'game' && item.gameId) {
            if (wasShipped) {
              await tx.gameInventory.updateMany({
                where: { gameId: item.gameId },
                data: { quantity: { increment: item.quantity } }
              });
            } else {
              await tx.gameInventory.updateMany({
                where: { gameId: item.gameId },
                data: { reserved: { decrement: item.quantity } }
              });
            }
            await tx.game.update({
              where: { id: item.gameId },
              data: { stock: { increment: item.quantity } }
            });
          } else if (item.itemType === 'merch' && item.merchId) {
            if (wasShipped) {
              await tx.inventory.updateMany({
                where: { merchId: item.merchId, size: item.merchSize || null },
                data: { quantity: { increment: item.quantity } }
              });
            } else {
              await tx.inventory.updateMany({
                where: { merchId: item.merchId, size: item.merchSize || null },
                data: { reserved: { decrement: item.quantity } }
              });
            }
          }
        }
      }

      // Soft delete by setting status to cancelled
      return tx.order.update({
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
    });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete order' },
      { status: error.message === 'Super admin access required' ? 403 : error.message === 'Order not found' ? 404 : 500 }
    );
  }
}
