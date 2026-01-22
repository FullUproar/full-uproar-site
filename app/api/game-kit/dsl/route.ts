import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET - List user's DSL game definitions
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const games = await prisma.customGameDefinition.findMany({
      where: { creatorId: userId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        shareToken: true,
        gameConfig: true,
        createdAt: true,
        updatedAt: true,
        template: {
          select: {
            name: true,
            iconEmoji: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error('Failed to fetch DSL games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}

// POST - Create a new DSL game definition
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, dslDefinition, templateId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 1;

    // Ensure unique slug for this user
    while (true) {
      const existing = await prisma.customGameDefinition.findUnique({
        where: { creatorId_slug: { creatorId: userId, slug } },
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter++}`;
    }

    // Get or create a "custom" template for DSL games
    let template = await prisma.gameTemplate.findFirst({
      where: { slug: 'custom-dsl' },
    });

    if (!template) {
      template = await prisma.gameTemplate.create({
        data: {
          name: 'Custom Game',
          slug: 'custom-dsl',
          description: 'A fully custom game built with the visual game builder',
          category: 'custom',
          iconEmoji: '🎮',
          baseConfig: {},
          cardTypes: [],
          isOfficial: false,
        },
      });
    }

    // Create the game definition
    const game = await prisma.customGameDefinition.create({
      data: {
        creatorId: userId,
        name,
        slug,
        templateId: templateId || template.id,
        gameConfig: (dslDefinition || {}) as Prisma.InputJsonValue,
        status: 'DRAFT',
      },
      include: {
        template: {
          select: {
            name: true,
            iconEmoji: true,
          },
        },
      },
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error('Failed to create DSL game:', error);
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}
