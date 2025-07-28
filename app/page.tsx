import { prisma } from "@/lib/prisma";
import FullUproarHomeStyled from "./components/FullUproarHomeStyled";

export default async function Home() {
  // Fetch all data in parallel for better performance
  const [games, comics, news] = await Promise.all([
    prisma.game.findMany({
      orderBy: { createdAt: 'desc' }
    }),
    prisma.comic.findMany({
      orderBy: { createdAt: 'desc' }
    }),
    prisma.newsPost.findMany({
      orderBy: { createdAt: 'desc' }
    })
  ]);

  // Debug log
  console.log('Games found:', games.length, games);

  // Convert dates to strings for all components to avoid serialization issues
  const formattedGames = games.map(game => ({
    ...game,
    createdAt: game.createdAt.toISOString()
  }));

  const formattedComics = comics.map(comic => ({
    ...comic,
    createdAt: comic.createdAt.toISOString()
  }));

  const formattedNews = news.map(post => ({
    ...post,
    createdAt: post.createdAt.toISOString()
  }));

  return <FullUproarHomeStyled games={formattedGames} comics={formattedComics} news={formattedNews} />;
}
