import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check admin permission
    await requirePermission('admin:access');

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');
    const customerId = searchParams.get('customerId');

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (orderId) {
      where.orderId = orderId;
    }
    
    if (customerId) {
      where.userId = customerId;
    }

    // Fetch returns with relations
    const returns = await prisma.return.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            customerEmail: true,
            totalCents: true
          }
        },
        items: {
          include: {
            orderItem: {
              include: {
                game: {
                  select: {
                    name: true,
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
            }
          }
        },
        user: {
          select: {
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate stats
    const stats = await calculateReturnStats();

    return NextResponse.json({
      returns,
      stats
    });
  } catch (error: any) {
    console.error('Error fetching returns:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch returns' },
      { status: error.message === 'Admin access required' ? 403 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin permission
    await requirePermission('admin:access');

    const data = await request.json();
    const { orderId, reason, items, customerNotes, autoApprove } = data;

    // Validate order exists
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

    // Generate RMA number
    const rmaNumber = await generateRMANumber();

    // Create return
    const returnRequest = await prisma.return.create({
      data: {
        rmaNumber,
        orderId,
        userId: order.userId,
        customerEmail: order.customerEmail,
        status: autoApprove ? 'approved' : 'requested',
        reason,
        customerNotes,
        items: {
          create: items.map((item: any) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            reason: item.reason || reason,
            condition: item.condition
          }))
        }
      },
      include: {
        items: {
          include: {
            orderItem: true
          }
        }
      }
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        statusHistory: {
          create: {
            status: order.status,
            notes: `Return requested - RMA #${rmaNumber}`
          }
        }
      }
    });

    // Send email notification (TODO: implement email service)
    // await sendReturnConfirmationEmail(order.customerEmail, returnRequest);

    return NextResponse.json(returnRequest);
  } catch (error: any) {
    console.error('Error creating return:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create return' },
      { status: 500 }
    );
  }
}

async function calculateReturnStats() {
  const [totalReturns, pendingReturns, completedReturns, refundedReturns] = await Promise.all([
    prisma.return.count(),
    prisma.return.count({
      where: {
        status: {
          in: ['requested', 'approved', 'shipping', 'received', 'processing']
        }
      }
    }),
    prisma.return.count({
      where: { status: 'completed' }
    }),
    prisma.return.aggregate({
      _sum: {
        refundAmountCents: true
      },
      where: {
        refundAmountCents: { gt: 0 }
      }
    })
  ]);

  return {
    totalReturns,
    pendingReturns,
    completedReturns,
    totalRefunded: refundedReturns._sum.refundAmountCents || 0
  };
}

async function generateRMANumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // Get count of returns this month
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const count = await prisma.return.count({
    where: {
      createdAt: { gte: startOfMonth }
    }
  });
  
  const sequence = (count + 1).toString().padStart(4, '0');
  return `RMA${year}${month}${sequence}`;
}