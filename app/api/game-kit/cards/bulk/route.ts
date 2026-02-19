import { NextRequest, NextResponse } from 'next/server';
import { auth as getSession } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

interface CardInput {
  id?: string;
  cardType: string;
  properties: {
    text: string;
    pick?: number;
    [key: string]: unknown;
  };
  sortOrder?: number;
}

/**
 * POST /api/game-kit/cards/bulk
 * Bulk create/update/delete cards
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { packId, cards, deleteIds } = body as {
      packId: string;
      cards?: CardInput[];
      deleteIds?: string[];
    };

    if (!packId) {
      return NextResponse.json(
        { error: 'packId is required' },
        { status: 400 }
      );
    }

    // Get the pack and verify ownership
    const pack = await prisma.customCardPack.findUnique({
      where: { id: packId },
      include: {
        game: {
          select: {
            creatorId: true,
          },
        },
      },
    });

    if (!pack) {
      return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
    }

    if (pack.game.creatorId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const results = {
      created: 0,
      updated: 0,
      deleted: 0,
    };

    // Delete cards if specified
    if (deleteIds && deleteIds.length > 0) {
      const deleteResult = await prisma.customCard.deleteMany({
        where: {
          id: { in: deleteIds },
          packId: packId,
        },
      });
      results.deleted = deleteResult.count;
    }

    // Create or update cards
    if (cards && cards.length > 0) {
      for (const card of cards) {
        // Auto-detect pick count from blanks if not specified
        if (card.cardType === 'black' && card.properties.text) {
          const blankCount = (card.properties.text.match(/_/g) || []).length;
          if (!card.properties.pick || card.properties.pick < 1) {
            card.properties.pick = blankCount > 0 ? blankCount : 1;
          }
        }

        if (card.id) {
          // Update existing card
          await prisma.customCard.update({
            where: { id: card.id },
            data: {
              cardType: card.cardType,
              properties: card.properties as Prisma.InputJsonValue,
              sortOrder: card.sortOrder ?? 0,
            },
          });
          results.updated++;
        } else {
          // Create new card
          await prisma.customCard.create({
            data: {
              packId,
              cardType: card.cardType,
              properties: card.properties as Prisma.InputJsonValue,
              sortOrder: card.sortOrder ?? 0,
            },
          });
          results.created++;
        }
      }
    }

    // Return updated pack with cards
    const updatedPack = await prisma.customCardPack.findUnique({
      where: { id: packId },
      include: {
        cards: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return NextResponse.json({
      results,
      pack: updatedPack,
    });
  } catch (error) {
    console.error('Error bulk updating cards:', error);
    return NextResponse.json(
      { error: 'Failed to update cards' },
      { status: 500 }
    );
  }
}
