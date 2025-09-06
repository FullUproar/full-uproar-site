import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import GameLandingPage from './GameLandingPage';

// Temporarily disable static generation to avoid connection limit issues
// TODO: Re-enable with Prisma Accelerate or connection pooling
export const dynamic = 'force-dynamic';

// export async function generateStaticParams() {
//   const games = await prisma.game.findMany({
//     select: { slug: true }
//   });
  
//   return games.map((game) => ({
//     slug: game.slug
//   }));
// }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const game = await prisma.game.findUnique({
    where: { slug }
  });
  
  if (!game) {
    return {
      title: 'Game Not Found'
    };
  }
  
  return {
    title: `${game.title} - An Epic Gaming Experience | Full Uproar`,
    description: game.story || game.description || `Experience ${game.title} - ${game.tagline || 'The ultimate board game adventure'}`,
    openGraph: {
      title: game.title,
      description: game.tagline || game.description,
      images: game.imageUrl ? [game.imageUrl] : [],
      type: 'website',
      siteName: 'Full Uproar Games'
    }
  };
}

export default async function PlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
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
  
  // Get reviews/testimonials (mock for now)
  const testimonials = [
    {
      author: "BoardGameGeek User",
      rating: 5,
      quote: "Absolutely mind-blowing gameplay. Can't put it down!"
    },
    {
      author: "Tabletop Weekly",
      rating: 5,
      quote: "A masterpiece of game design. Instant classic."
    },
    {
      author: "Dice Tower Review",
      rating: 4,
      quote: "Innovative mechanics that push the boundaries."
    }
  ];
  
  // Get similar games for cross-selling
  const similarGames = await prisma.game.findMany({
    where: {
      id: { not: game.id },
      category: game.category
    },
    take: 3,
    include: {
      images: {
        where: { isPrimary: true },
        take: 1
      }
    }
  });
  
  return (
    <GameLandingPage 
      game={game} 
      testimonials={testimonials}
      similarGames={similarGames}
    />
  );
}