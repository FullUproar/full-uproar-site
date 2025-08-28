import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';

export async function GET() {
  try {
    // Check if Printify is configured
    const apiKeySetting = await prisma.settings.findUnique({
      where: { key: 'printify_api_key' }
    });
    
    const shopIdSetting = await prisma.settings.findUnique({
      where: { key: 'printify_shop_id' }
    });

    // Count products from Printify
    const productCount = await prisma.merch.count({
      where: { isPrintify: true }
    });

    return NextResponse.json({
      configured: !!(apiKeySetting?.value && shopIdSetting?.value),
      shopId: shopIdSetting?.value ? shopIdSetting.value.substring(0, 4) + '****' : null,
      productCount,
      hasApiKey: !!apiKeySetting?.value,
      hasShopId: !!shopIdSetting?.value
    });
  } catch (error) {
    console.error('Error fetching Printify settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Printify settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin permissions
    await requirePermission('admin:access');

    const body = await request.json();
    const { apiToken, shopId } = body;

    // Save API token if provided
    if (apiToken) {
      await prisma.settings.upsert({
        where: { key: 'printify_api_key' },
        update: { value: apiToken },
        create: {
          key: 'printify_api_key',
          value: apiToken,
          description: 'Printify API Key for POD integration'
        }
      });
    }

    // Save shop ID if provided
    if (shopId) {
      await prisma.settings.upsert({
        where: { key: 'printify_shop_id' },
        update: { value: shopId },
        create: {
          key: 'printify_shop_id',
          value: shopId,
          description: 'Printify Shop ID for POD integration'
        }
      });
    }

    // Test the connection by trying to fetch shops
    if (apiToken) {
      try {
        const testResponse = await fetch('https://api.printify.com/v1/shops.json', {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!testResponse.ok) {
          throw new Error('Invalid API credentials');
        }

        const shops = await testResponse.json();
        console.log('Successfully connected to Printify. Available shops:', shops);
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to connect to Printify. Please check your API token.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Printify settings saved successfully'
    });
  } catch (error: any) {
    console.error('Error saving Printify settings:', error);
    return NextResponse.json(
      { error: 'Failed to save Printify settings', details: error.message },
      { status: 500 }
    );
  }
}