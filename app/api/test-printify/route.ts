import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Test Printify API called');
    
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: ['printify_api_key', 'printify_shop_id', 'printify_enabled']
        }
      }
    });

    const settingsObj = settings.reduce((acc, setting) => {
      if (setting.key === 'printify_api_key' && setting.value) {
        acc[setting.key] = setting.value.substring(0, 10) + '...' + setting.value.substring(setting.value.length - 4);
      } else {
        acc[setting.key] = setting.value;
      }
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({ 
      success: true, 
      settings: settingsObj,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test Printify error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Test save called with:', body);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test endpoint working',
      received: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}