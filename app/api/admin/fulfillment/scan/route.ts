import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/fulfillment/scan
 *
 * Process a barcode scan during fulfillment.
 *
 * The barcode scanner will send the scanned barcode here.
 * We match it against expected items in the order.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, barcode, quantity = 1 } = body;

    if (!orderId || !barcode) {
      return NextResponse.json(
        { error: 'Order ID and barcode are required' },
        { status: 400 }
      );
    }

    // Get the fulfillment record
    let fulfillment = await prisma.fulfillment.findUnique({
      where: { orderId },
    });

    if (!fulfillment) {
      // Auto-create fulfillment if not exists
      fulfillment = await prisma.fulfillment.create({
        data: {
          orderId,
          status: 'in_progress',
          startedAt: new Date(),
        },
      });

      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'processing' },
      });
    }

    // Get order items with product barcodes
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            game: { select: { id: true, title: true, sku: true, barcode: true } },
            merch: { select: { id: true, name: true, sku: true, barcode: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get existing scans for this fulfillment
    const existingScans = await prisma.fulfillmentScan.findMany({
      where: { fulfillmentId: fulfillment.id },
    });

    // Try to match barcode to an order item
    // Match by barcode or SKU
    const normalizedBarcode = barcode.trim().toUpperCase();

    let matchedItem = null;
    for (const item of order.items) {
      const product = item.game || item.merch;
      if (!product) continue;

      const itemBarcode = product.barcode?.trim().toUpperCase();
      const itemSku = product.sku?.trim().toUpperCase();

      if (itemBarcode === normalizedBarcode || itemSku === normalizedBarcode) {
        matchedItem = item;
        break;
      }
    }

    if (!matchedItem) {
      // Check if it's a packaging barcode (by SKU)
      const packagingType = await prisma.packagingType.findFirst({
        where: {
          OR: [
            { sku: { equals: normalizedBarcode, mode: 'insensitive' } },
            { sku: { equals: barcode.trim(), mode: 'insensitive' } },
          ],
          isActive: true,
        },
      });

      if (packagingType) {
        // It's a packaging scan - select this packaging for the order
        await prisma.fulfillment.update({
          where: { id: fulfillment.id },
          data: { packagingTypeId: packagingType.id },
        });

        // Also update the order's packaging
        await prisma.order.update({
          where: { id: orderId },
          data: { packagingTypeId: packagingType.id },
        });

        return NextResponse.json({
          success: true,
          isPackaging: true,
          packagingType: {
            id: packagingType.id,
            sku: packagingType.sku,
            name: packagingType.name,
          },
          message: `📦 Packaging: ${packagingType.sku}`,
        });
      }

      // Barcode not recognized for this order
      const scan = await prisma.fulfillmentScan.create({
        data: {
          fulfillmentId: fulfillment.id,
          barcode,
          matched: false,
          quantity: 0,
          errorMsg: 'Barcode not found in this order',
        },
      });

      return NextResponse.json({
        success: false,
        scan,
        message: 'Barcode not recognized for this order',
      });
    }

    // Check if we've already scanned enough of this item
    const previousScans = existingScans.filter(
      s => s.orderItemId === matchedItem.id && s.matched
    );
    const alreadyScanned = previousScans.reduce((sum, s) => sum + s.quantity, 0);

    if (alreadyScanned >= matchedItem.quantity) {
      // Already fully scanned
      const scan = await prisma.fulfillmentScan.create({
        data: {
          fulfillmentId: fulfillment.id,
          barcode,
          orderItemId: matchedItem.id,
          matched: false,
          quantity: 0,
          errorMsg: `Already scanned all ${matchedItem.quantity} of this item`,
        },
      });

      return NextResponse.json({
        success: false,
        scan,
        message: `Already scanned all ${matchedItem.quantity} of this item`,
        item: {
          name: matchedItem.game?.title || matchedItem.merch?.name,
          quantity: matchedItem.quantity,
          scanned: alreadyScanned,
        },
      });
    }

    // Successful scan
    const scan = await prisma.fulfillmentScan.create({
      data: {
        fulfillmentId: fulfillment.id,
        barcode,
        orderItemId: matchedItem.id,
        matched: true,
        quantity: Math.min(quantity, matchedItem.quantity - alreadyScanned),
      },
    });

    const newScannedTotal = alreadyScanned + scan.quantity;
    const itemComplete = newScannedTotal >= matchedItem.quantity;

    // Check if entire order is now complete
    const allScans = await prisma.fulfillmentScan.findMany({
      where: { fulfillmentId: fulfillment.id, matched: true },
    });

    const scannedByItem: Record<number, number> = {};
    for (const s of allScans) {
      if (s.orderItemId) {
        scannedByItem[s.orderItemId] = (scannedByItem[s.orderItemId] || 0) + s.quantity;
      }
    }

    const orderComplete = order.items.every(item => {
      const scanned = scannedByItem[item.id] || 0;
      return scanned >= item.quantity;
    });

    return NextResponse.json({
      success: true,
      scan,
      message: itemComplete
        ? `✅ ${matchedItem.game?.title || matchedItem.merch?.name} complete!`
        : `Scanned ${newScannedTotal}/${matchedItem.quantity}`,
      item: {
        id: matchedItem.id,
        name: matchedItem.game?.title || matchedItem.merch?.name,
        quantity: matchedItem.quantity,
        scanned: newScannedTotal,
        isComplete: itemComplete,
      },
      orderComplete,
    });
  } catch (error) {
    console.error('Error processing scan:', error);
    return NextResponse.json(
      { error: 'Failed to process scan' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/fulfillment/scan?id=X
 *
 * Remove a scan (undo).
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scanId = searchParams.get('id');

    if (!scanId) {
      return NextResponse.json(
        { error: 'Scan ID is required' },
        { status: 400 }
      );
    }

    await prisma.fulfillmentScan.delete({
      where: { id: parseInt(scanId) },
    });

    return NextResponse.json({ message: 'Scan removed' });
  } catch (error) {
    console.error('Error removing scan:', error);
    return NextResponse.json(
      { error: 'Failed to remove scan' },
      { status: 500 }
    );
  }
}
