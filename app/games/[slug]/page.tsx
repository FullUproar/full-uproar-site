import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import GameProductClient from './GameProductClient';

interface GamePageProps {
  params: { slug: string };
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
  const game = await getGame(params.slug);
  const similarGames = await getSimilarGames(game);

  return (
    <GameProductClient 
      game={game} 
      similarGames={similarGames}
    />
  );
}