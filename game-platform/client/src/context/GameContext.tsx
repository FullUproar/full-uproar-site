'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type {
  GameState,
  GameAction,
  GameEvent,
  GameContext as GameContextType,
  Player,
  Card,
  Action,
} from '@full-uproar/game-platform-core';
import {
  createGame,
  addPlayer,
  applyAction,
  CAH_DEFINITION,
  createPlaceholderPack,
  generateId,
  now,
} from '@full-uproar/game-platform-core';

// =============================================================================
// TYPES
// =============================================================================

interface GameProviderState {
  gameState: GameState | null;
  playerId: string | null;
  events: GameEvent[];
  error: string | null;
  isConnected: boolean;
  isConnecting: boolean;
}

type GameProviderAction =
  | { type: 'SET_GAME_STATE'; state: GameState }
  | { type: 'ADD_EVENT'; event: GameEvent }
  | { type: 'SET_PLAYER_ID'; playerId: string }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_CONNECTED'; connected: boolean }
  | { type: 'SET_CONNECTING'; connecting: boolean }
  | { type: 'RESET' };

interface GameContextValue {
  // State
  gameState: GameState | null;
  playerId: string | null;
  events: GameEvent[];
  error: string | null;
  isConnected: boolean;
  isConnecting: boolean;

  // Computed
  currentPlayer: Player | null;
  isLead: boolean;
  isJudge: boolean;
  canSubmit: boolean;
  canJudge: boolean;

  // Actions
  createGame: (hostName: string) => void;
  joinGame: (gameId: string, playerName: string) => void;
  startGame: () => void;
  leaveGame: () => void;
  submitCards: (cardIds: string[]) => void;
  selectWinner: (playerId: string) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  setPresence: (presence: 'active' | 'away') => void;
  clearError: () => void;
}

// =============================================================================
// CONTEXT
// =============================================================================

const GameContext = createContext<GameContextValue | null>(null);

// =============================================================================
// REDUCER
// =============================================================================

function gameReducer(state: GameProviderState, action: GameProviderAction): GameProviderState {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.state, error: null };
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.event] };
    case 'SET_PLAYER_ID':
      return { ...state, playerId: action.playerId };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.connected };
    case 'SET_CONNECTING':
      return { ...state, isConnecting: action.connecting };
    case 'RESET':
      return { gameState: null, playerId: null, events: [], error: null, isConnected: false, isConnecting: false };
    default:
      return state;
  }
}

// =============================================================================
// PROVIDER
// =============================================================================

interface GameProviderProps {
  children: React.ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, {
    gameState: null,
    playerId: null,
    events: [],
    error: null,
    isConnected: false,
    isConnecting: false,
  });

  // Create game context for state machine
  const gameContext: GameContextType = useMemo(
    () => ({
      definition: CAH_DEFINITION,
      packs: [createPlaceholderPack()],
    }),
    []
  );

  // Helper to apply action and update state
  const dispatchGameAction = useCallback(
    (action: Action) => {
      if (!state.gameState || !state.playerId) {
        dispatch({ type: 'SET_ERROR', error: 'No active game or player' });
        return;
      }

      const gameAction: GameAction = {
        id: generateId(),
        playerId: state.playerId,
        action,
        timestamp: now(),
      };

      const result = applyAction(state.gameState, gameAction, gameContext);
      dispatch({ type: 'SET_GAME_STATE', state: result.state });

      // Add events
      result.events.forEach((event: GameEvent) => {
        dispatch({ type: 'ADD_EVENT', event });
      });
    },
    [state.gameState, state.playerId, gameContext]
  );

  // Actions
  const handleCreateGame = useCallback(
    (hostName: string) => {
      const gameId = generateId();
      const hostId = generateId();

      // Create game
      const newState = createGame(gameId, hostId, CAH_DEFINITION);

      // Add host as player
      const result = addPlayer(newState, {
        id: hostId,
        name: hostName,
        isLead: true,
        presence: 'active',
        joinedAt: now(),
      });

      dispatch({ type: 'SET_GAME_STATE', state: result.state });
      dispatch({ type: 'SET_PLAYER_ID', playerId: hostId });
      dispatch({ type: 'SET_CONNECTED', connected: true });

      result.events.forEach((event: GameEvent) => {
        dispatch({ type: 'ADD_EVENT', event });
      });
    },
    []
  );

  const handleJoinGame = useCallback(
    (gameId: string, playerName: string) => {
      if (!state.gameState) {
        dispatch({ type: 'SET_ERROR', error: 'Game not found' });
        return;
      }

      const playerId = generateId();
      const result = addPlayer(state.gameState, {
        id: playerId,
        name: playerName,
        isLead: false,
        presence: 'active',
        joinedAt: now(),
      });

      dispatch({ type: 'SET_GAME_STATE', state: result.state });
      dispatch({ type: 'SET_PLAYER_ID', playerId });
      dispatch({ type: 'SET_CONNECTED', connected: true });

      result.events.forEach((event: GameEvent) => {
        dispatch({ type: 'ADD_EVENT', event });
      });
    },
    [state.gameState]
  );

  const handleStartGame = useCallback(() => {
    dispatchGameAction({ type: 'startGame' });
  }, [dispatchGameAction]);

  const handleSubmitCards = useCallback(
    (cardIds: string[]) => {
      dispatchGameAction({ type: 'submitCards', cardIds });
    },
    [dispatchGameAction]
  );

  const handleSelectWinner = useCallback(
    (playerId: string) => {
      dispatchGameAction({ type: 'selectWinner', playerId });
    },
    [dispatchGameAction]
  );

  const handlePauseGame = useCallback(() => {
    dispatchGameAction({ type: 'pauseGame' });
  }, [dispatchGameAction]);

  const handleResumeGame = useCallback(() => {
    dispatchGameAction({ type: 'resumeGame' });
  }, [dispatchGameAction]);

  const handleEndGame = useCallback(() => {
    dispatchGameAction({ type: 'endGame' });
  }, [dispatchGameAction]);

  const handleSetPresence = useCallback(
    (presence: 'active' | 'away') => {
      dispatchGameAction({ type: 'setPresence', presence });
    },
    [dispatchGameAction]
  );

  const handleLeaveGame = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', error: null });
  }, []);

  // Computed values
  const currentPlayer = useMemo(() => {
    if (!state.gameState || !state.playerId) return null;
    return state.gameState.players.find((p: Player) => p.id === state.playerId) ?? null;
  }, [state.gameState, state.playerId]);

  const isLead = currentPlayer?.isLead ?? false;

  const isJudge = state.gameState?.roles.judge === state.playerId;

  const canSubmit = useMemo(() => {
    if (!state.gameState || !state.playerId || isJudge) return false;
    if (state.gameState.currentPhase !== 'SUBMIT') return false;
    // Check if already submitted
    return !state.gameState.roundState.submissions[state.playerId];
  }, [state.gameState, state.playerId, isJudge]);

  const canJudge = useMemo(() => {
    if (!state.gameState || !isJudge) return false;
    return state.gameState.currentPhase === 'JUDGE';
  }, [state.gameState, isJudge]);

  const value: GameContextValue = {
    // State
    gameState: state.gameState,
    playerId: state.playerId,
    events: state.events,
    error: state.error,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,

    // Computed
    currentPlayer,
    isLead,
    isJudge,
    canSubmit,
    canJudge,

    // Actions
    createGame: handleCreateGame,
    joinGame: handleJoinGame,
    startGame: handleStartGame,
    leaveGame: handleLeaveGame,
    submitCards: handleSubmitCards,
    selectWinner: handleSelectWinner,
    pauseGame: handlePauseGame,
    resumeGame: handleResumeGame,
    endGame: handleEndGame,
    setPresence: handleSetPresence,
    clearError,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
