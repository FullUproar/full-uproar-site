import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requirePermission('users', 'update');
    const { id } = await params;

    await prisma.user.update({
      where: { id },
      data: {
        isMuted: false,
        mutedUntil: null
      }
    });

    // Log the action
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        action: 'unmute_user',
        targetType: 'user',
        targetId: 0,
        metadata: JSON.stringify({ unmutedUserId: id })
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unmuting user:', error);
    return NextResponse.json({ 
      error: 'Failed to unmute user' 
    }, { status: 500 });
  }
}