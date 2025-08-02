import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check admin permission
    await requirePermission('admin:access');

    const returnRequest = await prisma.return.findUnique({
      where: { id: parseInt(id) },
      include: {
        order: {
          include: {
            items: {
              include: {
                game: true,
                merch: true
              }
            }
          }
        },
        items: {
          include: {
            orderItem: {
              include: {
                game: true,
                merch: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true
          }
        }
      }
    });

    if (!returnRequest) {
      return NextResponse.json(
        { error: 'Return not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(returnRequest);
  } catch (error: any) {
    console.error('Error fetching return:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch return' },
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
    
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const updates = await request.json();
    const { status, internalNotes, refundAmountCents, processRefund } = updates;

    // Get current return
    const currentReturn = await prisma.return.findUnique({
      where: { id: parseInt(id) },
      include: { order: true }
    });

    if (!currentReturn) {
      return NextResponse.json(
        { error: 'Return not found' },
        { status: 404 }
      );
    }

    // Update return
    const updatedReturn = await prisma.return.update({
      where: { id: parseInt(id) },
      data: {
        ...(status && { status }),
        ...(internalNotes !== undefined && { internalNotes }),
        ...(refundAmountCents !== undefined && { refundAmountCents }),
        ...(status === 'received' && !currentReturn.receivedAt && { receivedAt: new Date() }),
        ...(status === 'completed' && !currentReturn.processedAt && { processedAt: new Date() })
      }
    });

    // Create order status history entry
    if (status && status !== currentReturn.status) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: currentReturn.orderId,
          status: currentReturn.order.status,
          notes: `Return ${status} - RMA #${currentReturn.rmaNumber}`
        }
      });
    }

    // Process refund if requested
    if (processRefund && refundAmountCents > 0) {
      // Create refund through order API
      const refundResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/orders/${currentReturn.orderId}/refund`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            // Pass along auth headers
            'Authorization': request.headers.get('Authorization') || ''
          },
          body: JSON.stringify({
            amountCents: refundAmountCents,
            reason: `Return RMA #${currentReturn.rmaNumber}`
          })
        }
      );

      if (!refundResponse.ok) {
        throw new Error('Failed to process refund');
      }

      // Update return status to completed
      await prisma.return.update({
        where: { id: parseInt(id) },
        data: {
          status: 'completed',
          processedAt: new Date()
        }
      });
    }

    return NextResponse.json(updatedReturn);
  } catch (error: any) {
    console.error('Error updating return:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update return' },
      { status: 500 }
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

    // Soft delete by setting status
    const returnRequest = await prisma.return.update({
      where: { id: parseInt(id) },
      data: {
        status: 'cancelled'
      }
    });

    return NextResponse.json({ success: true, return: returnRequest });
  } catch (error: any) {
    console.error('Error cancelling return:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel return' },
      { status: error.message === 'Super admin access required' ? 403 : 500 }
    );
  }
}