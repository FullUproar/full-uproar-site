import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Generate a valid 12-digit UPC-A barcode from a SKU
 * Uses a hash of the SKU to generate a consistent UPC
 */
function generateUPCFromSKU(sku: string): string {
  if (!sku) return '';

  // Create a hash from the SKU
  let hash = 0;
  for (let i = 0; i < sku.length; i++) {
    hash = ((hash << 5) - hash + sku.charCodeAt(i)) | 0;
  }

  // Convert to positive and get 11 digits
  const absHash = Math.abs(hash);
  const baseNumber = String(absHash).padStart(11, '0').slice(-11);

  // Calculate UPC-A check digit
  let oddSum = 0;
  let evenSum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(baseNumber[i]);
    if (i % 2 === 0) {
      oddSum += digit;
    } else {
      evenSum += digit;
    }
  }
  const checkDigit = (10 - ((oddSum * 3 + evenSum) % 10)) % 10;

  return baseNumber + checkDigit;
}

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
      // Check if it's a packaging barcode (by SKU or generated UPC)
      // Fetch all active packaging types and check both SKU and UPC
      const allPackagingTypes = await prisma.packagingType.findMany({
        where: { isActive: true },
      });

      let packagingType = null;
      for (const pkg of allPackagingTypes) {
        const pkgSku = pkg.sku?.trim().toUpperCase();
        const pkgUpc = pkg.sku ? generateUPCFromSKU(pkg.sku) : '';

        // Match by SKU or generated UPC
        if (
          pkgSku === normalizedBarcode ||
          pkgUpc === normalizedBarcode ||
          pkgUpc === barcode.trim()
        ) {
          packagingType = pkg;
          break;
        }
      }

      if (packagingType) {
        // It's a packaging scan - create a new package for multi-box support
        // Get current package count for this fulfillment
        const existingPackages = await prisma.fulfillmentPackage.count({
          where: { fulfillmentId: fulfillment.id },
        });

        const newBoxNumber = existingPackages + 1;

        // Create new package
        const newPackage = await prisma.fulfillmentPackage.create({
          data: {
            fulfillmentId: fulfillment.id,
            packagingTypeId: packagingType.id,
            boxNumber: newBoxNumber,
          },
        });

        // Find all unassigned scans (items scanned since last packaging scan)
        const unassignedScans = await prisma.fulfillmentScan.findMany({
          where: {
            fulfillmentId: fulfillment.id,
            packageId: null,
            matched: true,
          },
          include: {
            orderItem: {
              include: {
                game: { select: { title: true } },
                merch: { select: { name: true } },
              },
            },
          },
        });

        // Assign all unassigned scans to this package
        if (unassignedScans.length > 0) {
          await prisma.fulfillmentScan.updateMany({
            where: {
              id: { in: unassignedScans.map(s => s.id) },
            },
            data: { packageId: newPackage.id },
          });
        }

        // Also update the fulfillment's default packaging (for single-box orders)
        await prisma.fulfillment.update({
          where: { id: fulfillment.id },
          data: { packagingTypeId: packagingType.id },
        });

        // Build list of items in this box
        const itemsInBox = unassignedScans.map(s => ({
          name: s.orderItem?.game?.title || s.orderItem?.merch?.name || 'Unknown item',
          quantity: s.quantity,
        }));

        return NextResponse.json({
          success: true,
          isPackaging: true,
          package: {
            id: newPackage.id,
            boxNumber: newBoxNumber,
            packagingType: {
              id: packagingType.id,
              sku: packagingType.sku,
              name: packagingType.name,
            },
            itemsAssigned: itemsInBox,
          },
          message: `📦 Box ${newBoxNumber}: ${packagingType.sku} (${unassignedScans.length} item${unassignedScans.length !== 1 ? 's' : ''})`,
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
 * PATCH /api/admin/fulfillment/scan
 *
 * Reassign a scan to a different package (for fixing mistakes).
 * Body: { scanId, packageId } - packageId can be null to unassign
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { scanId, packageId } = body;

    if (!scanId) {
      return NextResponse.json(
        { error: 'Scan ID is required' },
        { status: 400 }
      );
    }

    // Verify the scan exists
    const scan = await prisma.fulfillmentScan.findUnique({
      where: { id: scanId },
      include: {
        orderItem: {
          include: {
            game: { select: { title: true } },
            merch: { select: { name: true } },
          },
        },
      },
    });

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    // If packageId is provided, verify it exists and belongs to same fulfillment
    if (packageId !== null && packageId !== undefined) {
      const pkg = await prisma.fulfillmentPackage.findUnique({
        where: { id: packageId },
      });

      if (!pkg) {
        return NextResponse.json(
          { error: 'Package not found' },
          { status: 404 }
        );
      }

      if (pkg.fulfillmentId !== scan.fulfillmentId) {
        return NextResponse.json(
          { error: 'Package belongs to a different fulfillment' },
          { status: 400 }
        );
      }
    }

    // Update the scan's package assignment
    const updatedScan = await prisma.fulfillmentScan.update({
      where: { id: scanId },
      data: { packageId: packageId ?? null },
    });

    const itemName = scan.orderItem?.game?.title || scan.orderItem?.merch?.name || 'Item';

    return NextResponse.json({
      success: true,
      scan: updatedScan,
      message: packageId
        ? `Moved ${itemName} to box ${packageId}`
        : `Unassigned ${itemName} from box`,
    });
  } catch (error) {
    console.error('Error reassigning scan:', error);
    return NextResponse.json(
      { error: 'Failed to reassign scan' },
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
