'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import usePartySocket from 'partysocket/react';
import {
  Loader2, Users, Crown, Eye, Play, Settings,
  QrCode, Copy, Check, Wifi, WifiOff, Volume2
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface Player {
  id: string;
  nickname: string;
  avatarEmoji?: string;
  isHost: boolean;
  isSpectator: boolean;
  isReady: boolean;
  isConnected: boolean;
  score: number;
}

interface GameState {
  phase: 'lobby' | 'playing' | 'round_end' | 'game_end';
  currentRound: number;
  currentTurn: number;
  currentPlayerId?: string;
  table?: any[];
  submissions?: any[];
}

interface RoomState {
  roomCode: string;
  players: Record<string, Player>;
  spectators: Record<string, Player>;
  gameState: GameState;
  settings: {
    maxPlayers: number;
    allowSpectators: boolean;
  };
}

// =============================================================================
// STYLES
// =============================================================================

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
    display: 'flex',
    flexDirection: 'column' as const,
    color: '#e2e8f0',
    overflow: 'hidden',
  },
  header: {
    padding: '20px 40px',
    background: 'rgba(30, 41, 59, 0.8)',
    borderBottom: '2px solid rgba(249, 115, 22, 0.3)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#f97316',
  },
  roomCodeDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  roomCodeLabel: {
    fontSize: '14px',
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  roomCode: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#fdba74',
    letterSpacing: '8px',
    textShadow: '0 0 30px rgba(249, 115, 22, 0.5)',
  },
  joinUrl: {
    fontSize: '18px',
    color: '#94a3b8',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '40px',
    gap: '32px',
  },
  lobbyContent: {
    display: 'flex',
    gap: '40px',
    flex: 1,
  },
  playersSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fdba74',
    marginBottom: '20px',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  playersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  playerCard: {
    background: 'rgba(30, 41, 59, 0.6)',
    border: '2px solid rgba(249, 115, 22, 0.2)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.3s',
  },
  playerCardReady: {
    borderColor: '#22c55e',
    background: 'rgba(34, 197, 94, 0.1)',
  },
  playerAvatar: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'rgba(249, 115, 22, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
  },
  playerName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  playerStatus: {
    fontSize: '14px',
    padding: '4px 12px',
    borderRadius: '20px',
    background: 'rgba(100, 116, 139, 0.3)',
    color: '#94a3b8',
  },
  playerStatusReady: {
    background: 'rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
  },
  waitingSlot: {
    background: 'rgba(30, 41, 59, 0.3)',
    border: '2px dashed rgba(249, 115, 22, 0.2)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '140px',
    color: '#64748b',
  },
  sidebar: {
    width: '320px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  qrCard: {
    background: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(249, 115, 22, 0.2)',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center' as const,
  },
  qrPlaceholder: {
    width: '200px',
    height: '200px',
    background: '#ffffff',
    borderRadius: '12px',
    margin: '0 auto 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1a1a1a',
    fontWeight: 'bold',
    fontSize: '48px',
    letterSpacing: '4px',
  },
  copyButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'rgba(249, 115, 22, 0.1)',
    border: '1px solid rgba(249, 115, 22, 0.3)',
    borderRadius: '10px',
    color: '#fdba74',
    fontSize: '14px',
    cursor: 'pointer',
    width: '100%',
    marginTop: '12px',
  },
  startButton: {
    padding: '20px 40px',
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    border: 'none',
    borderRadius: '16px',
    color: '#000',
    fontSize: '20px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    transition: 'all 0.2s',
    boxShadow: '0 10px 40px rgba(249, 115, 22, 0.4)',
  },
  startButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  gameArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
  },
  tableArea: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '16px',
    justifyContent: 'center',
    maxWidth: '800px',
  },
  cardOnTable: {
    width: '160px',
    minHeight: '220px',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
    fontSize: '16px',
  },
  scoreboard: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  scoreItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    background: 'rgba(30, 41, 59, 0.6)',
    borderRadius: '12px',
  },
  loader: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '16px',
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function HostView() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.code as string)?.toUpperCase();

  // State
  const [phase, setPhase] = useState<'loading' | 'lobby' | 'playing' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);

  const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // PartyKit WebSocket connection
  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: roomCode,
    onOpen() {
      setIsConnected(true);
    },
    onClose() {
      setIsConnected(false);
    },
    onMessage(event) {
      const message = JSON.parse(event.data);
      handleServerMessage(message);
    },
  });

  // Handle messages from PartyKit server
  const handleServerMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'room_state':
        setRoomState(message.state);
        if (message.state.gameState.phase === 'lobby') {
          setPhase('lobby');
        } else {
          setPhase('playing');
        }
        break;

      case 'player_joined':
        setRoomState(prev => prev ? {
          ...prev,
          players: { ...prev.players, [message.player.id]: message.player },
        } : null);
        break;

      case 'player_left':
        setRoomState(prev => {
          if (!prev) return null;
          const { [message.playerId]: _, ...players } = prev.players;
          return { ...prev, players };
        });
        break;

      case 'player_ready':
        setRoomState(prev => prev ? {
          ...prev,
          players: {
            ...prev.players,
            [message.playerId]: {
              ...prev.players[message.playerId],
              isReady: message.ready,
            },
          },
        } : null);
        break;

      case 'game_started':
        setRoomState(prev => prev ? {
          ...prev,
          gameState: message.gameState,
        } : null);
        setPhase('playing');
        break;

      case 'game_state_update':
        setRoomState(prev => prev ? {
          ...prev,
          gameState: { ...prev.gameState, ...message.gameState },
        } : null);
        break;

      case 'error':
        setError(message.message);
        break;
    }
  }, []);

  // Check if room exists on mount
  useEffect(() => {
    const checkRoom = async () => {
      try {
        const response = await fetch(`/api/game-kit/sessions/${roomCode}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Room not found');
          setPhase('error');
          return;
        }

        setPhase('lobby');
      } catch (err) {
        setError('Failed to connect to server');
        setPhase('error');
      }
    };

    if (roomCode) {
      checkRoom();
    }
  }, [roomCode]);

  // Start game
  const startGame = () => {
    socket.send(JSON.stringify({ type: 'start_game' }));
  };

  // Copy join URL
  const copyJoinUrl = () => {
    const url = `${baseUrl}/join/${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // Loading
  if (phase === 'loading') {
    return (
      <div style={{ ...styles.container, ...styles.loader }}>
        <Loader2 size={64} style={{ color: '#f97316', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: '#94a3b8', fontSize: '18px' }}>Loading game...</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error
  if (phase === 'error') {
    return (
      <div style={{ ...styles.container, ...styles.loader }}>
        <div style={{ fontSize: '64px' }}>😕</div>
        <div style={{ fontSize: '24px', color: '#ef4444' }}>{error}</div>
        <button
          onClick={() => router.push('/game-kit')}
          style={{
            padding: '12px 32px',
            background: 'rgba(249, 115, 22, 0.2)',
            border: '1px solid #f97316',
            borderRadius: '10px',
            color: '#fdba74',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '20px',
          }}
        >
          Back to Games
        </button>
      </div>
    );
  }

  // Lobby
  if (phase === 'lobby' && roomState) {
    const players = Object.values(roomState.players);
    const allReady = players.length >= 2 && players.every(p => p.isReady);
    const waitingSlots = Math.max(0, 4 - players.length);

    return (
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>Full Uproar</div>
          <div style={styles.roomCodeDisplay}>
            <div>
              <div style={styles.roomCodeLabel}>Join at</div>
              <div style={styles.joinUrl}>{baseUrl}/join</div>
            </div>
            <div style={styles.roomCode}>{roomCode}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isConnected ? (
              <><Wifi size={20} style={{ color: '#22c55e' }} /> Live</>
            ) : (
              <><WifiOff size={20} style={{ color: '#ef4444' }} /> Reconnecting...</>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.main}>
          <div style={styles.lobbyContent}>
            {/* Players */}
            <div style={styles.playersSection}>
              <div style={styles.sectionTitle}>
                <Users size={18} />
                Players ({players.length}/{roomState.settings.maxPlayers})
              </div>
              <div style={styles.playersGrid}>
                {players.map(player => (
                  <div
                    key={player.id}
                    style={{
                      ...styles.playerCard,
                      ...(player.isReady ? styles.playerCardReady : {}),
                    }}
                  >
                    <div style={styles.playerAvatar}>{player.avatarEmoji}</div>
                    <div style={styles.playerName}>
                      {player.nickname}
                      {player.isHost && <Crown size={16} style={{ color: '#f97316' }} />}
                    </div>
                    <div style={{
                      ...styles.playerStatus,
                      ...(player.isReady ? styles.playerStatusReady : {}),
                    }}>
                      {player.isReady ? '✓ Ready' : 'Waiting...'}
                    </div>
                  </div>
                ))}
                {[...Array(waitingSlots)].map((_, i) => (
                  <div key={`waiting-${i}`} style={styles.waitingSlot}>
                    Waiting for player...
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div style={styles.sidebar}>
              <div style={styles.qrCard}>
                <div style={styles.qrPlaceholder}>
                  {roomCode}
                </div>
                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                  Go to <strong style={{ color: '#fdba74' }}>{baseUrl}/join</strong>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e2e8f0' }}>
                  Enter code: <span style={{ color: '#f97316' }}>{roomCode}</span>
                </div>
                <button style={styles.copyButton} onClick={copyJoinUrl}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy Join Link'}
                </button>
              </div>

              <button
                style={{
                  ...styles.startButton,
                  ...(allReady ? {} : styles.startButtonDisabled),
                }}
                onClick={startGame}
                disabled={!allReady}
              >
                <Play size={24} />
                {allReady ? 'Start Game!' : `Waiting for players (${players.filter(p => p.isReady).length}/${players.length} ready)`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Playing
  if (phase === 'playing' && roomState) {
    const players = Object.values(roomState.players);
    const currentPlayer = roomState.gameState.currentPlayerId
      ? roomState.players[roomState.gameState.currentPlayerId]
      : null;

    return (
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>
              Round {roomState.gameState.currentRound}
            </div>
            <div style={styles.logo}>{roomCode}</div>
          </div>
          <div style={styles.scoreboard}>
            {players.map(player => (
              <div
                key={player.id}
                style={{
                  ...styles.scoreItem,
                  border: player.id === roomState.gameState.currentPlayerId
                    ? '2px solid #f97316'
                    : '2px solid transparent',
                }}
              >
                <span style={{ fontSize: '20px' }}>{player.avatarEmoji}</span>
                <span style={{ fontWeight: 'bold' }}>{player.nickname}</span>
                <span style={{ color: '#f97316', fontWeight: 'bold' }}>{player.score}</span>
              </div>
            ))}
          </div>
          <div>
            {isConnected ? (
              <Wifi size={20} style={{ color: '#22c55e' }} />
            ) : (
              <WifiOff size={20} style={{ color: '#ef4444' }} />
            )}
          </div>
        </div>

        {/* Game Area */}
        <div style={styles.main}>
          <div style={styles.gameArea}>
            {currentPlayer && (
              <div style={{ fontSize: '24px', color: '#fdba74', marginBottom: '20px' }}>
                {currentPlayer.avatarEmoji} {currentPlayer.nickname}'s turn
              </div>
            )}

            {/* Table - Cards played */}
            <div style={styles.tableArea}>
              {roomState.gameState.table?.map((card, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.cardOnTable,
                    background: card.color || '#ffffff',
                    color: card.textColor || '#1a1a1a',
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>
                    {card.properties?.text || card.name || 'Card'}
                  </div>
                  {card.playedBy && (
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>
                      Played by {roomState.players[card.playedBy]?.nickname || 'Unknown'}
                    </div>
                  )}
                </div>
              ))}

              {(!roomState.gameState.table || roomState.gameState.table.length === 0) && (
                <div style={{
                  padding: '60px',
                  color: '#64748b',
                  fontSize: '20px',
                  textAlign: 'center',
                }}>
                  Waiting for cards to be played...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
