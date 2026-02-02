import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import GameShopPage from './GameShopPage';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const game = await prisma.game.findUnique({
    where: { slug }
  });

  if (!game) {
    return {
      title: 'Game Not Found | Full Uproar'
    };
  }

  return {
    title: `${game.title} - Buy Now | Full Uproar`,
    description: game.story || game.description || `Get ${game.title} - ${game.tagline || 'The ultimate board game adventure'}`,
    openGraph: {
      title: `${game.title} | Full Uproar Shop`,
      description: game.tagline || game.description,
      images: game.imageUrl ? [game.imageUrl] : [],
      type: 'website',
      siteName: 'Full Uproar Games'
    }
  };
}

export default async function ShopGamePage({ params }: { params: Promise<{ slug: string }> }) {
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

  // Get review summary for hero section
  const reviewSummary = await prisma.review.aggregate({
    where: {
      gameId: game.id,
      status: 'approved'
    },
    _avg: { rating: true },
    _count: { id: true }
  });

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
    <GameShopPage
      game={game}
      similarGames={similarGames}
      reviewSummary={{
        averageRating: reviewSummary._avg.rating || 0,
        totalReviews: reviewSummary._count.id
      }}
    />
  );
}
