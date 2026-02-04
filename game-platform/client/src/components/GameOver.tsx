'use client';

import React from 'react';
import type { Player } from '@full-uproar/game-platform-core';
import { Scoreboard } from './Scoreboard';

// =============================================================================
// STYLES
// =============================================================================

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    textAlign: 'center' as const,
  },
  confetti: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none' as const,
    overflow: 'hidden',
  },
  content: {
    position: 'relative' as const,
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '24px',
  },
  trophy: {
    fontSize: '64px',
    marginBottom: '8px',
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold' as const,
    color: '#FF8200',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '18px',
    color: '#FBDB65',
    marginBottom: '24px',
  },
  winnerName: {
    color: '#fff',
  },
  actions: {
    display: 'flex',
    gap: '16px',
    marginTop: '24px',
  },
  button: {
    padding: '14px 32px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
  },
  primaryButton: {
    background: '#FF8200',
    color: '#000',
  },
  secondaryButton: {
    background: 'transparent',
    border: '2px solid rgba(255, 130, 0, 0.5)',
    color: '#FF8200',
  },
};

// =============================================================================
// GAME OVER COMPONENT
// =============================================================================

interface GameOverProps {
  players: Player[];
  currentPlayerId?: string;
  onPlayAgain?: () => void;
  onBackToLobby?: () => void;
}

export function GameOver({
  players,
  currentPlayerId,
  onPlayAgain,
  onBackToLobby,
}: GameOverProps) {
  // Find the winner (highest score)
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  const winner = sortedPlayers[0];
  const isCurrentPlayerWinner = winner?.id === currentPlayerId;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.trophy}>🏆</div>
        <h1 style={styles.title}>Game Over!</h1>
        <p style={styles.subtitle}>
          {isCurrentPlayerWinner ? (
            <>You won with {winner?.score || 0} points!</>
          ) : (
            <>
              <span style={styles.winnerName}>{winner?.name}</span> wins with {winner?.score || 0} points!
            </>
          )}
        </p>

        <Scoreboard
          players={players}
          currentPlayerId={currentPlayerId}
          title="Final Scores"
        />

        <div style={styles.actions}>
          {onPlayAgain && (
            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={onPlayAgain}
            >
              Play Again
            </button>
          )}
          {onBackToLobby && (
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={onBackToLobby}
            >
              Back to Lobby
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
