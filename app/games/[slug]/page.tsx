import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import GameProductClean from './GameProductClean';

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

  return (
    <GameProductClean 
      game={game} 
      similarGames={similarGames}
    />
  );
}