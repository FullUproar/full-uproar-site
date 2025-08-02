import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { orderQuerySchema } from '@/lib/validation/order-schemas';
import { handleApiError, withErrorHandler } from '@/lib/utils/error-handler';
import { apiLogger } from '@/lib/services/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  
  // Log API request
  await apiLogger.logApiRequest('GET', '/api/admin/orders');
  
  // Check admin permission
  await requirePermission('admin:access');

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validatedParams = orderQuerySchema.parse(searchParams);
    
    const { status, search, page, limit } = validatedParams;
    const sortBy = searchParams.sortBy || 'createdAt';
    const sortOrder = searchParams.sortOrder || 'desc';

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.order.count({ where });
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    // Fetch orders with relations
    const orders = await prisma.order.findMany({
      where,
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
            email: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit
    });

    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await prisma.order.aggregate({
      _count: true,
      _sum: {
        totalCents: true
      },
      where: {
        status: {
          notIn: ['cancelled', 'refunded']
        }
      }
    });

    const pendingCount = await prisma.order.count({
      where: {
        status: {
          in: ['pending', 'payment_pending', 'processing']
        }
      }
    });

    const shippedTodayCount = await prisma.order.count({
      where: {
        shippedAt: {
          gte: today
        }
      }
    });

    // Format response
    const response = {
      orders: orders.map(order => ({
        ...order,
        // Add computed fields if needed
        refundAmountCents: order.refundAmountCents || 0,
        shippingCents: order.shippingCents || 0,
        taxCents: order.taxCents || 0
      })),
      pagination: {
        page,
        limit,
        totalPages,
        totalCount
      },
      stats: {
        totalOrders: stats._count,
        totalRevenue: stats._sum.totalCents || 0,
        pendingOrders: pendingCount,
        shippedToday: shippedTodayCount
      }
    };

        // Log successful response
    await apiLogger.logApiResponse('GET', '/api/admin/orders', 200, Date.now() - startTime);
    
    return NextResponse.json(response);
});

import { createOrderSchema } from '@/lib/validation/order-schemas';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  
  // Log API request
  await apiLogger.logApiRequest('POST', '/api/admin/orders');
  
  // Check admin permission
  await requirePermission('admin:access');

  const rawData = await request.json();
  
  // Validate request data
  const data = createOrderSchema.parse(rawData);

    // Create order with status history
    const order = await prisma.order.create({
      data: {
        ...data,
        statusHistory: {
          create: {
            status: 'pending',
            notes: 'Order created by admin'
          }
        }
      },
      include: {
        items: true,
        statusHistory: true
      }
    });

    // Log successful response
    await apiLogger.logApiResponse('POST', '/api/admin/orders', 201, Date.now() - startTime);
    
    return NextResponse.json(order, { status: 201 });
});