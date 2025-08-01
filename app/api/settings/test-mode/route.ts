import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get test mode settings
    const transactionTestMode = await prisma.settings.findUnique({
      where: { key: 'transaction_test_mode' }
    });

    return NextResponse.json({
      transactionTestMode: transactionTestMode?.value === 'true'
    });
  } catch (error) {
    console.error('Error fetching test mode settings:', error);
    return NextResponse.json({ 
      transactionTestMode: false 
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { key, value } = await request.json();
    
    // Validate the key
    const validKeys = ['transaction_test_mode', 'debug_mode', 'maintenance_mode'];
    if (!validKeys.includes(key)) {
      return NextResponse.json({ error: 'Invalid test mode key' }, { status: 400 });
    }

    // Update or create the setting
    const setting = await prisma.settings.upsert({
      where: { key },
      update: { value: value.toString() },
      create: { 
        key, 
        value: value.toString(),
        description: `${key.replace(/_/g, ' ')} toggle`
      }
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error updating test mode:', error);
    return NextResponse.json({ error: 'Failed to update test mode' }, { status: 500 });
  }
}