import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { currentUser } from '@clerk/nextjs/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('products', 'write');

    const { id } = await params;
    const body = await request.json();

    // Update the component
    const updatedData: any = {
      updatedAt: new Date()
    };

    if (body.status !== undefined) {
      updatedData.status = body.status;
      
      // If marking as approved, track who approved it
      if (body.status === 'READY_FOR_PRINT') {
        const user = await currentUser();
        if (user) {
          updatedData.approvedBy = user.id;
        }
        updatedData.lastReviewedAt = new Date();
      }
    }

    if (body.name !== undefined) updatedData.name = body.name;
    if (body.description !== undefined) updatedData.description = body.description;
    if (body.previewUrl !== undefined) updatedData.previewUrl = body.previewUrl;
    if (body.notes !== undefined) updatedData.notes = body.notes;
    if (body.sortOrder !== undefined) updatedData.sortOrder = body.sortOrder;

    const component = await prisma.designComponent.update({
      where: { id },
      data: updatedData
    });

    return NextResponse.json(component);
  } catch (error: any) {
    console.error('Error updating design component:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update design component',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('products', 'delete');

    const { id } = await params;

    await prisma.designComponent.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting design component:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete design component',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code
      },
      { status: 500 }
    );
  }
}