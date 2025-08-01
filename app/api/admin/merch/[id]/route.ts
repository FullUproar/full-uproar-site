import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id } = await params;
    const merchId = parseInt(id);

    const merch = await prisma.merch.update({
      where: { id: merchId },
      data
    });

    return NextResponse.json(merch);
  } catch (error) {
    console.error('Error updating merch:', error);
    return NextResponse.json({ error: 'Failed to update merch' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = await params;
    const merchId = parseInt(id);
    
    // Remove fields that shouldn't be updated directly
    const { id: _, createdAt, updatedAt, inventory, images, orderItems, reviews, ...updateData } = body;

    const merch = await prisma.merch.update({
      where: { id: merchId },
      data: updateData
    });

    return NextResponse.json(merch);
  } catch (error) {
    console.error('Error updating merch:', error);
    return NextResponse.json({ 
      error: 'Failed to update merch',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const merchId = parseInt(id);

    await prisma.merch.delete({
      where: { id: merchId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting merch:', error);
    return NextResponse.json({ error: 'Failed to delete merch' }, { status: 500 });
  }
}