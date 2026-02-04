'use client';

import React from 'react';
import { useGame } from '../context/GameContext';
import { Lobby } from './Lobby';
import { GameBoard } from './GameBoard';
import { GameOver } from './GameOver';

// =============================================================================
// LOADING COMPONENT
// =============================================================================

const styles = {
  loading: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(255, 130, 0, 0.2)',
    borderTopColor: '#FF8200',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  error: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '24px',
  },
  errorText: {
    color: '#ef4444',
    fontSize: '18px',
    textAlign: 'center' as const,
  },
  retryButton: {
    padding: '12px 24px',
    background: '#FF8200',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
  },
};

// Add keyframes for spinner animation via style tag
const spinnerStyle = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// =============================================================================
// GAME COMPONENT
// =============================================================================

export function Game() {
  const {
    gameState,
    playerId,
    error,
    isConnecting,
    createGame,
    joinGame,
    startGame,
    leaveGame,
    submitCards,
    selectWinner,
  } = useGame();

  // Show loading state
  if (isConnecting) {
    return (
      <div style={styles.loading}>
        <style>{spinnerStyle}</style>
        <div style={styles.spinner} />
      </div>
    );
  }

  // Not in a game - show lobby
  if (!gameState || !playerId) {
    return (
      <Lobby
        error={error}
        onCreateGame={createGame}
        onJoinGame={joinGame}
        onStartGame={startGame}
        onLeaveGame={leaveGame}
      />
    );
  }

  // In lobby phase - show waiting room
  if (gameState.status === 'lobby' || gameState.currentPhase === 'LOBBY') {
    // Lead/host is stored in gameState.roles.lead
    const hostId = gameState.roles.lead || gameState.players[0]?.id;

    return (
      <Lobby
        gameId={gameState.gameId}
        players={gameState.players}
        currentPlayerId={playerId}
        hostId={hostId}
        minPlayers={3} // Default CAH min players
        error={error}
        onCreateGame={createGame}
        onJoinGame={joinGame}
        onStartGame={startGame}
        onLeaveGame={leaveGame}
      />
    );
  }

  // Game over
  if (gameState.status === 'ended' || gameState.currentPhase === 'END') {
    return (
      <GameOver
        players={gameState.players}
        currentPlayerId={playerId}
        onPlayAgain={() => {
          // Could restart game here
        }}
        onBackToLobby={leaveGame}
      />
    );
  }

  // Active game - show game board
  return (
    <GameBoard
      gameState={gameState}
      currentPlayerId={playerId}
      onSubmitCards={submitCards}
      onSelectWinner={selectWinner}
      onLeaveGame={leaveGame}
    />
  );
}
