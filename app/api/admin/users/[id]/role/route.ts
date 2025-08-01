import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('users', 'update');
    const { id } = await context.params;
    const { role } = await request.json();

    // Check if the role is valid
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Only super admins can create other super admins
    if (role === UserRole.SUPER_ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Users cannot change their own role
    if (id === currentUser.id) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user role:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}