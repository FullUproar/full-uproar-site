import FullUproarHomeStyled from "./components/FullUproarHomeStyled";

// Use the same API approach that works in admin panel
async function fetchGameData() {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NODE_ENV === 'production' 
        ? 'https://full-uproar-site-two.vercel.app'
        : 'http://localhost:3000';
    
    console.log('Fetching from baseUrl:', baseUrl);
    
    const [gamesRes, comicsRes, newsRes] = await Promise.all([
      fetch(`${baseUrl}/api/games`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      }),
      fetch(`${baseUrl}/api/comics`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      }),
      fetch(`${baseUrl}/api/news`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      })
    ]);

    console.log('API responses:', {
      games: gamesRes.status,
      comics: comicsRes.status,
      news: newsRes.status
    });

    const games = gamesRes.ok ? await gamesRes.json() : [];
    const comics = comicsRes.ok ? await comicsRes.json() : [];
    const news = newsRes.ok ? await newsRes.json() : [];

    console.log('Fetched via API - Games:', games.length, games);
    
    return { games, comics, news };
  } catch (error) {
    console.error('API fetch error:', error);
    return { games: [], comics: [], news: [] };
  }
}

export default async function Home() {
  const { games, comics, news } = await fetchGameData();

  return <FullUproarHomeStyled games={games} comics={comics} news={news} />;
}
