import { prisma } from "@/lib/prisma";
import FullUproarHomeStyled from "./components/FullUproarHomeStyled";

export default async function Home() {
  console.log('Starting Home page render...');
  
  let games: any[] = [];
  let comics: any[] = [];
  let news: any[] = [];

  try {
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    // Direct database queries (bypassing auth middleware)
    const [gamesData, comicsData, newsData] = await Promise.all([
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

    console.log('Raw database results:', {
      games: gamesData.length,
      comics: comicsData.length,
      news: newsData.length
    });

    // Convert dates to strings for client component serialization
    games = gamesData.map(game => ({
      ...game,
      createdAt: game.createdAt.toISOString()
    }));
    
    comics = comicsData.map(comic => ({
      ...comic,
      createdAt: comic.createdAt.toISOString()
    }));
    
    news = newsData.map(post => ({
      ...post,
      createdAt: post.createdAt.toISOString()
    }));

    console.log('Final data for component:', {
      games: games.length,
      comics: comics.length,
      news: news.length
    });

  } catch (error) {
    console.error('Database error:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
  }

  return <FullUproarHomeStyled games={games} comics={comics} news={news} />;
}
