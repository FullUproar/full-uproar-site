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

    const merch = await prisma.Merchandise.update({
      where: { id: merchId },
      data
    });

    return NextResponse.json(merch);
  } catch (error) {
    console.error('Error updating merch:', error);
    return NextResponse.json({ error: 'Failed to update merch' }, { status: 500 });
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

    await prisma.Merchandise.delete({
      where: { id: merchId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting merch:', error);
    return NextResponse.json({ error: 'Failed to delete merch' }, { status: 500 });
  }
}