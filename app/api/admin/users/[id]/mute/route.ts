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
    const { hours } = await request.json();

    const mutedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id },
      data: {
        isMuted: true,
        mutedUntil
      }
    });

    // Log the action
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        action: 'mute_user',
        targetType: 'user',
        targetId: 0,
        metadata: JSON.stringify({ 
          mutedUserId: id, 
          hours,
          mutedUntil: mutedUntil.toISOString()
        })
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error muting user:', error);
    return NextResponse.json({ 
      error: 'Failed to mute user' 
    }, { status: 500 });
  }
}