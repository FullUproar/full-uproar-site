import { prisma } from '@/lib/prisma';
import { PrintifyClient } from './client';

interface OrderWithItems {
  id: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: Array<{
    quantity: number;
    merchSize: string | null;
    merch: {
      id: number;
      name: string;
      isPrintify: boolean | null;
      printifyId: string | null;
      variantMapping: string | null;
    } | null;
  }>;
}

export async function isPrintifyConfigured(): Promise<boolean> {
  try {
    const apiKeySetting = await prisma.settings.findUnique({
      where: { key: 'printify_api_key' }
    });
    const shopIdSetting = await prisma.settings.findUnique({
      where: { key: 'printify_shop_id' }
    });
    const autoFulfillSetting = await prisma.settings.findUnique({
      where: { key: 'printify_auto_fulfill' }
    });

    return !!(apiKeySetting?.value && shopIdSetting?.value && autoFulfillSetting?.value === 'true');
  } catch {
    return false;
  }
}

export async function fulfillPrintifyOrder(order: OrderWithItems): Promise<{
  success: boolean;
  printifyOrderId?: string;
  message: string;
}> {
  // Filter for Printify items
  const printifyItems = order.items.filter(item =>
    item.merch && item.merch.isPrintify && item.merch.printifyId
  );

  if (printifyItems.length === 0) {
    return {
      success: true,
      message: 'No Printify items in this order'
    };
  }

  try {
    const client = new PrintifyClient();
    await client.initialize();

    // Parse shipping address
    const addressLines = order.shippingAddress.split('\n');
    const nameParts = order.customerName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    // Parse city, state, zip from address (format: "City, ST ZIP")
    const cityStateZip = addressLines[2] || '';
    const cityStateMatch = cityStateZip.match(/^(.+),\s*(\w{2})\s*(\d{5}(?:-\d{4})?)$/);

    // Build line items
    const lineItems = printifyItems.map(item => {
      const variantMapping = item.merch!.variantMapping
        ? JSON.parse(item.merch!.variantMapping)
        : {};
      const variantId = item.merchSize
        ? variantMapping[item.merchSize]
        : Object.values(variantMapping)[0];

      return {
        product_id: item.merch!.printifyId!,
        variant_id: Number(variantId),
        quantity: item.quantity
      };
    });

    // Build Printify order
    const printifyOrder = {
      external_id: order.id,
      label: `Order ${order.id}`,
      line_items: lineItems,
      shipping_method: 1, // Standard shipping
      address_to: {
        first_name: firstName,
        last_name: lastName,
        email: order.customerEmail,
        phone: '',
        country: 'US',
        region: cityStateMatch ? cityStateMatch[2] : '',
        address1: addressLines[0] || '',
        address2: addressLines[1] || '',
        city: cityStateMatch ? cityStateMatch[1] : '',
        zip: cityStateMatch ? cityStateMatch[3] : ''
      }
    };

    // Create order in Printify
    const printifyResponse = await client.createOrder(printifyOrder);

    // Check if auto-submit is enabled
    const autoSubmitSetting = await prisma.settings.findUnique({
      where: { key: 'printify_auto_submit' }
    });

    if (autoSubmitSetting?.value === 'true') {
      await client.submitOrderForProduction(printifyResponse.id);
    }

    // Log the fulfillment in order history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'printify_created',
        notes: `Printify order created: ${printifyResponse.id}${autoSubmitSetting?.value === 'true' ? ' (auto-submitted)' : ''}`
      }
    });

    return {
      success: true,
      printifyOrderId: printifyResponse.id,
      message: `Printify order created: ${printifyResponse.id}`
    };
  } catch (error) {
    console.error('Error auto-fulfilling Printify order:', error);

    // Log the error but don't fail - POD fulfillment can be retried manually
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'printify_error',
        notes: `Auto-fulfillment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    });

    return {
      success: false,
      message: `Printify auto-fulfillment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
