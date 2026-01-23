'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import usePartySocket from 'partysocket/react';
import {
  Loader2, Users, Crown, Eye, Play, Settings,
  QrCode, Copy, Check, Wifi, WifiOff, Volume2,
  UserPlus, Trash2, Trophy, CheckCircle
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
  isProxy?: boolean;
  proxyManagedBy?: string;
}

interface GameState {
  phase: 'lobby' | 'playing' | 'round_end' | 'game_end';
  currentRound: number;
  currentTurn: number;
  currentPlayerId?: string;
  judgeId?: string;
  table?: any[];
  submissions?: any[];
  proxySubmissions?: string[];
  roundWinner?: string;
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
  // IRL Player Management
  irlSection: {
    marginTop: '32px',
    padding: '24px',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '2px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '16px',
  },
  irlTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#c4b5fd',
    marginBottom: '16px',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  irlInputRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  irlInput: {
    flex: 1,
    padding: '12px 16px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '2px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '16px',
    outline: 'none',
  },
  irlAddButton: {
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  irlPlayerChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(139, 92, 246, 0.2)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '20px',
    marginRight: '8px',
    marginBottom: '8px',
  },
  irlRemoveButton: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  proxyBadge: {
    fontSize: '10px',
    padding: '2px 6px',
    background: 'rgba(139, 92, 246, 0.3)',
    color: '#c4b5fd',
    borderRadius: '4px',
    textTransform: 'uppercase' as const,
  },
  // Host Controls
  hostControls: {
    padding: '24px',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '2px solid rgba(249, 115, 22, 0.3)',
    borderRadius: '16px',
  },
  hostButton: {
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#000',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    marginBottom: '12px',
  },
  hostButtonSecondary: {
    background: 'rgba(249, 115, 22, 0.2)',
    color: '#fdba74',
    border: '2px solid rgba(249, 115, 22, 0.3)',
  },
  winnerSelectCard: {
    padding: '16px',
    background: 'rgba(30, 41, 59, 0.6)',
    border: '2px solid rgba(249, 115, 22, 0.2)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
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

  // IRL Player Management State
  const [irlPlayerName, setIrlPlayerName] = useState('');
  const [addingIrl, setAddingIrl] = useState(false);
  const [showWinnerSelect, setShowWinnerSelect] = useState(false);

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

  // Add IRL player (proxy)
  const addIrlPlayer = async () => {
    if (!irlPlayerName.trim() || addingIrl) return;

    setAddingIrl(true);
    try {
      // Send to PartyKit
      socket.send(JSON.stringify({
        type: 'add_proxy',
        nickname: irlPlayerName.trim(),
        avatarEmoji: '🎴',
      }));
      setIrlPlayerName('');
    } finally {
      setAddingIrl(false);
    }
  };

  // Remove IRL player (proxy)
  const removeIrlPlayer = (playerId: string) => {
    socket.send(JSON.stringify({
      type: 'remove_proxy',
      playerId,
    }));
  };

  // Mark all IRL players as submitted
  const markIrlSubmitted = () => {
    if (!roomState) return;

    const proxyPlayerIds = Object.values(roomState.players)
      .filter(p => p.isProxy)
      .map(p => p.id);

    if (proxyPlayerIds.length > 0) {
      socket.send(JSON.stringify({
        type: 'proxy_submit',
        playerIds: proxyPlayerIds,
      }));
    }
  };

  // Mark a player as the round winner
  const markWinner = (playerId: string) => {
    socket.send(JSON.stringify({
      type: 'mark_winner',
      playerId,
    }));
    setShowWinnerSelect(false);
  };

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

      case 'proxy_added':
        setRoomState(prev => prev ? {
          ...prev,
          players: { ...prev.players, [message.player.id]: message.player },
        } : null);
        break;

      case 'proxy_removed':
        setRoomState(prev => {
          if (!prev) return null;
          const { [message.playerId]: _, ...players } = prev.players;
          return { ...prev, players };
        });
        break;

      case 'proxy_submitted':
        setRoomState(prev => prev ? {
          ...prev,
          gameState: {
            ...prev.gameState,
            proxySubmissions: [
              ...(prev.gameState.proxySubmissions || []),
              ...message.playerIds,
            ],
          },
        } : null);
        break;

      case 'round_end':
        setRoomState(prev => prev ? {
          ...prev,
          gameState: {
            ...prev.gameState,
            roundWinner: message.winner,
          },
          players: Object.fromEntries(
            Object.entries(prev.players).map(([id, player]) => [
              id,
              { ...player, score: message.scores[id] || player.score },
            ])
          ),
        } : null);
        setShowWinnerSelect(false);
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
    const virtualPlayers = players.filter(p => !p.isProxy);
    const proxyPlayers = players.filter(p => p.isProxy);
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
                      ...(player.isProxy ? { borderColor: 'rgba(139, 92, 246, 0.4)' } : {}),
                    }}
                  >
                    <div style={styles.playerAvatar}>{player.avatarEmoji}</div>
                    <div style={styles.playerName}>
                      {player.nickname}
                      {player.isHost && <Crown size={16} style={{ color: '#f97316' }} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {player.isProxy && (
                        <span style={styles.proxyBadge}>IRL</span>
                      )}
                      <div style={{
                        ...styles.playerStatus,
                        ...(player.isReady ? styles.playerStatusReady : {}),
                      }}>
                        {player.isReady ? '✓ Ready' : 'Waiting...'}
                      </div>
                    </div>
                    {player.isProxy && (
                      <button
                        onClick={() => removeIrlPlayer(player.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px',
                          marginTop: '8px',
                          fontSize: '12px',
                        }}
                      >
                        <Trash2 size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {[...Array(waitingSlots)].map((_, i) => (
                  <div key={`waiting-${i}`} style={styles.waitingSlot}>
                    Waiting for player...
                  </div>
                ))}
              </div>

              {/* IRL Player Management */}
              <div style={styles.irlSection}>
                <div style={styles.irlTitle}>
                  <UserPlus size={18} />
                  Add IRL Players (Physical Cards)
                </div>
                <div style={styles.irlInputRow}>
                  <input
                    type="text"
                    placeholder="Player name..."
                    value={irlPlayerName}
                    onChange={(e) => setIrlPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addIrlPlayer()}
                    style={styles.irlInput}
                  />
                  <button
                    onClick={addIrlPlayer}
                    disabled={!irlPlayerName.trim() || addingIrl}
                    style={{
                      ...styles.irlAddButton,
                      opacity: !irlPlayerName.trim() || addingIrl ? 0.5 : 1,
                    }}
                  >
                    <UserPlus size={16} />
                    Add
                  </button>
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  IRL players use physical cards. You'll manage their submissions and votes.
                </div>
                {proxyPlayers.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <strong style={{ color: '#c4b5fd' }}>IRL Players: </strong>
                    {proxyPlayers.map(p => (
                      <span key={p.id} style={styles.irlPlayerChip}>
                        {p.avatarEmoji} {p.nickname}
                        <button
                          onClick={() => removeIrlPlayer(p.id)}
                          style={styles.irlRemoveButton}
                        >
                          <Trash2 size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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
    const proxyPlayers = players.filter(p => p.isProxy);
    const hasProxyPlayers = proxyPlayers.length > 0;
    const allProxiesSubmitted = proxyPlayers.every(p =>
      roomState.gameState.proxySubmissions?.includes(p.id)
    );
    const currentPlayer = roomState.gameState.currentPlayerId
      ? roomState.players[roomState.gameState.currentPlayerId]
      : null;
    const judge = roomState.gameState.judgeId
      ? roomState.players[roomState.gameState.judgeId]
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
          <div style={{ display: 'flex', gap: '40px' }}>
            {/* Main Game Area */}
            <div style={{ ...styles.gameArea, flex: 1 }}>
              {judge && (
                <div style={{ fontSize: '24px', color: '#fdba74', marginBottom: '20px' }}>
                  <Crown size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  {judge.avatarEmoji} {judge.nickname} is judging
                  {judge.isProxy && <span style={{ ...styles.proxyBadge, marginLeft: '8px' }}>IRL</span>}
                </div>
              )}

              {/* Submissions Display */}
              <div style={styles.tableArea}>
                {/* Virtual player submissions */}
                {roomState.gameState.submissions?.map((submission, index) => {
                  const submitter = roomState.players[submission.playerId];
                  return (
                    <div
                      key={index}
                      style={{
                        ...styles.cardOnTable,
                        background: '#ffffff',
                        color: '#1a1a1a',
                        cursor: showWinnerSelect ? 'pointer' : 'default',
                        border: showWinnerSelect ? '3px solid transparent' : 'none',
                      }}
                      onClick={() => showWinnerSelect && markWinner(submission.playerId)}
                      onMouseEnter={(e) => showWinnerSelect && (e.currentTarget.style.borderColor = '#f97316')}
                      onMouseLeave={(e) => showWinnerSelect && (e.currentTarget.style.borderColor = 'transparent')}
                    >
                      <div style={{ fontWeight: 'bold' }}>
                        {submission.cards?.[0]?.properties?.text || 'Submitted'}
                      </div>
                      {showWinnerSelect && (
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                          Click to pick winner
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Proxy player submissions (shown as placeholder cards) */}
                {roomState.gameState.proxySubmissions?.map((playerId, index) => {
                  const player = roomState.players[playerId];
                  return (
                    <div
                      key={`proxy-${playerId}`}
                      style={{
                        ...styles.cardOnTable,
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        color: '#ffffff',
                        cursor: showWinnerSelect ? 'pointer' : 'default',
                        border: showWinnerSelect ? '3px solid transparent' : 'none',
                      }}
                      onClick={() => showWinnerSelect && markWinner(playerId)}
                      onMouseEnter={(e) => showWinnerSelect && (e.currentTarget.style.borderColor = '#f97316')}
                      onMouseLeave={(e) => showWinnerSelect && (e.currentTarget.style.borderColor = 'transparent')}
                    >
                      <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '8px' }}>🎴</div>
                      <div style={{ fontWeight: 'bold', textAlign: 'center' }}>
                        Physical Card
                      </div>
                      <div style={{ fontSize: '12px', textAlign: 'center', opacity: 0.8 }}>
                        {player?.nickname || 'IRL Player'}
                      </div>
                      {showWinnerSelect && (
                        <div style={{ marginTop: '8px', fontSize: '12px', textAlign: 'center' }}>
                          Click to pick winner
                        </div>
                      )}
                    </div>
                  );
                })}

                {(!roomState.gameState.submissions?.length && !roomState.gameState.proxySubmissions?.length) && (
                  <div style={{
                    padding: '60px',
                    color: '#64748b',
                    fontSize: '20px',
                    textAlign: 'center',
                  }}>
                    Waiting for submissions...
                  </div>
                )}
              </div>
            </div>

            {/* Host Controls Sidebar */}
            <div style={{ width: '300px' }}>
              <div style={styles.hostControls}>
                <div style={styles.sectionTitle}>
                  <Settings size={18} />
                  Host Controls
                </div>

                {/* IRL Submission Control */}
                {hasProxyPlayers && !allProxiesSubmitted && (
                  <button
                    onClick={markIrlSubmitted}
                    style={styles.hostButton}
                  >
                    <CheckCircle size={20} />
                    Mark IRL Submitted
                  </button>
                )}

                {/* Winner Selection */}
                {!showWinnerSelect ? (
                  <button
                    onClick={() => setShowWinnerSelect(true)}
                    style={{
                      ...styles.hostButton,
                      ...styles.hostButtonSecondary,
                    }}
                  >
                    <Trophy size={20} />
                    Pick Winner
                  </button>
                ) : (
                  <button
                    onClick={() => setShowWinnerSelect(false)}
                    style={{
                      ...styles.hostButton,
                      ...styles.hostButtonSecondary,
                    }}
                  >
                    Cancel
                  </button>
                )}

                {showWinnerSelect && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>
                      Click a card above or select a player below:
                    </div>
                    {players.filter(p => !p.isSpectator && p.id !== roomState.gameState.judgeId).map(player => (
                      <div
                        key={player.id}
                        onClick={() => markWinner(player.id)}
                        style={{
                          ...styles.winnerSelectCard,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#f97316';
                          e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)';
                          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
                        }}
                      >
                        <span style={{ fontSize: '24px' }}>{player.avatarEmoji}</span>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{player.nickname}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Score: {player.score}
                            {player.isProxy && <span style={{ ...styles.proxyBadge, marginLeft: '8px' }}>IRL</span>}
                          </div>
                        </div>
                        <Trophy size={18} style={{ marginLeft: 'auto', color: '#f97316' }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* IRL Player List */}
                {hasProxyPlayers && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(249, 115, 22, 0.2)' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                      IRL Players:
                    </div>
                    {proxyPlayers.map(p => (
                      <div key={p.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                        fontSize: '14px',
                      }}>
                        <span>{p.avatarEmoji}</span>
                        <span>{p.nickname}</span>
                        {roomState.gameState.proxySubmissions?.includes(p.id) && (
                          <Check size={14} style={{ color: '#22c55e', marginLeft: 'auto' }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
