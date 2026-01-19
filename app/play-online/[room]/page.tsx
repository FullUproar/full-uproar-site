'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type {
  ClientGameState,
  GameEvent,
  Player,
  Card,
  Action,
  ClientMessage,
  ServerMessage,
  Submission,
} from '../../../game-platform/core/src/types';

// =============================================================================
// PARTYKIT CONFIG
// =============================================================================

// Change this to your deployed PartyKit host
const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';

// =============================================================================
// CSS ANIMATIONS
// =============================================================================

const animationStyles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
@keyframes cardDeal {
  from { opacity: 0; transform: translateY(-30px) rotateX(20deg); }
  to { opacity: 1; transform: translateY(0) rotateX(0); }
}
@keyframes winnerGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(249, 115, 22, 0.5); }
  50% { box-shadow: 0 0 40px rgba(249, 115, 22, 0.8); }
}
@keyframes confetti {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(-100px) rotate(720deg); opacity: 0; }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.card-hover:hover {
  transform: translateY(-8px) scale(1.03) !important;
}
.card-enter {
  animation: cardDeal 0.4s ease-out forwards;
}
.submission-hover:hover {
  background: rgba(249, 115, 22, 0.15) !important;
  border: 1px solid rgba(249, 115, 22, 0.4) !important;
}
`;

// =============================================================================
// STYLES
// =============================================================================

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%)',
    color: '#fff',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    background: 'rgba(30, 41, 59, 0.95)',
    borderBottom: '2px solid rgba(249, 115, 22, 0.3)',
    backdropFilter: 'blur(10px)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 50,
  },
  logo: {
    fontSize: '20px',
    fontWeight: 'bold' as const,
    color: '#f97316',
    cursor: 'pointer',
  },
  roomCode: {
    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
    color: '#fdba74',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'monospace',
    letterSpacing: '2px',
    border: '1px solid rgba(249, 115, 22, 0.3)',
  },
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  main: {
    display: 'flex',
    minHeight: 'calc(100vh - 60px)',
  },
  gameArea: {
    flex: 1,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '24px',
    paddingTop: '40px',
    animation: 'fadeIn 0.5s ease-out',
  },
  sidebar: {
    width: '280px',
    background: 'rgba(30, 41, 59, 0.6)',
    padding: '20px',
    borderLeft: '1px solid rgba(249, 115, 22, 0.2)',
    backdropFilter: 'blur(5px)',
    animation: 'fadeIn 0.5s ease-out 0.2s both',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600' as const,
    color: '#fdba74',
    marginBottom: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  // Card styles
  card: {
    position: 'relative' as const,
    width: '150px',
    minHeight: '200px',
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-start',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    perspective: '1000px',
  },
  whiteCard: {
    background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)',
    color: '#000000',
    border: '2px solid #e5e5e5',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  blackCard: {
    background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
    color: '#ffffff',
    border: '2px solid #333333',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  },
  cardText: {
    fontSize: '13px',
    fontWeight: '600' as const,
    lineHeight: 1.5,
    flex: 1,
    letterSpacing: '-0.01em',
  },
  cardFooter: {
    marginTop: '12px',
    fontSize: '9px',
    opacity: 0.5,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    fontWeight: '700' as const,
  },
  cardSelected: {
    transform: 'translateY(-10px) scale(1.04)',
    boxShadow: '0 12px 32px rgba(249, 115, 22, 0.5), 0 0 0 3px #f97316',
    border: '2px solid #f97316',
  },
  cardGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '12px',
    justifyContent: 'center',
  },
  // Player styles
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    background: 'rgba(15, 23, 42, 0.5)',
    borderRadius: '8px',
    marginBottom: '6px',
  },
  playerRowYou: {
    background: 'rgba(249, 115, 22, 0.1)',
    border: '1px solid rgba(249, 115, 22, 0.3)',
  },
  playerAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#4b5563',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  playerAvatarJudge: {
    background: '#f97316',
    color: '#000',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: '14px',
    color: '#fff',
    fontWeight: '500' as const,
  },
  playerScore: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  badge: {
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
  },
  // Buttons
  button: {
    padding: '12px 28px',
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  buttonDisabled: {
    background: 'linear-gradient(135deg, #4b5563 0%, #374151 100%)',
    color: '#9ca3af',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  buttonSecondary: {
    background: 'transparent',
    border: '2px solid rgba(249, 115, 22, 0.5)',
    color: '#f97316',
    boxShadow: 'none',
  },
  // Join form
  joinForm: {
    background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(20, 30, 48, 0.95) 100%)',
    borderRadius: '20px',
    padding: '36px',
    maxWidth: '380px',
    width: '100%',
    border: '1px solid rgba(249, 115, 22, 0.2)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
    animation: 'slideUp 0.5s ease-out',
  },
  input: {
    width: '100%',
    padding: '16px 18px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '2px solid rgba(249, 115, 22, 0.15)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '16px',
    marginBottom: '20px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s, box-shadow 0.2s',
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
  message: {
    textAlign: 'center' as const,
    fontSize: '18px',
    color: '#fdba74',
    padding: '24px',
  },
  submissionGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    alignItems: 'center',
    padding: '16px',
    background: 'rgba(15, 23, 42, 0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  submissionGroupHover: {
    background: 'rgba(249, 115, 22, 0.1)',
    border: '1px solid rgba(249, 115, 22, 0.3)',
  },
  winnerBadge: {
    background: '#f97316',
    color: '#000',
    padding: '6px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    marginTop: '8px',
  },
  orderBadge: {
    position: 'absolute' as const,
    top: '-8px',
    left: '-8px',
    background: '#8b5cf6',
    color: '#fff',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold' as const,
  },
  hand: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(20, 30, 48, 0.98) 100%)',
    borderTop: '2px solid rgba(249, 115, 22, 0.3)',
    padding: '16px 24px',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
    animation: 'slideUp 0.4s ease-out',
  },
  handHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  handTitle: {
    fontSize: '13px',
    fontWeight: '600' as const,
    color: '#fdba74',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  handCards: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto' as const,
    padding: '8px 0',
    scrollSnapType: 'x mandatory' as const,
  },
  // Loading spinner
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(249, 115, 22, 0.2)',
    borderTop: '3px solid #f97316',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  // Winner animation
  winnerCard: {
    animation: 'winnerGlow 1.5s ease-in-out infinite',
  },
};

// =============================================================================
// CARD COMPONENT
// =============================================================================

function CardComponent({
  card,
  selected = false,
  onClick,
  order,
  small = false,
  isWinner = false,
  animationDelay = 0,
}: {
  card: Card;
  selected?: boolean;
  onClick?: () => void;
  order?: number;
  small?: boolean;
  isWinner?: boolean;
  animationDelay?: number;
}) {
  const isBlack = card.type === 'black';

  const cardStyle = {
    ...styles.card,
    ...(isBlack ? styles.blackCard : styles.whiteCard),
    ...(selected ? styles.cardSelected : {}),
    ...(isWinner ? styles.winnerCard : {}),
    ...(small ? { width: '130px', minHeight: '170px' } : {}),
    animationDelay: `${animationDelay * 0.1}s`,
  };

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      className={onClick ? 'card-hover card-enter' : 'card-enter'}
    >
      {order !== undefined && <div style={styles.orderBadge}>{order}</div>}
      <div style={{ ...styles.cardText, fontSize: small ? '11px' : '13px' }}>
        {card.properties?.text ?? ''}
      </div>
      <div style={styles.cardFooter}>Full Uproar</div>
    </div>
  );
}

// =============================================================================
// MULTIPLAYER PAGE
// =============================================================================

export default function MultiplayerRoom() {
  const params = useParams();
  const router = useRouter();
  const room = params.room as string;

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Game state
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);

  // UI state
  const [playerName, setPlayerName] = useState('');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [hoveredSubmission, setHoveredSubmission] = useState<string | null>(null);
  const [showCopied, setShowCopied] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [showReconnectPrompt, setShowReconnectPrompt] = useState(false);
  const [storedPlayerName, setStoredPlayerName] = useState<string | null>(null);

  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get storage key for this room
  const storageKey = `fu-game-room-${room.toUpperCase()}`;

  // Load stored player info on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const { playerId: storedId, playerName: storedName } = JSON.parse(stored);
        setStoredPlayerName(storedName);
        // We'll check if we can reconnect after we receive game state
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey]);

  // Save player info to localStorage when joining
  useEffect(() => {
    if (playerId && playerName) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ playerId, playerName }));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [playerId, playerName, storageKey]);

  // Copy room code to clipboard
  const copyRoomCode = useCallback(() => {
    navigator.clipboard.writeText(room.toUpperCase());
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, [room]);

  // Connect to PartyKit
  useEffect(() => {
    let cancelled = false;
    const protocol = PARTYKIT_HOST.startsWith('localhost') ? 'ws' : 'wss';
    const url = `${protocol}://${PARTYKIT_HOST}/party/${room}`;

    console.log('[PartyKit] Connecting to', url);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (cancelled) {
        ws.close();
        return;
      }
      setIsConnected(true);
      setIsConnecting(false);
      setError(null); // Clear any previous errors
      console.log('[PartyKit] Connected');
    };

    ws.onclose = () => {
      if (cancelled) return;
      setIsConnected(false);
      setIsConnecting(false);
      console.log('[PartyKit] Disconnected');

      // Auto-reconnect if we were in a game
      if (playerId && reconnectAttempts < 5) {
        console.log(`[PartyKit] Attempting reconnect (${reconnectAttempts + 1}/5)...`);
        setReconnectAttempts(prev => prev + 1);
        reconnectTimeoutRef.current = setTimeout(() => {
          // Force re-render to trigger new connection
          window.location.reload();
        }, 2000 + reconnectAttempts * 1000);
      }
    };

    ws.onerror = () => {
      if (cancelled) return;
      setError('Failed to connect to game server');
      setIsConnecting(false);
    };

    ws.onmessage = (event) => {
      if (cancelled) return;
      try {
        const message: ServerMessage = JSON.parse(event.data);
        handleServerMessage(message);
      } catch (err) {
        console.error('[PartyKit] Parse error:', err);
      }
    };

    return () => {
      cancelled = true;
      // Only close if already connected - the onopen handler will close if cancelled
      // This prevents "WebSocket is closed before the connection is established" error
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      // Clean up any pending reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [room, playerId, reconnectAttempts]);

  // Handle server messages
  const handleServerMessage = (message: ServerMessage) => {
    switch (message.type) {
      case 'gameState':
        setGameState(message.state);
        // Check if we can reconnect to an existing session
        if (message.state && !playerId) {
          try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              const { playerId: storedId, playerName: name } = JSON.parse(stored);
              // Check if this player exists in the game and is disconnected
              const existingPlayer = message.state.players.find(
                (p: Player) => p.id === storedId && (p.presence === 'disconnected' || p.presence === 'active')
              );
              if (existingPlayer) {
                setShowReconnectPrompt(true);
                setStoredPlayerName(name);
              }
            }
          } catch {
            // Ignore errors
          }
        }
        break;
      case 'joined':
        setPlayerId(message.playerId);
        setGameState(message.gameState);
        setShowReconnectPrompt(false);
        setReconnectAttempts(0);
        break;
      case 'left':
        setPlayerId(null);
        setGameState(null);
        // Clear stored session on explicit leave
        try {
          localStorage.removeItem(storageKey);
        } catch {
          // Ignore
        }
        break;
      case 'event':
        setEvents((prev) => [...prev.slice(-50), message.event]);
        break;
      case 'error':
        setError(message.message);
        setTimeout(() => setError(null), 3000);
        break;
    }
  };

  // Send message to server
  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Create game
  const handleCreateGame = () => {
    if (!playerName.trim()) return;
    send({ type: 'createGame', playerName: playerName.trim() });
  };

  // Join game
  const handleJoinGame = () => {
    if (!playerName.trim()) return;
    send({ type: 'joinGame', playerName: playerName.trim() });
  };

  // Reconnect to previous session
  const handleReconnect = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const { playerId: storedId, playerName: name } = JSON.parse(stored);
        // Try to rejoin with the same player ID
        send({ type: 'rejoinGame', playerId: storedId, playerName: name });
      }
    } catch {
      // Fall back to regular join
      if (storedPlayerName) {
        setPlayerName(storedPlayerName);
      }
      setShowReconnectPrompt(false);
    }
  };

  // Cancel reconnection prompt and join as new player
  const handleSkipReconnect = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
    setShowReconnectPrompt(false);
    setStoredPlayerName(null);
  };

  // Start game
  const handleStartGame = () => {
    send({ type: 'action', action: { type: 'startGame' } });
  };

  // Select card
  const handleCardSelect = (cardId: string) => {
    const promptCard = gameState?.globalSlots?.['table']?.[0];
    const pickCount = promptCard?.properties?.pick ?? 1;

    setSelectedCards((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId);
      }
      if (prev.length < pickCount) {
        return [...prev, cardId];
      }
      if (pickCount === 1) {
        return [cardId];
      }
      return prev;
    });
  };

  // Submit cards
  const handleSubmit = () => {
    if (selectedCards.length === 0) return;
    send({ type: 'action', action: { type: 'submitCards', cardIds: selectedCards } });
    setSelectedCards([]);
  };

  // Select winner
  const handleSelectWinner = (winnerId: string) => {
    send({ type: 'action', action: { type: 'selectWinner', playerId: winnerId } });
  };

  // Derived state
  const currentPlayer = gameState?.players.find((p) => p.id === playerId);
  const judgeId = gameState?.roles?.judge;
  const isJudge = playerId === judgeId;
  const judge = gameState?.players.find((p) => p.id === judgeId);
  const promptCard = gameState?.globalSlots?.['table']?.[0];
  const pickCount = promptCard?.properties?.pick ?? 1;
  const hasSubmitted = playerId ? gameState?.roundState?.submissions?.[playerId] !== undefined : false;
  const submissions = gameState?.roundState?.submissions ?? {};

  // Connection status color
  const statusColor = isConnecting ? '#eab308' : isConnected ? '#22c55e' : '#ef4444';

  return (
    <div style={styles.container}>
      {/* Inject CSS animations */}
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

      {/* Header */}
      <header style={styles.header}>
        <span style={styles.logo} onClick={() => router.push('/play-online')}>
          Full Uproar
        </span>
        <button
          style={{ ...styles.roomCode, cursor: 'pointer', background: showCopied ? 'rgba(34, 197, 94, 0.2)' : styles.roomCode.background }}
          onClick={copyRoomCode}
          title="Click to copy room code"
        >
          {showCopied ? '✓ Copied!' : `Room: ${room.toUpperCase()}`}
        </button>
        <div style={styles.connectionStatus}>
          <div
            style={{
              ...styles.statusDot,
              background: statusColor,
              boxShadow: isConnected ? '0 0 8px rgba(34, 197, 94, 0.6)' : 'none',
            }}
          />
          <span style={{ color: '#9ca3af' }}>
            {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      {/* Error toast */}
      {error && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#fff',
            padding: '14px 28px',
            borderRadius: '10px',
            zIndex: 100,
            animation: 'fadeIn 0.3s ease-out',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)',
            fontWeight: '500',
          }}
        >
          {error}
        </div>
      )}

      {/* Reconnect prompt */}
      {showReconnectPrompt && storedPlayerName && !playerId && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.98) 0%, rgba(20, 30, 48, 0.98) 100%)',
            padding: '32px',
            borderRadius: '16px',
            border: '2px solid rgba(249, 115, 22, 0.4)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            zIndex: 200,
            textAlign: 'center',
            maxWidth: '360px',
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👋</div>
          <h3 style={{ color: '#fdba74', marginBottom: '8px', fontSize: '20px' }}>
            Welcome Back!
          </h3>
          <p style={{ color: '#9ca3af', marginBottom: '24px', fontSize: '14px' }}>
            We found your previous session as <strong style={{ color: '#f97316' }}>{storedPlayerName}</strong>.
            Would you like to rejoin?
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={handleReconnect}
              style={{
                ...styles.button,
                padding: '12px 24px',
              }}
            >
              Rejoin Game
            </button>
            <button
              onClick={handleSkipReconnect}
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                padding: '12px 24px',
              }}
            >
              Join as New
            </button>
          </div>
        </div>
      )}

      {/* Reconnect overlay */}
      {showReconnectPrompt && storedPlayerName && !playerId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 199,
          }}
          onClick={handleSkipReconnect}
        />
      )}

      {/* Loading state */}
      {isConnecting && (
        <div style={{ ...styles.gameArea, justifyContent: 'center' }}>
          <div style={styles.spinner} />
          <p style={{ color: '#9ca3af', marginTop: '16px' }}>Connecting to game server...</p>
        </div>
      )}

      <div style={styles.main}>
        {/* Not in game - show join/create form */}
        {!playerId && isConnected && (
          <div style={styles.gameArea}>
            <div style={styles.joinForm}>
              <h2 style={{ color: '#f97316', marginBottom: '8px', textAlign: 'center' }}>
                Cards Against Humanity
              </h2>
              <p style={{ color: '#9ca3af', marginBottom: '24px', textAlign: 'center' }}>
                {gameState ? 'Join the game' : 'Create a new game'}
              </p>

              <label style={styles.label}>Your Name</label>
              <input
                style={styles.input}
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    gameState ? handleJoinGame() : handleCreateGame();
                  }
                }}
              />

              {gameState ? (
                <button
                  style={{
                    ...styles.button,
                    width: '100%',
                    ...(!playerName.trim() ? styles.buttonDisabled : {}),
                  }}
                  onClick={handleJoinGame}
                  disabled={!playerName.trim()}
                >
                  Join Game
                </button>
              ) : (
                <button
                  style={{
                    ...styles.button,
                    width: '100%',
                    ...(!playerName.trim() ? styles.buttonDisabled : {}),
                  }}
                  onClick={handleCreateGame}
                  disabled={!playerName.trim()}
                >
                  Create Game
                </button>
              )}
            </div>
          </div>
        )}

        {/* In game */}
        {playerId && gameState && (
          <>
            {/* Game area */}
            <div
              style={{
                ...styles.gameArea,
                paddingBottom: gameState.currentPhase === 'SUBMIT' && !isJudge && !hasSubmitted ? '280px' : '24px',
              }}
            >
              {/* Lobby */}
              {gameState.status === 'lobby' && (
                <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
                  <h2 style={{ color: '#fdba74', marginBottom: '8px' }}>Game Lobby</h2>
                  <p style={{ color: '#9ca3af', marginBottom: '32px' }}>
                    {gameState.players.length} player{gameState.players.length !== 1 ? 's' : ''} ready
                    {gameState.players.length < 3 && ` • Need ${3 - gameState.players.length} more`}
                  </p>

                  {/* Game Settings (Lead only) */}
                  {currentPlayer?.isLead && (
                    <div style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '24px',
                      border: '1px solid rgba(249, 115, 22, 0.2)',
                      textAlign: 'left',
                    }}>
                      <h3 style={{
                        color: '#fdba74',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '16px',
                      }}>
                        Game Settings
                      </h3>

                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {/* Points to win */}
                        <div style={{ flex: '1 1 140px' }}>
                          <label style={{
                            display: 'block',
                            color: '#9ca3af',
                            fontSize: '12px',
                            marginBottom: '6px',
                          }}>
                            Points to Win
                          </label>
                          <select
                            value={gameState.settings.endValue || 10}
                            onChange={(e) => {
                              // Would send update to server - for now just visual
                              // TODO: Implement settings update
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              background: 'rgba(15, 23, 42, 0.8)',
                              border: '1px solid rgba(249, 115, 22, 0.3)',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '14px',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="5">5 points (Quick)</option>
                            <option value="7">7 points</option>
                            <option value="10">10 points (Classic)</option>
                            <option value="15">15 points (Long)</option>
                          </select>
                        </div>

                        {/* Hand size */}
                        <div style={{ flex: '1 1 140px' }}>
                          <label style={{
                            display: 'block',
                            color: '#9ca3af',
                            fontSize: '12px',
                            marginBottom: '6px',
                          }}>
                            Cards in Hand
                          </label>
                          <select
                            value={gameState.settings.handSize || 7}
                            onChange={(e) => {
                              // Would send update to server - for now just visual
                              // TODO: Implement settings update
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              background: 'rgba(15, 23, 42, 0.8)',
                              border: '1px solid rgba(249, 115, 22, 0.3)',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '14px',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="5">5 cards</option>
                            <option value="7">7 cards (Classic)</option>
                            <option value="10">10 cards</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Player list preview */}
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '24px',
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                      {gameState.players.map((player) => (
                        <div
                          key={player.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: player.id === playerId ? 'rgba(249, 115, 22, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                            border: player.id === playerId ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
                            padding: '8px 12px',
                            borderRadius: '20px',
                          }}
                        >
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: player.isLead ? '#f97316' : '#4b5563',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: player.isLead ? '#000' : '#fff',
                          }}>
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ color: '#e2e8f0', fontSize: '14px' }}>
                            {player.name}
                            {player.isLead && ' 👑'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {currentPlayer?.isLead && (
                    <button
                      style={{
                        ...styles.button,
                        padding: '14px 48px',
                        fontSize: '16px',
                        ...(gameState.players.length < 3 ? styles.buttonDisabled : {}),
                      }}
                      onClick={handleStartGame}
                      disabled={gameState.players.length < 3}
                    >
                      {gameState.players.length < 3
                        ? `Waiting for ${3 - gameState.players.length} more player${3 - gameState.players.length !== 1 ? 's' : ''}...`
                        : 'Start Game'}
                    </button>
                  )}

                  {!currentPlayer?.isLead && (
                    <p style={{ color: '#9ca3af', fontSize: '14px', animation: 'pulse 2s ease-in-out infinite' }}>
                      Waiting for host to start the game...
                    </p>
                  )}
                </div>
              )}

              {/* Active game */}
              {gameState.status === 'playing' && (
                <>
                  {/* Phase indicator with score progress */}
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div style={{
                      display: 'inline-flex',
                      flexDirection: 'column',
                      gap: '8px',
                      background: 'rgba(30, 41, 59, 0.6)',
                      padding: '12px 20px',
                      borderRadius: '12px',
                      border: '1px solid rgba(249, 115, 22, 0.2)',
                    }}>
                      <span
                        style={{
                          color: '#fdba74',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                        }}
                      >
                        Round {gameState.round} • {judge?.name || 'Unknown'} is Card Czar
                      </span>
                      {/* Score progress bar */}
                      {(() => {
                        const targetScore = gameState.settings.endValue || 10;
                        const highestScore = Math.max(...gameState.players.map(p => p.score || 0), 0);
                        const leader = gameState.players.reduce((best, p) =>
                          (p.score || 0) > (best?.score || 0) ? p : best,
                          gameState.players[0]
                        );
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#9ca3af', fontSize: '11px', whiteSpace: 'nowrap' }}>
                              First to {targetScore}
                            </span>
                            <div style={{
                              flex: 1,
                              height: '6px',
                              background: 'rgba(15, 23, 42, 0.8)',
                              borderRadius: '3px',
                              minWidth: '100px',
                              overflow: 'hidden',
                            }}>
                              <div style={{
                                width: `${Math.min((highestScore / targetScore) * 100, 100)}%`,
                                height: '100%',
                                background: highestScore >= targetScore - 1
                                  ? 'linear-gradient(90deg, #ef4444, #f97316)'
                                  : 'linear-gradient(90deg, #f97316, #22c55e)',
                                borderRadius: '3px',
                                transition: 'width 0.5s ease-out',
                              }} />
                            </div>
                            <span style={{
                              color: highestScore >= targetScore - 1 ? '#ef4444' : '#9ca3af',
                              fontSize: '11px',
                              fontWeight: highestScore >= targetScore - 1 ? 'bold' : 'normal',
                            }}>
                              {leader?.name}: {highestScore}/{targetScore}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Prompt card */}
                  {promptCard && (
                    <div style={{ marginBottom: '24px' }}>
                      <CardComponent card={promptCard} />
                    </div>
                  )}

                  {/* Submit phase */}
                  {gameState.currentPhase === 'SUBMIT' && (
                    <p style={styles.message}>
                      {isJudge
                        ? `Waiting for players to submit... (${Object.keys(submissions).length}/${gameState.players.filter((p) => p.id !== judgeId).length})`
                        : hasSubmitted
                        ? 'Submitted! Waiting for others...'
                        : `Select ${pickCount} card${pickCount > 1 ? 's' : ''} from your hand`}
                    </p>
                  )}

                  {/* Judge phase */}
                  {gameState.currentPhase === 'JUDGE' && (
                    <>
                      <p style={styles.message}>
                        {isJudge ? 'Pick the winning card!' : `${judge?.name} is choosing...`}
                      </p>
                      <div style={styles.cardGrid}>
                        {Object.entries(submissions).map(([pid, submission]) => (
                          <div
                            key={pid}
                            style={{
                              ...styles.submissionGroup,
                              ...(isJudge && hoveredSubmission === pid ? styles.submissionGroupHover : {}),
                              cursor: isJudge ? 'pointer' : 'default',
                            }}
                            onClick={() => isJudge && handleSelectWinner(pid)}
                            onMouseEnter={() => isJudge && setHoveredSubmission(pid)}
                            onMouseLeave={() => setHoveredSubmission(null)}
                          >
                            {(submission as Submission).cards.map((card) => (
                              <CardComponent key={card.id} card={card} small />
                            ))}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Resolve phase */}
                  {gameState.currentPhase === 'RESOLVE' && (
                    <>
                      <p
                        style={{
                          ...styles.message,
                          fontSize: gameState.roundState?.winnerId === playerId ? '24px' : '18px',
                          animation: 'fadeIn 0.5s ease-out',
                        }}
                      >
                        {gameState.roundState?.winnerId === playerId
                          ? '🎉 You won this round! 🎉'
                          : `${gameState.players.find((p) => p.id === gameState.roundState?.winnerId)?.name} wins!`}
                      </p>
                      <div style={styles.cardGrid}>
                        {Object.entries(submissions).map(([pid, submission], idx) => {
                          const isWinnerSubmission = pid === gameState.roundState?.winnerId;
                          const winner = gameState.players.find((p) => p.id === pid);
                          return (
                            <div
                              key={pid}
                              style={{
                                ...styles.submissionGroup,
                                ...(isWinnerSubmission
                                  ? {
                                      background: 'rgba(249, 115, 22, 0.15)',
                                      border: '2px solid rgba(249, 115, 22, 0.5)',
                                      transform: 'scale(1.05)',
                                    }
                                  : { opacity: 0.6 }),
                                animation: 'fadeIn 0.5s ease-out',
                                animationDelay: `${idx * 0.1}s`,
                              }}
                            >
                              {(submission as Submission).cards.map((card, cardIdx) => (
                                <CardComponent
                                  key={card.id}
                                  card={card}
                                  selected={isWinnerSubmission}
                                  isWinner={isWinnerSubmission}
                                  small
                                  animationDelay={cardIdx}
                                />
                              ))}
                              {isWinnerSubmission && <span style={styles.winnerBadge}>{winner?.name} wins!</span>}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Game Over */}
              {gameState.status === 'ended' && (
                <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏆</div>
                  <h2 style={{
                    color: '#f97316',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                  }}>
                    Game Over!
                  </h2>
                  {(() => {
                    const winner = gameState.players.reduce((best, p) =>
                      (p.score || 0) > (best?.score || 0) ? p : best,
                      gameState.players[0]
                    );
                    const isWinner = winner?.id === playerId;
                    return (
                      <>
                        <p style={{
                          color: isWinner ? '#22c55e' : '#fdba74',
                          fontSize: '24px',
                          marginBottom: '32px',
                        }}>
                          {isWinner ? '🎉 You Won! 🎉' : `${winner?.name} wins!`}
                        </p>

                        {/* Final Scores */}
                        <div style={{
                          background: 'rgba(30, 41, 59, 0.8)',
                          borderRadius: '16px',
                          padding: '24px',
                          maxWidth: '400px',
                          margin: '0 auto 32px',
                          border: '2px solid rgba(249, 115, 22, 0.3)',
                        }}>
                          <h3 style={{
                            color: '#fdba74',
                            fontSize: '14px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '16px',
                          }}>
                            Final Scores
                          </h3>
                          {gameState.players
                            .filter(p => p.presence === 'active' || p.presence === 'disconnected')
                            .sort((a, b) => (b.score || 0) - (a.score || 0))
                            .map((player, idx) => (
                              <div
                                key={player.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '12px',
                                  background: idx === 0 ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                                  borderRadius: '8px',
                                  marginBottom: '4px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{
                                    fontSize: '18px',
                                    width: '28px',
                                    textAlign: 'center',
                                  }}>
                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                                  </span>
                                  <span style={{
                                    color: player.id === playerId ? '#f97316' : '#e2e8f0',
                                    fontWeight: player.id === playerId ? 'bold' : 'normal',
                                  }}>
                                    {player.name}
                                    {player.id === playerId && ' (You)'}
                                  </span>
                                </div>
                                <span style={{
                                  color: idx === 0 ? '#f97316' : '#9ca3af',
                                  fontWeight: 'bold',
                                  fontSize: '18px',
                                }}>
                                  {player.score || 0}
                                </span>
                              </div>
                            ))}
                        </div>

                        {/* Play Again button (lead only) */}
                        {currentPlayer?.isLead && (
                          <button
                            onClick={() => {
                              send({ type: 'action', action: { type: 'restartGame' } });
                            }}
                            style={{
                              ...styles.button,
                              padding: '16px 48px',
                              fontSize: '16px',
                            }}
                          >
                            Play Again
                          </button>
                        )}
                        {!currentPlayer?.isLead && (
                          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                            Waiting for host to start a new game...
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Sidebar - Players */}
            <aside style={styles.sidebar}>
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Players</h3>
                {gameState.players
                  .filter((p) => p.presence === 'active')
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((player) => {
                    const isCurrentJudge = player.id === judgeId;
                    const isYou = player.id === playerId;
                    const playerSubmitted = submissions[player.id] !== undefined;

                    return (
                      <div
                        key={player.id}
                        style={{
                          ...styles.playerRow,
                          ...(isYou ? styles.playerRowYou : {}),
                        }}
                      >
                        <div
                          style={{
                            ...styles.playerAvatar,
                            ...(isCurrentJudge ? styles.playerAvatarJudge : {}),
                          }}
                        >
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={styles.playerInfo}>
                          <div style={styles.playerName}>
                            {player.name}
                            {isYou && ' (You)'}
                          </div>
                          <div style={styles.playerScore}>{player.score || 0} points</div>
                        </div>
                        {gameState.currentPhase === 'SUBMIT' && (
                          <span
                            style={{
                              ...styles.badge,
                              background: isCurrentJudge
                                ? 'rgba(249, 115, 22, 0.2)'
                                : playerSubmitted
                                ? 'rgba(34, 197, 94, 0.2)'
                                : 'rgba(234, 179, 8, 0.2)',
                              color: isCurrentJudge ? '#f97316' : playerSubmitted ? '#22c55e' : '#eab308',
                            }}
                          >
                            {isCurrentJudge ? 'CZAR' : playerSubmitted ? 'READY' : '...'}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Recent events */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Activity</h3>
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {events
                    .slice(-8)
                    .reverse()
                    .map((event, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: '11px',
                          color: '#9ca3af',
                          padding: '4px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        {event.type}
                      </div>
                    ))}
                </div>
              </div>
            </aside>
          </>
        )}

        {/* Hand - fixed at bottom */}
        {playerId &&
          gameState?.status === 'playing' &&
          gameState.currentPhase === 'SUBMIT' &&
          !isJudge &&
          !hasSubmitted && (
            <div style={styles.hand}>
              <div style={styles.handHeader}>
                <span style={styles.handTitle}>
                  Your Hand
                  {pickCount > 1 && ` - Select ${pickCount} cards (${selectedCards.length}/${pickCount})`}
                </span>
                <button
                  style={{
                    ...styles.button,
                    padding: '8px 20px',
                    ...(selectedCards.length !== pickCount ? styles.buttonDisabled : {}),
                  }}
                  onClick={handleSubmit}
                  disabled={selectedCards.length !== pickCount}
                >
                  Submit {pickCount > 1 ? 'Cards' : 'Card'}
                </button>
              </div>
              <div style={styles.handCards}>
                {currentPlayer?.hand.map((card) => {
                  const selectedIndex = selectedCards.indexOf(card.id);
                  const isSelected = selectedIndex !== -1;
                  return (
                    <CardComponent
                      key={card.id}
                      card={card}
                      selected={isSelected}
                      onClick={() => handleCardSelect(card.id)}
                      order={pickCount > 1 && isSelected ? selectedIndex + 1 : undefined}
                      small
                    />
                  );
                })}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
