'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import usePartySocket from 'partysocket/react';
import {
  Loader2, Users, Crown, Eye, CheckCircle, XCircle,
  Send, MessageSquare, LogOut, Wifi, WifiOff
} from 'lucide-react';
import { gameKitResponsiveCSS } from '@/lib/game-kit/responsive-styles';

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
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    display: 'flex',
    flexDirection: 'column' as const,
    color: '#e2e8f0',
  },
  header: {
    padding: '16px 20px',
    background: 'rgba(30, 41, 59, 0.8)',
    borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomCode: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#f97316',
    letterSpacing: '2px',
  },
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
  },
  main: {
    flex: 1,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    maxWidth: '500px',
    margin: '0 auto',
    width: '100%',
  },
  card: {
    background: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(249, 115, 22, 0.2)',
    borderRadius: '16px',
    padding: '20px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fdba74',
    marginBottom: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '2px solid rgba(249, 115, 22, 0.3)',
    borderRadius: '12px',
    color: '#e2e8f0',
    fontSize: '16px',
    outline: 'none',
  },
  button: {
    width: '100%',
    padding: '16px 24px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    color: '#000',
  },
  secondaryButton: {
    background: 'rgba(249, 115, 22, 0.1)',
    color: '#fdba74',
    border: '1px solid rgba(249, 115, 22, 0.3)',
  },
  playerList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  playerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: 'rgba(15, 23, 42, 0.4)',
    borderRadius: '10px',
  },
  playerAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(249, 115, 22, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontWeight: '600',
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  playerStatus: {
    fontSize: '12px',
    color: '#64748b',
  },
  handContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    justifyContent: 'center',
  },
  cardInHand: {
    width: '120px',
    minHeight: '160px',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    fontSize: '14px',
  },
  loader: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '16px',
  },
  error: {
    textAlign: 'center' as const,
    padding: '40px 20px',
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: '12px',
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PlayRoom() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.code as string)?.toUpperCase();

  // State
  const [phase, setPhase] = useState<'loading' | 'join' | 'lobby' | 'playing' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎮');
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [hand, setHand] = useState<any[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';

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

        setPhase('join');
      } catch (err) {
        setError('Failed to connect to server');
        setPhase('error');
      }
    };

    if (roomCode) {
      checkRoom();
    }
  }, [roomCode]);

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

      case 'your_hand':
        setHand(message.hand);
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

  // Join room
  const handleJoin = async () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    // Join via API first
    try {
      const response = await fetch(`/api/game-kit/sessions/${roomCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          avatarEmoji: selectedEmoji,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      setMyPlayerId(data.player.id);
    } catch (err) {
      setError('Failed to join room');
      return;
    }

    // Then join via WebSocket
    socket.send(JSON.stringify({
      type: 'join',
      nickname: nickname.trim(),
      avatarEmoji: selectedEmoji,
    }));

    setPhase('lobby');
  };

  // Toggle ready
  const toggleReady = () => {
    const currentPlayer = myPlayerId ? roomState?.players[myPlayerId] : null;
    socket.send(JSON.stringify({
      type: 'ready',
      ready: !currentPlayer?.isReady,
    }));
  };

  // Select card
  const toggleCardSelection = (index: number) => {
    setSelectedCards(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Submit selected cards
  const submitCards = () => {
    if (selectedCards.length === 0) return;

    socket.send(JSON.stringify({
      type: 'submit_cards',
      cardIndices: selectedCards,
    }));

    setSelectedCards([]);
  };

  // Leave room
  const leaveRoom = () => {
    socket.send(JSON.stringify({ type: 'leave' }));
    router.push('/game-kit');
  };

  // Emoji picker
  const emojis = ['🎮', '🎲', '🃏', '🎯', '🏆', '⭐', '🔥', '💎', '🎪', '🚀', '🌟', '👾'];

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // Loading state
  if (phase === 'loading') {
    return (
      <div style={{ ...styles.container, ...styles.loader }}>
        <Loader2 size={48} style={{ color: '#f97316', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: '#94a3b8' }}>Finding room...</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error state
  if (phase === 'error') {
    return (
      <div style={{ ...styles.container, justifyContent: 'center', alignItems: 'center' }}>
        <div style={styles.error}>
          <XCircle size={64} style={{ color: '#ef4444', marginBottom: '16px' }} />
          <div style={styles.errorTitle}>Oops!</div>
          <div style={{ color: '#94a3b8', marginBottom: '24px' }}>{error}</div>
          <button
            style={{ ...styles.button, ...styles.primaryButton, width: 'auto', padding: '12px 32px' }}
            onClick={() => router.push('/game-kit')}
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  // Join form
  if (phase === 'join') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.roomCode}>{roomCode}</div>
        </div>

        <div style={styles.main}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Join Game</div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                Your Nickname
              </label>
              <input
                type="text"
                style={styles.input}
                placeholder="Enter your name..."
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                Pick an Avatar
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {emojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      border: selectedEmoji === emoji ? '2px solid #f97316' : '2px solid transparent',
                      background: selectedEmoji === emoji ? 'rgba(249, 115, 22, 0.2)' : 'rgba(15, 23, 42, 0.4)',
                      fontSize: '24px',
                      cursor: 'pointer',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ color: '#ef4444', fontSize: '14px', marginBottom: '12px', textAlign: 'center' }} role="alert">
                {error}
              </div>
            )}

            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={handleJoin}
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lobby
  if (phase === 'lobby' && roomState) {
    const players = Object.values(roomState.players);
    const myPlayer = myPlayerId ? roomState.players[myPlayerId] : null;

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.roomCode}>{roomCode}</div>
          <div style={styles.connectionStatus}>
            {isConnected ? (
              <><Wifi size={14} style={{ color: '#22c55e' }} /> Connected</>
            ) : (
              <><WifiOff size={14} style={{ color: '#ef4444' }} /> Reconnecting...</>
            )}
          </div>
        </div>

        <div style={styles.main}>
          {/* Players */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <Users size={14} style={{ marginRight: '6px' }} />
              Players ({players.length}/{roomState.settings.maxPlayers})
            </div>
            <div style={styles.playerList}>
              {players.map(player => (
                <div key={player.id} style={styles.playerItem}>
                  <div style={styles.playerAvatar}>{player.avatarEmoji}</div>
                  <div style={styles.playerInfo}>
                    <div style={styles.playerName}>
                      {player.nickname}
                      {player.isHost && <Crown size={14} style={{ color: '#f97316' }} />}
                      {player.id === myPlayerId && <span style={{ fontSize: '10px', color: '#64748b' }}>(you)</span>}
                    </div>
                    <div style={styles.playerStatus}>
                      {player.isReady ? (
                        <span style={{ color: '#22c55e' }}>Ready</span>
                      ) : (
                        <span>Waiting...</span>
                      )}
                    </div>
                  </div>
                  {player.isReady && (
                    <CheckCircle size={20} style={{ color: '#22c55e' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <button
            style={{
              ...styles.button,
              ...(myPlayer?.isReady ? styles.secondaryButton : styles.primaryButton),
            }}
            onClick={toggleReady}
          >
            {myPlayer?.isReady ? 'Not Ready' : "I'm Ready!"}
          </button>

          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={leaveRoom}
          >
            <LogOut size={16} />
            Leave Room
          </button>
        </div>
      </div>
    );
  }

  // Playing
  if (phase === 'playing' && roomState) {
    const isMyTurn = roomState.gameState.currentPlayerId === myPlayerId;

    return (
      <div style={styles.container}>
        {/* Responsive Styles */}
        <style jsx global>{gameKitResponsiveCSS}</style>

        <div style={styles.header} className="gk-header">
          <div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Round {roomState.gameState.currentRound}</div>
            <div style={styles.roomCode}>{roomCode}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="gk-header-actions">
            <div style={styles.connectionStatus}>
              {isMyTurn ? (
                <span style={{ color: '#f97316', fontWeight: 'bold' }}>YOUR TURN</span>
              ) : (
                <span style={{ color: '#64748b' }}>Waiting...</span>
              )}
            </div>
            <button
              onClick={leaveRoom}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: '#f87171',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <LogOut size={14} />
              Leave
            </button>
          </div>
        </div>

        <div style={styles.main} className="gk-main">
          {/* Hand */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Your Hand</div>
            <div style={styles.handContainer}>
              {hand.map((card, index) => (
                <div
                  key={index}
                  onClick={() => toggleCardSelection(index)}
                  className="gk-card-in-hand"
                  style={{
                    ...styles.cardInHand,
                    background: card.color || '#ffffff',
                    color: card.textColor || '#1a1a1a',
                    transform: selectedCards.includes(index) ? 'translateY(-10px)' : 'none',
                    boxShadow: selectedCards.includes(index)
                      ? '0 10px 30px rgba(249, 115, 22, 0.5)'
                      : '0 4px 12px rgba(0,0,0,0.3)',
                    border: selectedCards.includes(index)
                      ? '3px solid #f97316'
                      : '3px solid transparent',
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{card.properties?.text || card.name || 'Card'}</div>
                  {card.properties?.value && (
                    <div style={{ fontSize: '24px', textAlign: 'right', fontWeight: 'bold' }}>
                      {card.properties.value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          {selectedCards.length > 0 && (
            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={submitCards}
            >
              <Send size={16} />
              Submit {selectedCards.length} Card{selectedCards.length > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
