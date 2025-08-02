import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId: threadIdStr } = await params;
    const threadId = parseInt(threadIdStr);

    await prisma.messageThread.update({
      where: { id: threadId },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return NextResponse.json({ error: 'Failed to update view count' }, { status: 500 });
  }
}