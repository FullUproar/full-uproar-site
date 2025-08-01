import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('users', 'update');
    const { id } = await context.params;
    const { isActive } = await request.json();

    // Users cannot change their own status
    if (id === currentUser.id) {
      return NextResponse.json({ error: 'Cannot change your own status' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user status:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
  }
}