import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import GameProductTabbed from './GameProductTabbed';
import { PlayerCount, PlayTime, AgeRating } from '@prisma/client';

interface GamePageProps {
  params: Promise<{ slug: string }>;
}

async function getGame(slug: string) {
  const game = await prisma.game.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: { sortOrder: 'asc' }
      }
    }
  });

  if (!game) {
    notFound();
  }

  return game;
}

async function getSimilarGames(currentGame: any) {
  // Get games with similar tags or in the same price range
  const tags = currentGame.tags ? JSON.parse(currentGame.tags) : [];
  
  const similarGames = await prisma.game.findMany({
    where: {
      AND: [
        { id: { not: currentGame.id } },
        {
          OR: [
            // Similar price range (within 20%)
            {
              priceCents: {
                gte: Math.floor(currentGame.priceCents * 0.8),
                lte: Math.ceil(currentGame.priceCents * 1.2)
              }
            },
            // Has featured flag
            { featured: true },
            // Is a bundle like current game
            { isBundle: currentGame.isBundle }
          ]
        }
      ]
    },
    take: 4,
    include: {
      images: {
        where: { isPrimary: true },
        take: 1
      }
    }
  });

  return similarGames;
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = await getGame(slug);
  const similarGames = await getSimilarGames(game);

  // Transform the game data to match the expected types
  const transformedGame = {
    ...game,
    playerCount: game.playerCount as PlayerCount || PlayerCount.TWO_TO_FOUR,
    playTime: game.playTime as PlayTime || PlayTime.MEDIUM,
    ageRating: game.ageRating as AgeRating || AgeRating.ALL_AGES,
    category: game.category || undefined,
    howToPlay: game.howToPlay || undefined,
    components: game.components || undefined,
    videoUrl: game.videoUrl || undefined,
    isNew: game.isNew ?? undefined,
    isBestseller: game.isBestseller ?? undefined,
  };

  // Transform similar games
  const transformedSimilarGames = similarGames.map(g => ({
    ...g,
    playerCount: g.playerCount as PlayerCount || PlayerCount.TWO_TO_FOUR,
    playTime: g.playTime as PlayTime || PlayTime.MEDIUM,
    ageRating: g.ageRating as AgeRating || AgeRating.ALL_AGES,
    category: g.category || undefined,
    howToPlay: g.howToPlay || undefined,
    components: g.components || undefined,
    videoUrl: g.videoUrl || undefined,
    isNew: g.isNew ?? undefined,
    isBestseller: g.isBestseller ?? undefined,
  }));

  return (
    <GameProductTabbed 
      game={transformedGame} 
      similarGames={transformedSimilarGames}
    />
  );
}