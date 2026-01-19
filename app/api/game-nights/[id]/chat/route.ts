import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/game-nights/[id]/chat - Get chat messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get the game night and verify access
    const gameNight = await prisma.gameNight.findUnique({
      where: { id },
      include: {
        guests: true,
        chatThread: {
          include: {
            posts: {
              include: {
                author: {
                  select: {
                    id: true,
                    displayName: true,
                    username: true,
                    avatarUrl: true,
                  }
                }
              },
              orderBy: { createdAt: 'asc' },
            }
          }
        }
      }
    });

    if (!gameNight) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 });
    }

    // Check access
    const isHost = gameNight.hostId === user.id;
    const isGuest = gameNight.guests.some(g => g.userId === user.id);

    if (!isHost && !isGuest) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Return chat messages
    const messages = gameNight.chatThread?.posts || [];

    return NextResponse.json({
      chatThreadId: gameNight.chatThreadId,
      messages: messages.map(post => ({
        id: post.id,
        content: post.content,
        authorId: post.authorId,
        authorName: post.author.displayName || post.author.username,
        authorAvatar: post.author.avatarUrl,
        createdAt: post.createdAt,
        isEdited: post.isEdited,
      })),
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
  }
}

// POST /api/game-nights/[id]/chat - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
    }

    // Get the game night
    let gameNight = await prisma.gameNight.findUnique({
      where: { id },
      include: {
        guests: true,
        host: { select: { displayName: true, username: true } },
      }
    });

    if (!gameNight) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 });
    }

    // Check access
    const isHost = gameNight.hostId === user.id;
    const isGuest = gameNight.guests.some(g => g.userId === user.id);

    if (!isHost && !isGuest) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create chat thread if it doesn't exist
    let chatThreadId = gameNight.chatThreadId;

    if (!chatThreadId) {
      // Find or create a "Game Night Chats" board for storing chat threads
      let chatBoard = await prisma.messageBoard.findUnique({
        where: { slug: 'game-night-chats' }
      });

      if (!chatBoard) {
        // Find or create the category
        let category = await prisma.boardCategory.findFirst({
          where: { slug: 'game-nights' }
        });

        if (!category) {
          category = await prisma.boardCategory.create({
            data: {
              name: 'Game Nights',
              slug: 'game-nights',
              description: 'Game night chat threads',
              icon: '🎮',
              isActive: false, // Hidden from public forum
            }
          });
        }

        chatBoard = await prisma.messageBoard.create({
          data: {
            name: 'Game Night Chats',
            slug: 'game-night-chats',
            description: 'Private chat threads for game nights',
            categoryId: category.id,
            accessLevel: 'PRIVATE',
            sortOrder: 999,
          }
        });
      }

      // Create the chat thread
      const chatThread = await prisma.messageThread.create({
        data: {
          boardId: chatBoard.id,
          title: `Chat: ${gameNight.title}`,
          slug: `game-night-${id}`,
          authorId: user.id,
        }
      });

      chatThreadId = chatThread.id;

      // Update game night with chat thread
      await prisma.gameNight.update({
        where: { id },
        data: { chatThreadId }
      });
    }

    // Create the message
    const post = await prisma.messagePost.create({
      data: {
        threadId: chatThreadId,
        authorId: user.id,
        content: content.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          }
        }
      }
    });

    // Update thread lastPostAt
    await prisma.messageThread.update({
      where: { id: chatThreadId },
      data: { lastPostAt: new Date() }
    });

    return NextResponse.json({
      id: post.id,
      content: post.content,
      authorId: post.authorId,
      authorName: post.author.displayName || post.author.username,
      authorAvatar: post.author.avatarUrl,
      createdAt: post.createdAt,
      isEdited: false,
    }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
