import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  GameState,
  GameEvent,
  ClientMessage,
  ServerMessage,
  Action,
} from '@full-uproar/game-platform-core';

// =============================================================================
// TYPES
// =============================================================================

interface UsePartyGameOptions {
  host: string;
  room: string;
}

interface UsePartyGameReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;

  // Game state
  gameState: GameState | null;
  playerId: string | null;
  events: GameEvent[];

  // Actions
  createGame: (playerName: string) => void;
  joinGame: (playerName: string) => void;
  leaveGame: () => void;
  sendAction: (action: Action) => void;

  // Helpers
  clearError: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

export function usePartyGame({ host, room }: UsePartyGameOptions): UsePartyGameReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to PartyKit
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setIsConnecting(true);
    setError(null);

    const protocol = host.startsWith('localhost') ? 'ws' : 'wss';
    const url = `${protocol}://${host}/party/${room}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      console.log('[PartyKit] Connected to', room);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsConnecting(false);
      wsRef.current = null;
      console.log('[PartyKit] Disconnected');

      // Auto-reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!wsRef.current) {
          connect();
        }
      }, 3000);
    };

    ws.onerror = (event) => {
      console.error('[PartyKit] WebSocket error:', event);
      setError('Connection error');
    };

    ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        handleServerMessage(message);
      } catch (err) {
        console.error('[PartyKit] Failed to parse message:', err);
      }
    };
  }, [host, room]);

  // Handle server messages
  const handleServerMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'gameState':
        setGameState(message.state);
        break;

      case 'joined':
        setPlayerId(message.playerId);
        setGameState(message.gameState);
        break;

      case 'left':
        setPlayerId(null);
        setGameState(null);
        break;

      case 'event':
        setEvents((prev) => [...prev, message.event]);
        break;

      case 'error':
        setError(message.message);
        break;

      default:
        console.warn('[PartyKit] Unknown message type:', (message as any).type);
    }
  }, []);

  // Send message to server
  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      setError('Not connected');
    }
  }, []);

  // Actions
  const createGame = useCallback(
    (playerName: string) => {
      send({ type: 'createGame', playerName });
    },
    [send]
  );

  const joinGame = useCallback(
    (playerName: string) => {
      send({ type: 'joinGame', playerName });
    },
    [send]
  );

  const leaveGame = useCallback(() => {
    send({ type: 'leaveGame' });
  }, [send]);

  const sendAction = useCallback(
    (action: Action) => {
      send({ type: 'action', action });
    },
    [send]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return {
    isConnected,
    isConnecting,
    error,
    gameState,
    playerId,
    events,
    createGame,
    joinGame,
    leaveGame,
    sendAction,
    clearError,
  };
}
