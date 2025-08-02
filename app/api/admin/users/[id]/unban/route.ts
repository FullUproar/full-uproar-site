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
        isBanned: false,
        bannedAt: null,
        bannedReason: null
      }
    });

    // Log the action
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        action: 'unban_user',
        targetType: 'user',
        targetId: 0,
        metadata: JSON.stringify({ unbannedUserId: id })
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unbanning user:', error);
    return NextResponse.json({ 
      error: 'Failed to unban user' 
    }, { status: 500 });
  }
}