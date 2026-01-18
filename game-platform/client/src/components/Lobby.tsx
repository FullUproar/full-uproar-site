'use client';

import React, { useState } from 'react';
import type { Player } from '@full-uproar/game-platform-core';

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
  },
  card: {
    background: 'rgba(30, 41, 59, 0.9)',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '400px',
    width: '100%',
    border: '2px solid rgba(249, 115, 22, 0.3)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold' as const,
    color: '#f97316',
    marginBottom: '8px',
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: '14px',
    color: '#9ca3af',
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  },
  tab: {
    flex: 1,
    padding: '12px',
    background: 'transparent',
    border: '2px solid rgba(249, 115, 22, 0.3)',
    borderRadius: '8px',
    color: '#9ca3af',
    fontSize: '14px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: 'rgba(249, 115, 22, 0.2)',
    borderColor: '#f97316',
    color: '#f97316',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '2px solid rgba(249, 115, 22, 0.2)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    marginBottom: '16px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  inputFocus: {
    borderColor: '#f97316',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600' as const,
    color: '#fdba74',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  button: {
    width: '100%',
    padding: '14px 24px',
    background: '#f97316',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '8px',
  },
  buttonDisabled: {
    background: '#4b5563',
    color: '#9ca3af',
    cursor: 'not-allowed',
  },
  error: {
    color: '#ef4444',
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center' as const,
  },
  // Waiting room styles
  waitingHeader: {
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  gameCode: {
    fontSize: '32px',
    fontWeight: 'bold' as const,
    color: '#f97316',
    letterSpacing: '4px',
    fontFamily: 'monospace',
  },
  gameCodeLabel: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '4px',
  },
  playerList: {
    marginBottom: '24px',
  },
  playerListTitle: {
    fontSize: '14px',
    fontWeight: '600' as const,
    color: '#fdba74',
    marginBottom: '12px',
  },
  player: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: 'rgba(15, 23, 42, 0.5)',
    borderRadius: '8px',
    marginBottom: '8px',
  },
  playerAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#f97316',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    color: '#000',
  },
  playerName: {
    flex: 1,
    fontSize: '16px',
    color: '#fff',
  },
  playerBadge: {
    fontSize: '10px',
    fontWeight: 'bold' as const,
    padding: '4px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase' as const,
  },
  hostBadge: {
    background: 'rgba(249, 115, 22, 0.2)',
    color: '#f97316',
  },
  youBadge: {
    background: 'rgba(139, 92, 246, 0.2)',
    color: '#a78bfa',
  },
  minPlayers: {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center' as const,
    marginBottom: '16px',
  },
};

// =============================================================================
// JOIN FORM COMPONENT
// =============================================================================

interface JoinFormProps {
  onCreateGame: (hostName: string) => void;
  onJoinGame: (gameId: string, playerName: string) => void;
  error?: string | null;
  loading?: boolean;
}

function JoinForm({ onCreateGame, onJoinGame, error, loading }: JoinFormProps) {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [gameCode, setGameCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (mode === 'create') {
      if (name.trim()) {
        onCreateGame(name.trim());
      }
    } else {
      if (name.trim() && gameCode.trim()) {
        onJoinGame(gameCode.trim().toUpperCase(), name.trim());
      }
    }
  };

  const isValid = mode === 'create' ? name.trim().length > 0 : name.trim().length > 0 && gameCode.trim().length > 0;

  return (
    <div style={styles.card}>
      <h1 style={styles.title}>Cards Against Humanity</h1>
      <p style={styles.subtitle}>A party game for horrible people</p>

      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(mode === 'create' ? styles.tabActive : {}) }}
          onClick={() => setMode('create')}
        >
          Create Game
        </button>
        <button
          style={{ ...styles.tab, ...(mode === 'join' ? styles.tabActive : {}) }}
          onClick={() => setMode('join')}
        >
          Join Game
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <p style={styles.error}>{error}</p>}

        <label style={styles.label}>Your Name</label>
        <input
          type="text"
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
        />

        {mode === 'join' && (
          <>
            <label style={styles.label}>Game Code</label>
            <input
              type="text"
              style={{ ...styles.input, textTransform: 'uppercase', letterSpacing: '2px' }}
              placeholder="ABCD"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
          </>
        )}

        <button
          type="submit"
          style={{ ...styles.button, ...(isValid && !loading ? {} : styles.buttonDisabled) }}
          disabled={!isValid || loading}
        >
          {loading ? 'Loading...' : mode === 'create' ? 'Create Game' : 'Join Game'}
        </button>
      </form>
    </div>
  );
}

// =============================================================================
// WAITING ROOM COMPONENT
// =============================================================================

interface WaitingRoomProps {
  gameId: string;
  players: Player[];
  currentPlayerId: string;
  hostId: string;
  minPlayers: number;
  onStartGame: () => void;
  onLeaveGame: () => void;
}

function WaitingRoom({
  gameId,
  players,
  currentPlayerId,
  hostId,
  minPlayers,
  onStartGame,
  onLeaveGame,
}: WaitingRoomProps) {
  const isHost = currentPlayerId === hostId;
  const canStart = players.length >= minPlayers;

  return (
    <div style={styles.card}>
      <div style={styles.waitingHeader}>
        <div style={styles.gameCodeLabel}>GAME CODE</div>
        <div style={styles.gameCode}>{gameId}</div>
        <p style={{ ...styles.subtitle, marginBottom: 0, marginTop: '8px' }}>
          Share this code with friends to join
        </p>
      </div>

      <div style={styles.playerList}>
        <div style={styles.playerListTitle}>Players ({players.length})</div>
        {players.map((player) => (
          <div key={player.id} style={styles.player}>
            <div style={styles.playerAvatar}>{player.name.charAt(0).toUpperCase()}</div>
            <div style={styles.playerName}>{player.name}</div>
            {player.id === hostId && <span style={{ ...styles.playerBadge, ...styles.hostBadge }}>Host</span>}
            {player.id === currentPlayerId && <span style={{ ...styles.playerBadge, ...styles.youBadge }}>You</span>}
          </div>
        ))}
      </div>

      {!canStart && (
        <p style={styles.minPlayers}>Need at least {minPlayers} players to start ({minPlayers - players.length} more)</p>
      )}

      {isHost ? (
        <button
          style={{ ...styles.button, ...(canStart ? {} : styles.buttonDisabled) }}
          onClick={onStartGame}
          disabled={!canStart}
        >
          Start Game
        </button>
      ) : (
        <p style={{ ...styles.minPlayers, marginBottom: 0 }}>Waiting for host to start the game...</p>
      )}

      <button
        style={{
          ...styles.button,
          background: 'transparent',
          border: '2px solid rgba(239, 68, 68, 0.5)',
          color: '#ef4444',
          marginTop: '12px',
        }}
        onClick={onLeaveGame}
      >
        Leave Game
      </button>
    </div>
  );
}

// =============================================================================
// LOBBY COMPONENT
// =============================================================================

interface LobbyProps {
  // Connection state
  gameId?: string | null;
  players?: Player[];
  currentPlayerId?: string | null;
  hostId?: string;
  minPlayers?: number;
  error?: string | null;
  loading?: boolean;

  // Actions
  onCreateGame: (hostName: string) => void;
  onJoinGame: (gameId: string, playerName: string) => void;
  onStartGame: () => void;
  onLeaveGame: () => void;
}

export function Lobby({
  gameId,
  players = [],
  currentPlayerId,
  hostId,
  minPlayers = 3,
  error,
  loading,
  onCreateGame,
  onJoinGame,
  onStartGame,
  onLeaveGame,
}: LobbyProps) {
  const isInGame = gameId && currentPlayerId;

  return (
    <div style={styles.container}>
      {isInGame ? (
        <WaitingRoom
          gameId={gameId}
          players={players}
          currentPlayerId={currentPlayerId}
          hostId={hostId || ''}
          minPlayers={minPlayers}
          onStartGame={onStartGame}
          onLeaveGame={onLeaveGame}
        />
      ) : (
        <JoinForm
          onCreateGame={onCreateGame}
          onJoinGame={onJoinGame}
          error={error}
          loading={loading}
        />
      )}
    </div>
  );
}
