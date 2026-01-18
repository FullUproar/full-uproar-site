'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { FMMGame } from './game-data';

export default function GameCard({ game }: { game: FMMGame }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={`/games/fugly-mayhem-machine/${game.slug}`}
      style={{ textDecoration: 'none' }}
    >
      <div
        style={{
          background: 'linear-gradient(to bottom right, #1f2937, #111827)',
          borderRadius: '1.5rem',
          padding: '2rem',
          border: `3px solid ${game.color}`,
          transition: 'all 0.3s',
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transform: isHovered ? 'translateY(-10px)' : 'translateY(0)',
          boxShadow: isHovered ? `0 20px 40px ${game.color}40` : 'none',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Icon */}
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          {game.icon}
        </div>

        {/* Name */}
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 900,
          color: game.color,
          textTransform: 'uppercase',
          marginBottom: '0.5rem',
        }}>
          {game.name}
        </h2>

        {/* Tagline */}
        <p style={{
          fontSize: '1rem',
          color: '#fbbf24',
          fontStyle: 'italic',
          marginBottom: '1rem',
        }}>
          "{game.tagline}"
        </p>

        {/* Description */}
        <p style={{
          fontSize: '0.875rem',
          color: '#e2e8f0',
          lineHeight: 1.6,
          flex: 1,
        }}>
          {game.description}
        </p>

        {/* Stats */}
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

        {/* Learn More */}
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
  );
}
