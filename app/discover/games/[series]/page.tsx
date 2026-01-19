import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import { FMM_SERIES, FMM_GAMES } from '@/lib/games/fmm-data';

interface PageProps {
  params: Promise<{ series: string }>;
}

// Map series slugs to their data
const seriesData: Record<string, { series: typeof FMM_SERIES; games: typeof FMM_GAMES }> = {
  'fugly-mayhem-machine': { series: FMM_SERIES, games: FMM_GAMES },
};

export async function generateStaticParams() {
  return Object.keys(seriesData).map((series) => ({ series }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { series } = await params;
  const data = seriesData[series];

  if (!data) {
    return { title: 'Series Not Found | Full Uproar' };
  }

  return {
    title: `${data.series.name} | Discover | Full Uproar`,
    description: data.series.description,
  };
}

export default async function SeriesPage({ params }: PageProps) {
  const { series } = await params;
  const data = seriesData[series];

  if (!data) {
    notFound();
  }

  const { series: seriesInfo, games } = data;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)' }}>
      <Navigation />

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '6rem 1rem 3rem' }}>
        {/* Breadcrumb */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '2rem',
          fontSize: '0.875rem',
          color: '#94a3b8',
          flexWrap: 'wrap'
        }}>
          <Link href="/discover" style={{ color: '#f97316', textDecoration: 'none' }}>
            Discover
          </Link>
          <span>/</span>
          <Link href="/discover/games" style={{ color: '#f97316', textDecoration: 'none' }}>
            Games
          </Link>
          <span>/</span>
          <span style={{ color: '#e2e8f0' }}>{seriesInfo.name}</span>
        </div>

        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{
            fontSize: '1rem',
            color: '#f97316',
            fontWeight: 'bold',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            marginBottom: '1rem',
          }}>
            Full Uproar Presents
          </div>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            fontWeight: 900,
            background: 'linear-gradient(45deg, #f97316, #fbbf24, #f97316)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            lineHeight: 1.1,
            margin: 0,
          }}>
            {seriesInfo.name}
          </h1>
          <p style={{
            fontSize: 'clamp(1.25rem, 3vw, 2rem)',
            color: '#fbbf24',
            fontWeight: 'bold',
            marginTop: '1rem',
            letterSpacing: '0.1em',
          }}>
            {seriesInfo.tagline}
          </p>
          <p style={{
            fontSize: '1.25rem',
            color: '#e2e8f0',
            maxWidth: '48rem',
            margin: '2rem auto 0',
            lineHeight: 1.7,
          }}>
            {seriesInfo.description}
          </p>
        </div>

        {/* Game Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          marginTop: '4rem',
        }}>
          {games.map((game) => (
            <Link
              key={game.slug}
              href={`/discover/games/${series}/${game.slug}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                background: 'linear-gradient(to bottom right, #1f2937, #111827)',
                borderRadius: '1.5rem',
                padding: '2rem',
                border: `3px solid ${game.color}`,
                transition: 'all 0.3s',
                cursor: 'pointer',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                  {game.icon}
                </div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  color: game.color,
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}>
                  {game.name}
                </h2>
                <p style={{
                  fontSize: '1rem',
                  color: '#fbbf24',
                  fontStyle: 'italic',
                  marginBottom: '1rem',
                }}>
                  "{game.tagline}"
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#e2e8f0',
                  lineHeight: 1.6,
                  flex: 1,
                }}>
                  {game.description}
                </p>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginTop: '1.5rem',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  flexWrap: 'wrap',
                }}>
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                  }}>
                    {game.playerCount}
                  </span>
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                  }}>
                    {game.ageRating}
                  </span>
                </div>
                <div style={{
                  marginTop: '1.5rem',
                  color: game.color,
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  Learn More
                  <span style={{ fontSize: '1.25rem' }}>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* How It Works Section */}
        <div style={{
          marginTop: '6rem',
          padding: '3rem',
          background: 'rgba(249, 115, 22, 0.1)',
          borderRadius: '1.5rem',
          border: '2px solid rgba(249, 115, 22, 0.3)',
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: '#f97316',
            marginBottom: '2rem',
            textAlign: 'center',
          }}>
            How The Mayhem Machine Works
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            textAlign: 'center',
          }}>
            {[
              { step: '1', title: 'Pick Any Game', desc: 'Board game, card game, video game, sport - literally anything' },
              { step: '2', title: 'Add a Mod', desc: 'Choose one (or more!) Mayhem Machine mods to spice things up' },
              { step: '3', title: 'Unleash Chaos', desc: 'Play your game with unpredictable twists and hilarious moments' },
              { step: '4', title: 'Repeat Forever', desc: 'Every game you own just became infinitely replayable' },
            ].map((item) => (
              <div key={item.step}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #f97316, #fbbf24)',
                  color: '#0a0a0a',
                  fontWeight: 900,
                  fontSize: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}>
                  {item.step}
                </div>
                <h3 style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {item.title}
                </h3>
                <p style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: '4rem', padding: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.25rem', color: '#fdba74', marginBottom: '1.5rem' }}>
            Ready to transform your game nights?
          </p>
          <Link
            href="/shop/games"
            style={{
              display: 'inline-block',
              padding: '1rem 2.5rem',
              background: 'linear-gradient(45deg, #f97316, #fb923c)',
              color: '#0a0a0a',
              borderRadius: '9999px',
              fontWeight: 900,
              fontSize: '1.125rem',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Shop All Games
          </Link>
        </div>
      </div>
    </div>
  );
}
