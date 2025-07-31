import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const merch = await prisma.merch.create({
      data
    });

    return NextResponse.json(merch);
  } catch (error) {
    console.error('Error creating merch:', error);
    return NextResponse.json({ error: 'Failed to create merch' }, { status: 500 });
  }
}