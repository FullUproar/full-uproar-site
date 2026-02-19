import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth as getSession } from '@/lib/auth-config';

// POST /api/rituals/[id]/regulars - Add a regular member
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const currentUserId = session?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ritual = await prisma.ritual.findUnique({
      where: { id },
      include: {
        regulars: true
      }
    });

    if (!ritual) {
      return NextResponse.json({ error: 'Ritual not found' }, { status: 404 });
    }

    // Only creator or existing regulars can add members
    const hasAccess = ritual.creatorId === currentUserId ||
                     ritual.regulars.some(r => r.userId === currentUserId);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, role } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Check if already a regular
    const existing = await prisma.ritualRegular.findUnique({
      where: {
        ritualId_userId: {
          ritualId: id,
          userId
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a regular member' },
        { status: 400 }
      );
    }

    // Add as regular
    const regular = await prisma.ritualRegular.create({
      data: {
        ritualId: id,
        userId,
        role: role || 'player'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });

    return NextResponse.json({ regular }, { status: 201 });

  } catch (error) {
    console.error('Error adding regular:', error);
    return NextResponse.json(
      { error: 'Failed to add regular member' },
      { status: 500 }
    );
  }
}

// DELETE /api/rituals/[id]/regulars?userId=xxx - Remove a regular member
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const delSession = await getSession();
    const delUserId = delSession?.user?.id;
    if (!delUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    const ritual = await prisma.ritual.findUnique({
      where: { id: id }
    });

    if (!ritual) {
      return NextResponse.json({ error: 'Ritual not found' }, { status: 404 });
    }

    // Only creator can remove others, or users can remove themselves
    if (ritual.creatorId !== delUserId && targetUserId !== delUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Can't remove the creator
    if (targetUserId === ritual.creatorId) {
      return NextResponse.json(
        { error: 'Cannot remove the ritual creator' },
        { status: 400 }
      );
    }

    await prisma.ritualRegular.delete({
      where: {
        ritualId_userId: {
          ritualId: id,
          userId: targetUserId
        }
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error removing regular:', error);
    return NextResponse.json(
      { error: 'Failed to remove regular member' },
      { status: 500 }
    );
  }
}
