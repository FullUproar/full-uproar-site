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
    const { reason } = await request.json();

    const targetUser = await prisma.user.update({
      where: { id },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        bannedReason: reason || 'No reason provided'
      }
    });

    // Log the action
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        action: 'ban_user',
        targetType: 'user',
        targetId: 0,
        metadata: JSON.stringify({ 
          bannedUserId: id, 
          bannedEmail: targetUser.email,
          reason 
        })
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json({ 
      error: 'Failed to ban user' 
    }, { status: 500 });
  }
}