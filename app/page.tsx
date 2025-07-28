import { prisma } from "@/lib/prisma";
import FullUproarHomeStyled from "./components/FullUproarHomeStyled";

export default async function Home() {
  let games = [];
  let comics = [];
  let news = [];

  try {
    console.log('Starting database queries...');
    
    // Test database connection first
    const gameCount = await prisma.game.count();
    console.log('Game count from database:', gameCount);
    
    // Simple, direct database queries
    games = await prisma.game.findMany({
      orderBy: { createdAt: 'desc' }
    });
    console.log('Raw games from database:', games.length, games);
    
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

    console.log('Server: Formatted games:', games.length);
  } catch (error) {
    console.error('Database error:', error);
    console.error('Error details:', error.message);
    // Return empty arrays on error
  }

  return <FullUproarHomeStyled games={games} comics={comics} news={news} />;
}
