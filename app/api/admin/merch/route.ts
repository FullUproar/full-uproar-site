import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('admin:access');

    const merch = await prisma.merch.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(merch);
  } catch (error) {
    console.error('Error fetching merch:', error);
    return NextResponse.json({ error: 'Failed to fetch merch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('admin:access');

    const data = await request.json();
    
    console.log('Creating merch with data:', JSON.stringify(data, null, 2));

    const merch = await prisma.merch.create({
      data
    });

    return NextResponse.json(merch);
  } catch (error) {
    console.error('Error creating merch:', error);
    return NextResponse.json({ 
      error: 'Failed to create merch',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}