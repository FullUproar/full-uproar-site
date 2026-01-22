import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/game-kit/play/[shareToken]
 * Load a game for playing - returns GameDefinition and CardPacks
 * This is called by the PartyKit server to load custom games
 * Supports both shareToken and game ID for lookup
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await context.params;

    // Try to find by share token first, then by ID
    let game = await prisma.customGameDefinition.findUnique({
      where: { shareToken },
      include: {
        template: true,
        cardPacks: {
          include: {
            cards: true,
          },
        },
        creator: {
          select: {
            displayName: true,
            username: true,
          },
        },
      },
    });

    // If not found by shareToken, try finding by ID
    if (!game) {
      game = await prisma.customGameDefinition.findUnique({
        where: { id: shareToken },
        include: {
          template: true,
          cardPacks: {
            include: {
              cards: true,
            },
          },
          creator: {
            select: {
              displayName: true,
              username: true,
            },
          },
        },
      });
    }

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Check if game is playable (DRAFT, TESTING, or PUBLISHED)
    if (game.status === 'ARCHIVED') {
      return NextResponse.json({ error: 'Game is archived' }, { status: 403 });
    }

    // Check if this is a DSL game (has 'main' scope) or template-based game
    const gameConfig = game.gameConfig as Record<string, unknown>;
    const isDSLGame = gameConfig && ('main' in gameConfig || 'setup' in gameConfig);

    let definition: Record<string, unknown>;

    if (isDSLGame) {
      // DSL game - gameConfig IS the full definition
      definition = {
        ...gameConfig,
        id: game.slug || game.id,
        name: game.name,
        description: game.description || (gameConfig.description as string),
      };

      // Ensure player limits are set
      if (gameConfig.players && typeof gameConfig.players === 'object') {
        const players = gameConfig.players as { min?: number; max?: number };
        definition.players = {
          ...players,
          min: game.minPlayers || players.min || 3,
          max: game.maxPlayers || players.max || 10,
        };
      }
    } else {
      // Template-based game - build definition from template config
      const baseConfig = gameConfig as {
        id?: string;
        name?: string;
        description?: string;
        minPlayers?: number;
        maxPlayers?: number;
        decks?: Record<string, { displayName: string; cardType: string }>;
        slots?: unknown[];
        defaultSettings?: unknown;
        variants?: unknown[];
        phases?: unknown[];
        initialPhase?: string;
      };

      // Override with user's settings
      definition = {
        ...baseConfig,
        id: game.slug,
        name: game.name,
        description: game.description || baseConfig.description,
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers,
      };
    }

    // Build card packs in the format the game engine expects
    type Card = {
      id: string;
      type: string;
      properties: {
        text?: string;
        pick?: number;
        [key: string]: unknown;
      };
    };

    type CardPack = {
      id: string;
      name: string;
      description: string;
      official: boolean;
      cards: {
        [deckType: string]: Card[];
      };
    };

    const packs: CardPack[] = game.cardPacks.map((pack) => {
      // Group cards by type
      const cardsByType: { [key: string]: Card[] } = {};

      for (const card of pack.cards) {
        if (!cardsByType[card.cardType]) {
          cardsByType[card.cardType] = [];
        }
        cardsByType[card.cardType].push({
          id: card.id,
          type: card.cardType,
          properties: card.properties as Card['properties'],
        });
      }

      return {
        id: pack.id,
        name: pack.name,
        description: `Card pack for ${game.name}`,
        official: false,
        cards: cardsByType,
      };
    });

    // Increment play count (fire and forget)
    prisma.customGameDefinition.update({
      where: { id: game.id },
      data: { playCount: { increment: 1 } },
    }).catch(() => {
      // Ignore errors - this is non-critical
    });

    return NextResponse.json({
      definition,
      packs,
      meta: {
        gameId: game.id,
        gameName: game.name,
        creatorName: game.creator.displayName || game.creator.username || 'Anonymous',
        playCount: game.playCount + 1,
      },
    });
  } catch (error) {
    console.error('Error loading game:', error);
    return NextResponse.json(
      { error: 'Failed to load game' },
      { status: 500 }
    );
  }
}
