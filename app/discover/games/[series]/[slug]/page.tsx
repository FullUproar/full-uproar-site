import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import { FMM_SERIES, FMM_GAMES, getGameBySlug, getAllGameSlugs } from '@/lib/games/fmm-data';

interface PageProps {
  params: Promise<{ series: string; slug: string }>;
}

// Map series slugs to their data
const seriesData: Record<string, { series: typeof FMM_SERIES; getGame: typeof getGameBySlug; getAllSlugs: typeof getAllGameSlugs }> = {
  'fugly-mayhem-machine': { series: FMM_SERIES, getGame: getGameBySlug, getAllSlugs: getAllGameSlugs },
};

export async function generateStaticParams() {
  const params: { series: string; slug: string }[] = [];
  for (const [seriesSlug, data] of Object.entries(seriesData)) {
    const slugs = data.getAllSlugs();
    slugs.forEach(slug => {
      params.push({ series: seriesSlug, slug });
    });
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { series, slug } = await params;
  const data = seriesData[series];

  if (!data) {
    return { title: 'Game Not Found | Full Uproar' };
  }

  const game = data.getGame(slug);
  if (!game) {
    return { title: 'Game Not Found | Full Uproar' };
  }

  return {
    title: `${game.name} | ${data.series.name} | Full Uproar`,
    description: `${game.description} - ${game.tagline}`,
    openGraph: {
      title: game.name,
      description: game.description,
      type: 'website',
    },
  };
}

export default async function GameContentPage({ params }: PageProps) {
  const { series, slug } = await params;
  const data = seriesData[series];

  if (!data) {
    notFound();
  }

  const game = data.getGame(slug);
  if (!game) {
    notFound();
  }

  const seriesInfo = data.series;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)' }}>
      <Navigation />

      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '6rem 1rem 3rem' }}>
        {/* Breadcrumb */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '2rem',
          fontSize: '0.875rem',
          color: '#94a3b8',
          flexWrap: 'wrap',
        }}>
          <Link href="/discover" style={{ color: '#FF8200', textDecoration: 'none' }}>
            Discover
          </Link>
          <span>/</span>
          <Link href="/discover/games" style={{ color: '#FF8200', textDecoration: 'none' }}>
            Games
          </Link>
          <span>/</span>
          <Link href={`/discover/games/${series}`} style={{ color: '#FF8200', textDecoration: 'none' }}>
            {seriesInfo.name}
          </Link>
          <span>/</span>
          <span style={{ color: '#e2e8f0' }}>{game.name}</span>
        </div>

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
          padding: '2rem',
          background: `linear-gradient(135deg, ${game.color}15, transparent)`,
          borderRadius: '1rem',
          border: `2px solid ${game.color}40`,
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>{game.icon}</div>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            color: game.color,
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}>
            {game.name}
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: '#fbbf24',
            fontStyle: 'italic',
          }}>
            "{game.tagline}"
          </p>
        </div>

        {/* Quick Stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '3rem',
          flexWrap: 'wrap',
        }}>
          {[
            { label: 'Players', value: game.playerCount, emoji: '👥' },
            { label: 'Adds', value: game.playTime, emoji: '⏱️' },
            { label: 'Ages', value: game.ageRating, emoji: '🎂' },
          ].map((stat) => (
            <div key={stat.label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(31, 41, 55, 0.5)',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <span>{stat.emoji}</span>
              <span style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{
          marginBottom: '3rem',
          padding: '2rem',
          background: 'rgba(31, 41, 55, 0.5)',
          borderRadius: '1rem',
          border: `1px solid ${game.color}30`,
        }}>
          <p style={{
            fontSize: '1.125rem',
            color: '#e2e8f0',
            lineHeight: 1.8,
            textAlign: 'center',
          }}>
            {game.description}
          </p>
        </div>

        {/* Preview Content */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: game.color,
            marginBottom: '1.5rem',
            paddingBottom: '0.5rem',
            borderBottom: `2px solid ${game.color}40`,
          }}>
            What Can You Do?
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: '#fbbf24',
            marginBottom: '1rem',
            fontWeight: 'bold',
          }}>
            {game.previewContent.hook}
          </p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {game.previewContent.bullets.map((bullet, i) => (
              <li key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                marginBottom: '0.75rem',
                color: '#e2e8f0',
              }}>
                <span style={{ color: game.color, fontSize: '1.25rem' }}>✓</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Features */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: game.color,
            marginBottom: '1.5rem',
            paddingBottom: '0.5rem',
            borderBottom: `2px solid ${game.color}40`,
          }}>
            What's Included
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
          }}>
            {game.features.map((feature, i) => (
              <div key={i} style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '1rem',
                borderRadius: '0.5rem',
                textAlign: 'center',
                color: '#e2e8f0',
                border: `1px solid ${game.color}30`,
              }}>
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: game.color,
            marginBottom: '1.5rem',
            paddingBottom: '0.5rem',
            borderBottom: `2px solid ${game.color}40`,
          }}>
            How It Works
          </h2>
          <p style={{
            fontSize: '1rem',
            color: '#e2e8f0',
            lineHeight: 1.8,
          }}>
            {game.howItWorks}
          </p>
        </div>

        {/* Perfect For */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: game.color,
            marginBottom: '1.5rem',
            paddingBottom: '0.5rem',
            borderBottom: `2px solid ${game.color}40`,
          }}>
            Perfect For
          </h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {game.perfectFor.map((item, i) => (
              <li key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem',
                color: '#fbbf24',
              }}>
                <span style={{ fontSize: '1.25rem' }}>🎯</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTAs */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'center',
          marginTop: '3rem',
        }}>
          <Link
            href={`/discover/games/${series}/${slug}/how-to-play`}
            style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              background: `linear-gradient(135deg, ${game.color}, ${game.color}88)`,
              color: '#fff',
              borderRadius: '50px',
              fontWeight: 900,
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
          >
            How To Play →
          </Link>
          <Link
            href="/shop/games"
            style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              background: 'transparent',
              color: game.color,
              border: `2px solid ${game.color}`,
              borderRadius: '50px',
              fontWeight: 'bold',
              textDecoration: 'none',
            }}
          >
            Get Your Copy
          </Link>
        </div>

        {/* Navigation */}
        <div style={{
          marginTop: '4rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          flexWrap: 'wrap',
        }}>
          <Link
            href={`/discover/games/${series}`}
            style={{
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            ← Back to {seriesInfo.name}
          </Link>
        </div>
      </div>
    </div>
  );
}
