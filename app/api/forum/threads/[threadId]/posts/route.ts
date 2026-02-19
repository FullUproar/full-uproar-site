import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth as getSession } from '@/lib/auth-config';
import { UserSecurityService } from '@/lib/services/user-security';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId: threadIdStr } = await params;
    const threadId = parseInt(threadIdStr);

    const posts = await prisma.messagePost.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
            trustLevel: true,
            isBanned: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId: threadIdStr } = await params;
    const threadId = parseInt(threadIdStr);

    // Check if thread exists and is not locked
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId }
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    if (thread.isLocked) {
      return NextResponse.json({ error: 'Thread is locked' }, { status: 403 });
    }

    // Check user permissions
    const securityCheck = await UserSecurityService.canPerformAction(userId, 'post');
    if (!securityCheck.allowed) {
      return NextResponse.json({ 
        error: securityCheck.reason || 'You cannot post at this time',
        requiresVerification: securityCheck.requiresVerification 
      }, { status: 403 });
    }

    const data = await request.json();
    const { content } = data;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Create the post
    const post = await prisma.messagePost.create({
      data: {
        threadId,
        authorId: userId,
        content: content.trim()
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
            trustLevel: true,
            isBanned: true,
            role: true
          }
        }
      }
    });

    // Update thread's lastPostAt
    await prisma.messageThread.update({
      where: { id: threadId },
      data: { lastPostAt: new Date() }
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}