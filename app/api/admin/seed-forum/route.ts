import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin - IMPORTANT: Use clerkId!
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Create boards if they don't exist
    const boards = [
      {
        name: 'General Chaos',
        slug: 'general',
        description: 'General discussion about games, life, and everything in between',
        icon: '💬',
        sortOrder: 1
      },
      {
        name: 'Game Strategies',
        slug: 'strategies',
        description: 'Share your most devious strategies and tactics',
        icon: '🎯',
        sortOrder: 2
      },
      {
        name: 'House Rules',
        slug: 'house-rules',
        description: 'Custom rules to make games even more chaotic',
        icon: '📜',
        sortOrder: 3
      },
      {
        name: 'Game Reviews',
        slug: 'reviews',
        description: 'Honest reviews focusing on chaos potential',
        icon: '⭐',
        sortOrder: 4
      },
      {
        name: 'Off Topic',
        slug: 'off-topic',
        description: 'Non-gaming chaos and general mayhem',
        icon: '🎪',
        sortOrder: 5
      }
    ];

    for (const boardData of boards) {
      await prisma.messageBoard.upsert({
        where: { slug: boardData.slug },
        update: {},
        create: boardData
      });
    }

    // Create some sample threads and posts
    const generalBoard = await prisma.messageBoard.findUnique({
      where: { slug: 'general' }
    });

    if (generalBoard) {
      // Create a welcome thread
      const welcomeThread = await prisma.messageThread.upsert({
        where: {
          boardId_slug: {
            boardId: generalBoard.id,
            slug: 'welcome-to-full-uproar-forum'
          }
        },
        update: {},
        create: {
          boardId: generalBoard.id,
          title: 'Welcome to the Full Uproar Forum!',
          slug: 'welcome-to-full-uproar-forum',
          authorId: userId,
          isPinned: true,
          viewCount: 42
        }
      });

      // Create first post in welcome thread
      await prisma.messagePost.upsert({
        where: {
          id: -1 // This will never match, forcing create
        },
        update: {},
        create: {
          threadId: welcomeThread.id,
          authorId: userId,
          content: `Welcome to the Full Uproar community forum!

This is where chaos meets strategy, where friendships are tested, and where the most devious game tactics are born.

Feel free to:
- Share your favorite backstabbing moments
- Discuss house rules that make games more chaotic
- Review games based on their friendship-ruining potential
- Connect with fellow agents of chaos

Remember: If you're not making enemies, you're not playing hard enough!

Let the chaos begin! 🔥😈💀`
        }
      });
    }

    return NextResponse.json({ 
      message: 'Forum seeded successfully',
      boards: boards.length 
    });
  } catch (error) {
    console.error('Error seeding forum:', error);
    return NextResponse.json({ error: 'Failed to seed forum' }, { status: 500 });
  }
}