import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrintifyClient } from '@/lib/printify/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    
    // Get the order with all details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            merch: true
          }
        }
      }
    });
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Filter for Printify items
    const printifyItems = order.items.filter(item => 
      item.merch && item.merch.isPrintify && item.merch.printifyId
    );
    
    if (printifyItems.length === 0) {
      return NextResponse.json({ 
        message: 'No Printify items in this order',
        printifyOrderId: null 
      });
    }
    
    const client = new PrintifyClient();
    await client.initialize();
    
    // Parse shipping address (assuming it's stored as JSON or formatted string)
    const addressLines = order.shippingAddress.split('\n');
    const nameParts = order.customerName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];
    
    // Build Printify order
    const printifyOrder = {
      external_id: order.id,
      label: `Order ${order.id}`,
      line_items: printifyItems.map(item => {
        const variantMapping = item.merch!.variantMapping 
          ? JSON.parse(item.merch!.variantMapping) 
          : {};
        const variantId = item.merchSize 
          ? variantMapping[item.merchSize] 
          : Object.values(variantMapping)[0]; // Default to first variant if no size
        
        return {
          product_id: item.merch!.printifyId!,
          variant_id: Number(variantId),
          quantity: item.quantity
        };
      }),
      shipping_method: 1, // Standard shipping - you might want to make this configurable
      address_to: {
        first_name: firstName,
        last_name: lastName,
        email: order.customerEmail,
        phone: '', // Add phone field to order if needed
        country: 'US', // Parse from address or add country field
        region: addressLines[2]?.split(',')[0]?.trim() || '', // State
        address1: addressLines[0] || '',
        address2: addressLines[1] || '',
        city: addressLines[2]?.split(',')[0]?.trim() || '',
        zip: addressLines[2]?.split(',')[1]?.trim() || ''
      }
    };
    
    // Create order in Printify
    const printifyResponse = await client.createOrder(printifyOrder);
    
    // Optionally auto-submit for production
    const enabledSetting = await prisma.settings.findUnique({
      where: { key: 'printify_auto_submit' }
    });
    
    if (enabledSetting?.value === 'true') {
      await client.submitOrderForProduction(printifyResponse.id);
    }
    
    // Update order with Printify order ID
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'printify_created',
        notes: `Printify order created: ${printifyResponse.id}`
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Order sent to Printify',
      printifyOrderId: printifyResponse.id,
      printifyOrder: printifyResponse
    });
  } catch (error) {
    console.error('Error fulfilling Printify order:', error);
    return NextResponse.json({ 
      error: 'Failed to fulfill Printify order',
      details: String(error)
    }, { status: 500 });
  }
}

// Check order status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const printifyOrderId = searchParams.get('printifyOrderId');
    
    if (!printifyOrderId) {
      return NextResponse.json({ error: 'Printify order ID is required' }, { status: 400 });
    }
    
    const client = new PrintifyClient();
    await client.initialize();
    
    const order = await client.getOrder(printifyOrderId);
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching Printify order:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch Printify order',
      details: String(error)
    }, { status: 500 });
  }
}