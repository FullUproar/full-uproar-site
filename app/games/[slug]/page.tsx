import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import GameProductTabbed from './GameProductTabbed';
import { ProductSchema, BreadcrumbSchema } from '@/app/components/StructuredData';

interface GamePageProps {
  params: Promise<{ slug: string }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug } = await params;

  const game = await prisma.game.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
      tagline: true,
      imageUrl: true,
      priceCents: true,
    }
  });

  if (!game) {
    return {
      title: 'Game Not Found | Full Uproar',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fulluproar.com';
  const description = game.tagline || game.description || `Check out ${game.title} - a chaotic game from Full Uproar.`;

  return {
    title: `${game.title} | Full Uproar Games`,
    description,
    openGraph: {
      title: `${game.title} | Full Uproar Games`,
      description,
      url: `${baseUrl}/games/${slug}`,
      type: 'website',
      images: game.imageUrl ? [{ url: game.imageUrl, alt: game.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${game.title} | Full Uproar Games`,
      description,
      images: game.imageUrl ? [game.imageUrl] : undefined,
    },
    alternates: {
      canonical: `${baseUrl}/games/${slug}`,
    },
  };
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
    playerCount: game.playerCount || 'TWO_TO_FOUR',
    playTime: game.playTime || 'MEDIUM',
    ageRating: game.ageRating || 'ALL_AGES',
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
    playerCount: g.playerCount || 'TWO_TO_FOUR',
    playTime: g.playTime || 'MEDIUM',
    ageRating: g.ageRating || 'ALL_AGES',
    category: g.category || undefined,
    howToPlay: g.howToPlay || undefined,
    components: g.components || undefined,
    videoUrl: g.videoUrl || undefined,
    isNew: g.isNew ?? undefined,
    isBestseller: g.isBestseller ?? undefined,
  }));

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fulluproar.com';

  return (
    <>
      <ProductSchema
        name={game.title}
        description={game.description || game.tagline || ''}
        image={game.imageUrl || '/placeholder-game.jpg'}
        priceCents={game.priceCents}
        slug={slug}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'Games', url: `${baseUrl}/games` },
          { name: game.title, url: `${baseUrl}/games/${slug}` },
        ]}
      />
      <GameProductTabbed
        game={transformedGame}
        similarGames={transformedSimilarGames}
      />
    </>
  );
}