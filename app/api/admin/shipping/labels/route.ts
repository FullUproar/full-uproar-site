import { NextRequest, NextResponse } from 'next/server';
import { getShipStation, convertOrderToShipStation } from '@/lib/shipping/shipstation';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check admin permissions
    await requirePermission('admin:access');

    const body = await request.json();
    const { orderId, carrierCode, serviceCode, packageCode, weight, dimensions } = body;

    // Get order from database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Parse address from the shippingAddress string
    // For now, we'll need a proper address parser or store structured addresses
    const addressParts = order.shippingAddress.split(',').map(s => s.trim());
    
    const shipStation = getShipStation();

    // First, create/update the order in ShipStation
    try {
      const shipStationOrder = convertOrderToShipStation(order);
      await shipStation.createOrder(shipStationOrder);
    } catch (error) {
      console.error('Failed to sync order to ShipStation:', error);
    }

    // Create the shipping label
    const label = await shipStation.createLabel({
      orderId: order.id,
      carrierCode,
      serviceCode,
      packageCode,
      shipDate: new Date().toISOString().split('T')[0],
      weight: {
        value: weight,
        units: 'pounds',
      },
      dimensions: dimensions ? {
        length: dimensions.length,
        width: dimensions.width,
        height: dimensions.height,
        units: 'inches',
      } : undefined,
      shipTo: {
        name: order.customerName,
        street1: addressParts[0] || '',
        city: addressParts[1] || '',
        state: addressParts[2] || '',
        postalCode: addressParts[3] || '',
        country: 'US',
        phone: order.customerPhone || '',
        residential: true,
      },
      testLabel: process.env.NODE_ENV !== 'production',
    });

    // Update order with tracking information
    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: label.trackingNumber,
        shippingCarrier: carrierCode,
        shippingMethod: serviceCode,
        shippingLabelUrl: label.labelData, // This is base64 encoded PDF
        shippedAt: new Date(),
        status: 'processing',
      },
    });

    return NextResponse.json({
      success: true,
      label: {
        trackingNumber: label.trackingNumber,
        labelUrl: label.labelData,
        cost: label.shipmentCost,
        shipmentId: label.shipmentId,
      },
    });
  } catch (error: any) {
    console.error('Create shipping label error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}