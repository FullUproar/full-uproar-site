'use client';

import React from 'react';
import type { Player } from '@full-uproar/game-platform-core';

// =============================================================================
// STYLES
// =============================================================================

const styles = {
  container: {
    background: 'rgba(30, 41, 59, 0.9)',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '400px',
    width: '100%',
    border: '2px solid rgba(255, 130, 0, 0.3)',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold' as const,
    color: '#FF8200',
    marginBottom: '20px',
    textAlign: 'center' as const,
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(15, 23, 42, 0.5)',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  rowFirst: {
    background: 'rgba(255, 130, 0, 0.15)',
    border: '2px solid rgba(255, 130, 0, 0.4)',
  },
  rowYou: {
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
  },
  rank: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold' as const,
  },
  rankFirst: {
    background: '#FF8200',
    color: '#000',
  },
  rankOther: {
    background: 'rgba(75, 85, 99, 0.5)',
    color: '#9ca3af',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#4b5563',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  avatarFirst: {
    background: '#FF8200',
    color: '#000',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: '16px',
    color: '#fff',
    fontWeight: '500' as const,
  },
  wins: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  score: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    color: '#FBDB65',
  },
  scoreFirst: {
    color: '#FF8200',
  },
  badge: {
    fontSize: '10px',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
    marginLeft: '8px',
  },
  badgeWinner: {
    background: 'rgba(255, 130, 0, 0.2)',
    color: '#FF8200',
  },
  badgeYou: {
    background: 'rgba(139, 92, 246, 0.2)',
    color: '#a78bfa',
  },
};

// =============================================================================
// SCOREBOARD COMPONENT
// =============================================================================

interface ScoreboardProps {
  players: Player[];
  currentPlayerId?: string;
  title?: string;
  showRanks?: boolean;
}

export function Scoreboard({
  players,
  currentPlayerId,
  title = 'Scoreboard',
  showRanks = true,
}: ScoreboardProps) {
  // Sort players by score
  const sortedPlayers = [...players]
    .filter((p) => p.presence === 'active' || p.presence === 'away')
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>{title}</h2>
      <div style={styles.list}>
        {sortedPlayers.map((player, index) => {
          const isFirst = index === 0 && (player.score || 0) > 0;
          const isYou = player.id === currentPlayerId;

          return (
            <div
              key={player.id}
              style={{
                ...styles.row,
                ...(isFirst ? styles.rowFirst : {}),
                ...(isYou && !isFirst ? styles.rowYou : {}),
              }}
            >
              {showRanks && (
                <div
                  style={{
                    ...styles.rank,
                    ...(isFirst ? styles.rankFirst : styles.rankOther),
                  }}
                >
                  {index + 1}
                </div>
              )}
              <div
                style={{
                  ...styles.avatar,
                  ...(isFirst ? styles.avatarFirst : {}),
                }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
              <div style={styles.info}>
                <div style={styles.name}>
                  {player.name}
                  {isFirst && <span style={{ ...styles.badge, ...styles.badgeWinner }}>Leader</span>}
                  {isYou && <span style={{ ...styles.badge, ...styles.badgeYou }}>You</span>}
                </div>
                <div style={styles.wins}>
                  {player.score || 0} round{(player.score || 0) !== 1 ? 's' : ''} won
                </div>
              </div>
              <div
                style={{
                  ...styles.score,
                  ...(isFirst ? styles.scoreFirst : {}),
                }}
              >
                {player.score || 0}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
