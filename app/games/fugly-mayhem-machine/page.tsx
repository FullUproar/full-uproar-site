import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import { FMM_SERIES } from '@/lib/games/fmm-data';
import { getEnrichedFMMGames } from '@/lib/games/fmm-db';
import GameCard from './GameCard';

export default async function FuglyMayhemMachinePage() {
  const FMM_GAMES = await getEnrichedFMMGames();
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)' }}>
      <Navigation />

      {/* Hero Section */}
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '4rem 1rem',
        textAlign: 'center',
      }}>
        {/* Logo/Title */}
        <div style={{
          marginBottom: '2rem',
          position: 'relative',
        }}>
          <div style={{
            fontSize: '1rem',
            color: '#FF8200',
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
            background: 'linear-gradient(45deg, #FF8200, #fbbf24, #FF8200)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            lineHeight: 1.1,
            margin: 0,
            textShadow: '0 0 60px rgba(255, 130, 0, 0.5)',
          }}>
            {FMM_SERIES.name}
          </h1>
          <p style={{
            fontSize: 'clamp(1.25rem, 3vw, 2rem)',
            color: '#fbbf24',
            fontWeight: 'bold',
            marginTop: '1rem',
            letterSpacing: '0.1em',
          }}>
            {FMM_SERIES.tagline}
          </p>
        </div>

        {/* Description */}
        <p style={{
          fontSize: '1.25rem',
          color: '#e2e8f0',
          maxWidth: '48rem',
          margin: '0 auto 3rem',
          lineHeight: 1.7,
        }}>
          {FMM_SERIES.description}
        </p>

        {/* Game Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          marginTop: '4rem',
        }}>
          {FMM_GAMES.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>

        {/* How It Works Section */}
        <div style={{
          marginTop: '6rem',
          padding: '3rem',
          background: 'rgba(255, 130, 0, 0.1)',
          borderRadius: '1.5rem',
          border: '2px solid rgba(255, 130, 0, 0.3)',
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: '#FF8200',
            marginBottom: '2rem',
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
                  background: 'linear-gradient(45deg, #FF8200, #fbbf24)',
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

        {/* CTA Section */}
        <div style={{
          marginTop: '4rem',
          padding: '2rem',
        }}>
          <p style={{
            fontSize: '1.25rem',
            color: '#FBDB65',
            marginBottom: '1.5rem',
          }}>
            Ready to transform your game nights?
          </p>
          <Link
            href="/games"
            style={{
              display: 'inline-block',
              padding: '1rem 2.5rem',
              background: 'linear-gradient(45deg, #FF8200, #fb923c)',
              color: '#0a0a0a',
              borderRadius: '9999px',
              fontWeight: 900,
              fontSize: '1.125rem',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'transform 0.2s',
            }}
          >
            Shop All Games
          </Link>
        </div>
      </div>
    </div>
  );
}
