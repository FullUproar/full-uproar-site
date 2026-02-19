import { NextResponse } from 'next/server';
import { auth as getSession } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, username } = body;

    const displayName = [firstName, lastName].filter(Boolean).join(' ') || undefined;

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(displayName && { displayName }),
        ...(username !== undefined && { username }),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        username: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
