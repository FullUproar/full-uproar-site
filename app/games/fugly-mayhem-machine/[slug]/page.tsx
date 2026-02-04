import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import { getGameBySlug, getAllGameSlugs, FMM_SERIES, FMM_GAMES } from '../game-data';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllGameSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game) {
    return { title: 'Game Not Found | Full Uproar' };
  }

  return {
    title: `${game.name} | Fugly's Mayhem Machine | Full Uproar`,
    description: game.description,
    openGraph: {
      title: `${game.name} | Fugly's Mayhem Machine`,
      description: game.description,
      type: 'website',
    },
  };
}

export default async function GamePreviewPage({ params }: PageProps) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game) {
    notFound();
  }

  // Find adjacent games for navigation
  const currentIndex = FMM_GAMES.findIndex(g => g.slug === slug);
  const prevGame = currentIndex > 0 ? FMM_GAMES[currentIndex - 1] : null;
  const nextGame = currentIndex < FMM_GAMES.length - 1 ? FMM_GAMES[currentIndex + 1] : null;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)' }}>
      <Navigation />

      <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 1rem 4rem' }}>
        {/* Breadcrumb */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '2rem',
          fontSize: '0.875rem',
          color: '#94a3b8',
        }}>
          <Link href="/games/fugly-mayhem-machine" style={{ color: '#FF8200', textDecoration: 'none' }}>
            {FMM_SERIES.name}
          </Link>
          <span>/</span>
          <span style={{ color: '#e2e8f0' }}>{game.name}</span>
        </div>

        {/* Hero */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
          padding: '3rem 2rem',
          background: `linear-gradient(135deg, ${game.color}15, transparent)`,
          borderRadius: '1.5rem',
          border: `2px solid ${game.color}40`,
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>{game.icon}</div>
          <h1 style={{
            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
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

        {/* Hook */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
        }}>
          <p style={{
            fontSize: '1.5rem',
            color: '#e2e8f0',
            fontWeight: 'bold',
          }}>
            {game.previewContent.hook}
          </p>
        </div>

        {/* Main Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem',
        }}>
          {/* What's Inside */}
          <div style={{
            background: 'rgba(31, 41, 55, 0.5)',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <h2 style={{ color: game.color, fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              What's Inside
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {game.features.map((feature, i) => (
                <li key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 0',
                  borderBottom: i < game.features.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                  color: '#e2e8f0',
                }}>
                  <span style={{ color: game.color }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* What You Can Do */}
          <div style={{
            background: 'rgba(31, 41, 55, 0.5)',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <h2 style={{ color: game.color, fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              What You Can Do
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {game.previewContent.bullets.map((bullet, i) => (
                <li key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem 0',
                  borderBottom: i < game.previewContent.bullets.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                  color: '#e2e8f0',
                }}>
                  <span style={{ color: '#fbbf24' }}>→</span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* How It Works */}
        <div style={{
          background: `linear-gradient(135deg, ${game.color}10, transparent)`,
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '3rem',
          border: `1px solid ${game.color}30`,
        }}>
          <h2 style={{ color: game.color, fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            How It Works
          </h2>
          <p style={{ color: '#e2e8f0', fontSize: '1.125rem', lineHeight: 1.7 }}>
            {game.howItWorks}
          </p>
        </div>

        {/* Perfect For */}
        <div style={{
          background: 'rgba(31, 41, 55, 0.5)',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '3rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h2 style={{ color: game.color, fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Perfect For
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}>
            {game.perfectFor.map((item, i) => (
              <div key={i} style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '1rem',
                borderRadius: '0.5rem',
                color: '#FBDB65',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span style={{ color: game.color }}>★</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginBottom: '3rem',
          flexWrap: 'wrap',
        }}>
          {[
            { label: 'Players', value: game.playerCount },
            { label: 'Adds', value: game.playTime },
            { label: 'Ages', value: game.ageRating },
          ].map((stat) => (
            <div key={stat.label} style={{
              textAlign: 'center',
              padding: '1rem 2rem',
              background: 'rgba(31, 41, 55, 0.5)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                {stat.label}
              </div>
              <div style={{ color: '#e2e8f0', fontWeight: 'bold' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          background: `linear-gradient(135deg, ${game.color}20, transparent)`,
          borderRadius: '1rem',
          border: `2px solid ${game.color}40`,
          marginBottom: '3rem',
        }}>
          <p style={{
            fontSize: '1.25rem',
            color: '#fbbf24',
            marginBottom: '1.5rem',
            fontWeight: 'bold',
          }}>
            {game.previewContent.callToAction}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/games"
              style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                background: `linear-gradient(45deg, ${game.color}, ${game.color}cc)`,
                color: '#fff',
                borderRadius: '9999px',
                fontWeight: 'bold',
                textDecoration: 'none',
                transition: 'transform 0.2s',
              }}
            >
              Shop Now
            </Link>
            <Link
              href={`/games/fugly-mayhem-machine/${game.slug}/how-to-play`}
              style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                background: 'transparent',
                color: game.color,
                borderRadius: '9999px',
                fontWeight: 'bold',
                textDecoration: 'none',
                border: `2px solid ${game.color}`,
                transition: 'all 0.2s',
              }}
            >
              Already Own It? Learn to Play →
            </Link>
          </div>
        </div>

        {/* Navigation to other games */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          background: 'rgba(31, 41, 55, 0.3)',
          borderRadius: '1rem',
        }}>
          {prevGame ? (
            <Link
              href={`/games/fugly-mayhem-machine/${prevGame.slug}`}
              style={{
                color: prevGame.color,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>←</span>
              <span>{prevGame.name}</span>
            </Link>
          ) : <div />}

          <Link
            href="/games/fugly-mayhem-machine"
            style={{
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            View All Games
          </Link>

          {nextGame ? (
            <Link
              href={`/games/fugly-mayhem-machine/${nextGame.slug}`}
              style={{
                color: nextGame.color,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>{nextGame.name}</span>
              <span>→</span>
            </Link>
          ) : <div />}
        </div>
      </div>
    </div>
  );
}
