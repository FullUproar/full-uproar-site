import FullUproarHomeStyled from "./components/FullUproarHomeStyled";

async function fetchData() {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const [gamesRes, comicsRes, newsRes] = await Promise.all([
      fetch(`${baseUrl}/api/games`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/comics`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/news`, { cache: 'no-store' })
    ]);

    const games = gamesRes.ok ? await gamesRes.json() : [];
    const comics = comicsRes.ok ? await comicsRes.json() : [];
    const news = newsRes.ok ? await newsRes.json() : [];

    console.log('Fetched via API - Games:', games.length, games);

    return { games, comics, news };
  } catch (error) {
    console.error('Error fetching data:', error);
    return { games: [], comics: [], news: [] };
  }
}

export default async function Home() {
  const { games, comics, news } = await fetchData();

  return <FullUproarHomeStyled games={games} comics={comics} news={news} />;
}
