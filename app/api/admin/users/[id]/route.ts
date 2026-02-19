import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('admin', 'write');

    const resolvedParams = await params;
    const userId = resolvedParams.id;
    const body = await req.json();

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: body.role,
        ...(body.cultDevotion !== undefined && { cultDevotion: body.cultDevotion }),
        ...(body.cultLevel !== undefined && { cultLevel: body.cultLevel }),
        ...(body.achievementPoints !== undefined && { achievementPoints: body.achievementPoints }),
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('[User Update] Error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('admin', 'write');

    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Get user to verify they exist
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting GOD users
    if (user.role === 'GOD') {
      return NextResponse.json(
        { error: 'Cannot delete GOD user' },
        { status: 403 }
      );
    }

    // Delete from database
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[User Delete] Error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
