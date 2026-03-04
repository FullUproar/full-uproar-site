/**
 * Server-only utility: enriches static FMM game data with DB values.
 * playerCount, playTime, ageRating, and imageUrl come from the database;
 * everything else (howToPlay, features, etc.) stays from the static file.
 */
import { prisma } from '@/lib/prisma';
import { FMM_GAMES, type FMMGame } from './fmm-data';

export async function getEnrichedFMMGames(): Promise<FMMGame[]> {
  const slugs = FMM_GAMES.map(g => g.slug);
  const dbGames = await prisma.game.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, players: true, timeToPlay: true, ageRating: true, imageUrl: true },
  });

  const dbMap = new Map(dbGames.map(g => [g.slug, g]));

  return FMM_GAMES.map(game => {
    const db = dbMap.get(game.slug);
    if (!db) return game;
    return {
      ...game,
      playerCount: db.players || game.playerCount,
      playTime: db.timeToPlay || game.playTime,
      ageRating: db.ageRating || game.ageRating,
      imageUrl: db.imageUrl || game.imageUrl,
    };
  });
}

export async function getEnrichedFMMGame(slug: string): Promise<FMMGame | null> {
  const games = await getEnrichedFMMGames();
  return games.find(g => g.slug === slug) || null;
}
