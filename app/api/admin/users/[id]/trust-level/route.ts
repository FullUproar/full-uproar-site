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
    const { trustLevel } = await request.json();

    if (trustLevel < 0 || trustLevel > 4) {
      return NextResponse.json({ 
        error: 'Invalid trust level' 
      }, { status: 400 });
    }

    await prisma.user.update({
      where: { id },
      data: { trustLevel }
    });

    // Log the action
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        action: 'update_trust_level',
        targetType: 'user',
        targetId: 0,
        metadata: JSON.stringify({ 
          targetUserId: id, 
          trustLevel 
        })
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating trust level:', error);
    return NextResponse.json({ 
      error: 'Failed to update trust level' 
    }, { status: 500 });
  }
}