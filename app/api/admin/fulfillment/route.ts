import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/fulfillment
 *
 * Get fulfillment status for an order.
 *
 * Query params:
 * - orderId: The order ID to get fulfillment for
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order with items and their products
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            game: {
              select: {
                id: true,
                title: true,
                sku: true,
                barcode: true,
                imageUrl: true,
              },
            },
            merch: {
              select: {
                id: true,
                name: true,
                sku: true,
                barcode: true,
                imageUrl: true,
              },
            },
          },
        },
        fulfillment: {
          include: {
            scans: {
              orderBy: { scannedAt: 'desc' },
              include: {
                orderItem: {
                  include: {
                    game: { select: { title: true } },
                    merch: { select: { name: true } },
                  },
                },
              },
            },
            packagingType: true,
            packages: {
              include: {
                packagingType: true,
                scans: {
                  where: { matched: true },
                  include: {
                    orderItem: {
                      include: {
                        game: { select: { title: true } },
                        merch: { select: { name: true } },
                      },
                    },
                  },
                },
              },
              orderBy: { boxNumber: 'asc' },
            },
          },
        },
        packagingType: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Calculate fulfillment progress
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const scannedItems = order.fulfillment?.scans
      .filter(s => s.matched)
      .reduce((sum, s) => sum + s.quantity, 0) || 0;

    // Build item checklist
    const checklist = order.items.map(item => {
      const product = item.game || item.merch;
      const scansForItem = order.fulfillment?.scans.filter(
        s => s.orderItemId === item.id && s.matched
      ) || [];
      const scannedQty = scansForItem.reduce((sum, s) => sum + s.quantity, 0);

      return {
        id: item.id,
        itemType: item.itemType,
        name: item.game?.title || item.merch?.name || 'Unknown',
        sku: product?.sku,
        barcode: product?.barcode,
        imageUrl: product?.imageUrl,
        size: item.merchSize,
        quantity: item.quantity,
        scannedQuantity: scannedQty,
        isComplete: scannedQty >= item.quantity,
      };
    });

    // Build packages data for multi-box support
    const packages = order.fulfillment?.packages?.map(pkg => ({
      id: pkg.id,
      boxNumber: pkg.boxNumber,
      packagingType: pkg.packagingType,
      items: pkg.scans.map(s => ({
        scanId: s.id,
        name: s.orderItem?.game?.title || s.orderItem?.merch?.name || 'Unknown',
        quantity: s.quantity,
      })),
    })) || [];

    // Find unassigned scans (items not yet in a box)
    const unassignedScans = order.fulfillment?.scans
      .filter(s => s.matched && !s.packageId)
      .map(s => ({
        scanId: s.id,
        name: s.orderItem?.game?.title || s.orderItem?.merch?.name || 'Unknown',
        quantity: s.quantity,
      })) || [];

    return NextResponse.json({
      order: {
        id: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        status: order.status,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
      },
      fulfillment: order.fulfillment,
      packagingType: order.packagingType || order.fulfillment?.packagingType,
      checklist,
      packages,
      unassignedScans,
      progress: {
        total: totalItems,
        scanned: scannedItems,
        percentage: totalItems > 0 ? Math.round((scannedItems / totalItems) * 100) : 0,
        isComplete: scannedItems >= totalItems,
      },
    });
  } catch (error) {
    console.error('Error fetching fulfillment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fulfillment' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/fulfillment
 *
 * Start fulfillment for an order.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, userId, userName } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { fulfillment: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // If fulfillment already exists, return it
    if (order.fulfillment) {
      return NextResponse.json(order.fulfillment);
    }

    // Create new fulfillment record
    const fulfillment = await prisma.fulfillment.create({
      data: {
        orderId,
        status: 'in_progress',
        startedAt: new Date(),
        fulfilledById: userId,
        fulfilledByName: userName,
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'processing' },
    });

    // Add status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: 'processing',
        notes: 'Fulfillment started',
      },
    });

    return NextResponse.json(fulfillment);
  } catch (error) {
    console.error('Error starting fulfillment:', error);
    return NextResponse.json(
      { error: 'Failed to start fulfillment' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/fulfillment
 *
 * Update fulfillment (complete, set packaging, etc.)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, packagingTypeId, status, notes } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const fulfillment = await prisma.fulfillment.findUnique({
      where: { orderId },
    });

    if (!fulfillment) {
      return NextResponse.json(
        { error: 'Fulfillment not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (packagingTypeId !== undefined) {
      updateData.packagingTypeId = packagingTypeId;
      // Also update the order's packaging type
      await prisma.order.update({
        where: { id: orderId },
        data: { packagingTypeId },
      });
    }

    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date();
        // Update order status to 'packed'
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'packed' },
        });
        await prisma.orderStatusHistory.create({
          data: {
            orderId,
            status: 'packed',
            notes: 'Order packed and ready for shipping',
          },
        });
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updated = await prisma.fulfillment.update({
      where: { orderId },
      data: updateData,
      include: {
        packagingType: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating fulfillment:', error);
    return NextResponse.json(
      { error: 'Failed to update fulfillment' },
      { status: 500 }
    );
  }
}
