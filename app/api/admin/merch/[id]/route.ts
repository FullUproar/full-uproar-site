import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('admin:access');

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
    await requirePermission('admin:access');

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
    await requirePermission('admin:access');

    const { id } = await params;
    const merchId = parseInt(id);

    // Delete in a transaction to handle all related records
    await prisma.$transaction(async (tx) => {
      // Delete related inventory records first
      await tx.inventory.deleteMany({
        where: { merchId }
      });

      // Delete related images
      await tx.merchImage.deleteMany({
        where: { merchId }
      });

      // Delete related reviews
      await tx.review.deleteMany({
        where: { merchId }
      });

      // Check if there are any orders with this merchandise
      const orderItems = await tx.orderItem.findMany({
        where: { merchId },
        include: { order: true }
      });

      if (orderItems.length > 0) {
        // Don't delete if there are orders, just mark as unavailable or throw error
        throw new Error('Cannot delete merchandise that has been ordered. Consider archiving instead.');
      }

      // Finally delete the merchandise
      await tx.merch.delete({
        where: { id: merchId }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting merch:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to delete merch',
      details: error instanceof Error ? error.message : undefined
    }, { status: 500 });
  }
}