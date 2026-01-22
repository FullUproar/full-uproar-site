import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET - Get a single DSL game definition
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    const game = await prisma.customGameDefinition.findUnique({
      where: { id },
      include: {
        template: {
          select: {
            name: true,
            iconEmoji: true,
            cardTypes: true,
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

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Check ownership or if game is published
    if (game.creatorId !== userId && game.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error('Failed to fetch DSL game:', error);
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 });
  }
}

// PATCH - Update a DSL game definition
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const existing = await prisma.customGameDefinition.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (existing.creatorId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, dslDefinition, status } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (dslDefinition !== undefined) updateData.gameConfig = dslDefinition as Prisma.InputJsonValue;
    if (status !== undefined) updateData.status = status;

    const game = await prisma.customGameDefinition.update({
      where: { id },
      data: updateData,
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
    console.error('Failed to update DSL game:', error);
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
  }
}

// DELETE - Delete a DSL game definition
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const existing = await prisma.customGameDefinition.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (existing.creatorId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.customGameDefinition.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete DSL game:', error);
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 });
  }
}
