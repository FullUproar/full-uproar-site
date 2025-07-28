import { prisma } from "@/lib/prisma";
import FullUproarHomeStyled from "./components/FullUproarHomeStyled";

export default async function Home() {
  let games = [];
  let comics = [];
  let news = [];

  try {
    // Simple, direct database queries
    games = await prisma.game.findMany({
      orderBy: { createdAt: 'desc' }
    });
    comics = await prisma.comic.findMany({
      orderBy: { createdAt: 'desc' }
    });
    news = await prisma.newsPost.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Convert dates to strings to avoid serialization issues
    games = games.map(game => ({
      ...game,
      createdAt: game.createdAt.toISOString()
    }));
    comics = comics.map(comic => ({
      ...comic,
      createdAt: comic.createdAt.toISOString()
    }));
    news = news.map(post => ({
      ...post,
      createdAt: post.createdAt.toISOString()
    }));

    console.log('Server: Found games:', games.length);
  } catch (error) {
    console.error('Database error:', error);
    // Return empty arrays on error
  }

  return <FullUproarHomeStyled games={games} comics={comics} news={news} />;
}
