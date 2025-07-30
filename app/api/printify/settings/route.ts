import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: ['printify_api_key', 'printify_shop_id', 'printify_enabled']
        }
      }
    });

    // Convert to object format
    const settingsObj = settings.reduce((acc, setting) => {
      // Mask API key for security
      if (setting.key === 'printify_api_key' && setting.value) {
        acc[setting.key] = setting.value.substring(0, 10) + '...' + setting.value.substring(setting.value.length - 4);
        acc['printify_api_key_set'] = true;
      } else {
        acc[setting.key] = setting.value;
      }
      return acc;
    }, {} as Record<string, string | boolean>);

    return NextResponse.json(settingsObj);
  } catch (error) {
    console.error('Error fetching Printify settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Update each setting
    const updates = [];
    
    if (body.printify_api_key && !body.printify_api_key.includes('...')) {
      // Only update if it's not the masked version
      updates.push(
        prisma.settings.upsert({
          where: { key: 'printify_api_key' },
          update: { value: body.printify_api_key },
          create: { 
            key: 'printify_api_key', 
            value: body.printify_api_key,
            description: 'Printify API Key'
          }
        })
      );
    }
    
    if (body.printify_shop_id !== undefined) {
      updates.push(
        prisma.settings.upsert({
          where: { key: 'printify_shop_id' },
          update: { value: body.printify_shop_id },
          create: { 
            key: 'printify_shop_id', 
            value: body.printify_shop_id,
            description: 'Printify Shop ID'
          }
        })
      );
    }
    
    if (body.printify_enabled !== undefined) {
      updates.push(
        prisma.settings.upsert({
          where: { key: 'printify_enabled' },
          update: { value: String(body.printify_enabled) },
          create: { 
            key: 'printify_enabled', 
            value: String(body.printify_enabled),
            description: 'Enable Printify Integration'
          }
        })
      );
    }
    
    await Promise.all(updates);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating Printify settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}