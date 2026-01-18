import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import { getGameBySlug, getAllGameSlugs, FMM_SERIES } from '../../game-data';

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
    title: `How To Play ${game.name} | Fugly's Mayhem Machine`,
    description: `Learn how to play ${game.name}. ${game.tagline}`,
    openGraph: {
      title: `How To Play ${game.name}`,
      description: `Complete rules and instructions for ${game.name}`,
      type: 'website',
    },
  };
}

export default async function HowToPlayPage({ params }: PageProps) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game) {
    notFound();
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)' }}>
      <Navigation />

      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1rem 4rem' }}>
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
          <Link href="/games/fugly-mayhem-machine" style={{ color: '#f97316', textDecoration: 'none' }}>
            {FMM_SERIES.name}
          </Link>
          <span>/</span>
          <Link href={`/games/fugly-mayhem-machine/${game.slug}`} style={{ color: game.color, textDecoration: 'none' }}>
            {game.name}
          </Link>
          <span>/</span>
          <span style={{ color: '#e2e8f0' }}>How To Play</span>
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
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{game.icon}</div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: game.color,
            textTransform: 'uppercase',
            marginBottom: '0.25rem',
          }}>
            How To Play
          </h1>
          <p style={{
            fontSize: '1.5rem',
            color: '#e2e8f0',
            fontWeight: 'bold',
          }}>
            {game.name}
          </p>
          <p style={{
            fontSize: '1rem',
            color: '#fbbf24',
            fontStyle: 'italic',
            marginTop: '0.5rem',
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

        {/* Contents/Components */}
        <Section title="What's In The Box" color={game.color}>
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
        </Section>

        {/* Setup */}
        <Section title="Setup" color={game.color}>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, counterReset: 'step' }}>
            {game.howToPlay.setup.map((step, i) => (
              <li key={i} style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1rem',
                alignItems: 'flex-start',
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  background: game.color,
                  color: '#fff',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <p style={{ color: '#e2e8f0', margin: 0, paddingTop: '0.25rem' }}>{step}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Gameplay */}
        <Section title="Gameplay" color={game.color}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {game.howToPlay.gameplay.map((rule, i) => (
              <li key={i} style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1rem',
                alignItems: 'flex-start',
                paddingBottom: '1rem',
                borderBottom: i < game.howToPlay.gameplay.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
              }}>
                <span style={{ color: game.color, fontSize: '1.25rem' }}>→</span>
                <p style={{ color: '#e2e8f0', margin: 0 }}>{rule}</p>
              </li>
            ))}
          </ul>
        </Section>

        {/* Winning */}
        <Section title="Winning" color={game.color}>
          <div style={{
            background: `linear-gradient(135deg, ${game.color}20, transparent)`,
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: `1px solid ${game.color}40`,
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏆</div>
            <p style={{ color: '#e2e8f0', margin: 0, fontSize: '1.125rem', lineHeight: 1.7 }}>
              {game.howToPlay.winning}
            </p>
          </div>
        </Section>

        {/* Tips */}
        <Section title="Pro Tips" color={game.color}>
          <div style={{
            display: 'grid',
            gap: '1rem',
          }}>
            {game.howToPlay.tips.map((tip, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                padding: '1rem',
                background: 'rgba(251, 191, 36, 0.1)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(251, 191, 36, 0.3)',
              }}>
                <span style={{ fontSize: '1.25rem' }}>💡</span>
                <p style={{ color: '#fde68a', margin: 0 }}>{tip}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Variations */}
        {game.howToPlay.variations && game.howToPlay.variations.length > 0 && (
          <Section title="Variations" color={game.color}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {game.howToPlay.variations.map((variation, i) => (
                <div key={i} style={{
                  padding: '1rem',
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}>
                  <p style={{ color: '#c4b5fd', margin: 0 }}>{variation}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Quick Reference */}
        <div style={{
          marginTop: '3rem',
          padding: '2rem',
          background: 'rgba(31, 41, 55, 0.5)',
          borderRadius: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h2 style={{ color: '#f97316', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Quick Reference
          </h2>
          <p style={{ color: '#e2e8f0', lineHeight: 1.7, margin: 0 }}>
            {game.howItWorks}
          </p>
        </div>

        {/* Navigation */}
        <div style={{
          marginTop: '3rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'center',
        }}>
          <Link
            href={`/games/fugly-mayhem-machine/${game.slug}`}
            style={{
              color: game.color,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            ← Back to {game.name} Overview
          </Link>
          <Link
            href="/games/fugly-mayhem-machine"
            style={{
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            View All Fugly's Mayhem Machine Games
          </Link>
        </div>

        {/* Support */}
        <div style={{
          marginTop: '4rem',
          padding: '2rem',
          textAlign: 'center',
          background: 'rgba(249, 115, 22, 0.1)',
          borderRadius: '1rem',
          border: '1px solid rgba(249, 115, 22, 0.3)',
        }}>
          <h3 style={{ color: '#f97316', marginBottom: '0.5rem' }}>Need Help?</h3>
          <p style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Questions about the rules? Missing components? We've got you covered.
          </p>
          <Link
            href="/support"
            style={{
              color: '#f97316',
              textDecoration: 'underline',
              fontSize: '0.875rem',
            }}
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

// Section component for consistent styling
function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <h2 style={{
        color: color,
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        paddingBottom: '0.5rem',
        borderBottom: `2px solid ${color}40`,
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}
