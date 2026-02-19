import { NextRequest, NextResponse } from 'next/server';
import { auth as getSession } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/game-kit/definitions/[id]
 * Get a single game definition with all details
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const definition = await prisma.customGameDefinition.findUnique({
      where: { id },
      include: {
        template: {
          select: {
            name: true,
            slug: true,
            iconEmoji: true,
            cardTypes: true,
            editorHints: true,
            baseConfig: true,
          },
        },
        cardPacks: {
          include: {
            cards: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!definition) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Check ownership
    if (definition.creatorId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(definition);
  } catch (error) {
    console.error('Error fetching definition:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game definition' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/game-kit/definitions/[id]
 * Update a game definition
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const patchSession = await getSession();
    const patchUserId = patchSession?.user?.id;
    if (!patchUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const dbUser = await prisma.user.findUnique({
      where: { id: patchUserId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check ownership
    const existing = await prisma.customGameDefinition.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (existing.creatorId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, minPlayers, maxPlayers, status, gameConfig } = body;

    // Build update data
    const updateData: {
      name?: string;
      description?: string | null;
      minPlayers?: number;
      maxPlayers?: number;
      status?: 'DRAFT' | 'TESTING' | 'PUBLISHED' | 'ARCHIVED';
      gameConfig?: object;
      publishedAt?: Date | null;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (minPlayers !== undefined) updateData.minPlayers = minPlayers;
    if (maxPlayers !== undefined) updateData.maxPlayers = maxPlayers;
    if (gameConfig !== undefined) updateData.gameConfig = gameConfig;

    if (status !== undefined) {
      updateData.status = status;
      // Set publishedAt when first published
      if (status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
        updateData.publishedAt = new Date();
      }
    }

    const updated = await prisma.customGameDefinition.update({
      where: { id },
      data: updateData,
      include: {
        template: {
          select: {
            name: true,
            iconEmoji: true,
            cardTypes: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating definition:', error);
    return NextResponse.json(
      { error: 'Failed to update game definition' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/game-kit/definitions/[id]
 * Delete a game definition (and all its packs/cards)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const delSession = await getSession();
    const delUserId = delSession?.user?.id;
    if (!delUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const dbUser = await prisma.user.findUnique({
      where: { id: delUserId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check ownership
    const existing = await prisma.customGameDefinition.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (existing.creatorId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete cascades to packs and cards
    await prisma.customGameDefinition.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting definition:', error);
    return NextResponse.json(
      { error: 'Failed to delete game definition' },
      { status: 500 }
    );
  }
}
