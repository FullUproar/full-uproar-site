import { NextRequest, NextResponse } from 'next/server';
import { auth as getSession } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/game-kit/definitions
 * List user's custom game definitions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the DB user
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const definitions = await prisma.customGameDefinition.findMany({
      where: {
        creatorId: dbUser.id,
        ...(status ? { status: status as 'DRAFT' | 'TESTING' | 'PUBLISHED' | 'ARCHIVED' } : {}),
      },
      include: {
        template: {
          select: {
            name: true,
            iconEmoji: true,
          },
        },
        _count: {
          select: {
            cardPacks: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Get card counts for each definition
    const definitionsWithCounts = await Promise.all(
      definitions.map(async (def) => {
        const cardCount = await prisma.customCard.count({
          where: {
            pack: {
              gameId: def.id,
            },
          },
        });
        return {
          ...def,
          cardCount,
        };
      })
    );

    return NextResponse.json(definitionsWithCounts);
  } catch (error) {
    console.error('Error fetching definitions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game definitions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/game-kit/definitions
 * Create a new custom game definition
 */
export async function POST(request: NextRequest) {
  try {
    const postSession = await getSession();
    const postUserId = postSession?.user?.id;
    if (!postUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the DB user
    const dbUser = await prisma.user.findUnique({
      where: { id: postUserId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, templateId, description } = body;

    if (!name || !templateId) {
      return NextResponse.json(
        { error: 'Name and templateId are required' },
        { status: 400 }
      );
    }

    // Get the template
    const template = await prisma.gameTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Generate slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check for existing slug for this user
    let slug = baseSlug;
    let counter = 1;
    while (
      await prisma.customGameDefinition.findUnique({
        where: {
          creatorId_slug: {
            creatorId: dbUser.id,
            slug,
          },
        },
      })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the game definition with initial config from template
    const definition = await prisma.customGameDefinition.create({
      data: {
        creatorId: dbUser.id,
        name,
        slug,
        description: description || null,
        templateId,
        gameConfig: template.baseConfig as object,
        minPlayers: (template.baseConfig as { minPlayers?: number })?.minPlayers || 3,
        maxPlayers: (template.baseConfig as { maxPlayers?: number })?.maxPlayers || 10,
      },
      include: {
        template: {
          select: {
            name: true,
            iconEmoji: true,
            cardTypes: true,
            editorHints: true,
          },
        },
      },
    });

    // Create a default "Core" card pack
    await prisma.customCardPack.create({
      data: {
        gameId: definition.id,
        name: 'Core Pack',
        isCore: true,
      },
    });

    return NextResponse.json(definition, { status: 201 });
  } catch (error) {
    console.error('Error creating definition:', error);
    return NextResponse.json(
      { error: 'Failed to create game definition' },
      { status: 500 }
    );
  }
}
