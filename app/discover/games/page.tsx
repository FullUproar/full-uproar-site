'use client';

import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import { Zap, ChevronRight } from 'lucide-react';

// Game series data - can be expanded as new series are added
const gameSeries = [
  {
    id: 'fugly-mayhem-machine',
    name: "Fugly's Mayhem Machine",
    tagline: '4 Game Mods. Infinite Chaos.',
    description: 'Transform any game you own into pure mayhem with our collection of universal game mods. Each mod works with ANY game - board games, card games, video games, even sports!',
    color: '#f97316',
    icon: '⚡',
    gameCount: 4,
    featured: true,
  },
  // Add more series here as they're developed
];

export default function DiscoverGamesPage() {
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
          color: '#94a3b8'
        }}>
          <Link href="/discover" style={{ color: '#f97316', textDecoration: 'none' }}>
            Discover
          </Link>
          <span>/</span>
          <span style={{ color: '#e2e8f0' }}>Games</span>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 900,
            color: '#f97316',
            marginBottom: '1rem'
          }}>
            Our Games
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#fdba74', maxWidth: '600px', margin: '0 auto' }}>
            Explore our game series, learn how they work, and find the perfect chaos for your game nights.
          </p>
        </div>

        {/* Series Grid */}
        <div style={{
          display: 'grid',
          gap: '2rem'
        }}>
          {gameSeries.map((series) => (
            <Link
              key={series.id}
              href={`/discover/games/${series.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                background: 'linear-gradient(135deg, #1f2937, #111827)',
                borderRadius: '1.5rem',
                padding: '2.5rem',
                border: `3px solid ${series.color}`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s'
              }}>
                {series.featured && (
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: `linear-gradient(45deg, ${series.color}, #fbbf24)`,
                    color: '#000',
                    padding: '0.5rem 1rem',
                    borderRadius: '50px',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <Zap size={14} />
                    Featured
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
                  <div style={{
                    fontSize: '4rem',
                    width: '6rem',
                    height: '6rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${series.color}20`,
                    borderRadius: '1rem',
                    flexShrink: 0
                  }}>
                    {series.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <h2 style={{
                      fontSize: '2rem',
                      fontWeight: 900,
                      color: series.color,
                      marginBottom: '0.5rem'
                    }}>
                      {series.name}
                    </h2>
                    <p style={{
                      fontSize: '1.25rem',
                      color: '#fbbf24',
                      fontWeight: 'bold',
                      marginBottom: '1rem'
                    }}>
                      {series.tagline}
                    </p>
                    <p style={{
                      color: '#e2e8f0',
                      lineHeight: 1.7,
                      marginBottom: '1.5rem'
                    }}>
                      {series.description}
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2rem',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        background: `${series.color}20`,
                        color: series.color,
                        padding: '0.5rem 1rem',
                        borderRadius: '50px',
                        fontWeight: 'bold',
                        fontSize: '0.875rem'
                      }}>
                        {series.gameCount} Games
                      </span>
                      <span style={{
                        color: series.color,
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        Explore Series <ChevronRight size={20} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* More Coming Soon */}
        <div style={{
          marginTop: '3rem',
          padding: '2rem',
          background: 'rgba(249, 115, 22, 0.1)',
          borderRadius: '1rem',
          border: '2px dashed #f97316',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#f97316', marginBottom: '0.5rem' }}>
            More Series Coming Soon
          </h3>
          <p style={{ color: '#fdba74' }}>
            We're always cooking up new ways to bring chaos to your game nights.
          </p>
        </div>
      </div>
    </div>
  );
}
