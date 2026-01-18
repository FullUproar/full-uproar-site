'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { GameState, GameAction, GameEvent, Player, Card } from '../../game-platform/core/dist/types';
import {
  createGame,
  addPlayer,
  applyAction,
  CAH_DEFINITION,
  getAllPacks,
  combinePacks,
  generateId,
  now,
} from '../../game-platform/core/dist/index';

// Generate a random 4-letter room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // No I or O to avoid confusion
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// =============================================================================
// INLINE COMPONENTS (to avoid build issues with workspace packages)
// =============================================================================

// Card component
const cardStyles = {
  card: {
    position: 'relative' as const,
    width: '180px',
    minHeight: '240px',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-start',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  whiteCard: {
    background: '#ffffff',
    color: '#000000',
    border: '2px solid #e5e5e5',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  blackCard: {
    background: '#000000',
    color: '#ffffff',
    border: '2px solid #333333',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  cardText: {
    fontSize: '16px',
    fontWeight: '600' as const,
    lineHeight: 1.4,
    flex: 1,
  },
  cardFooter: {
    marginTop: '12px',
    fontSize: '11px',
    opacity: 0.6,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  selected: {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0 8px 24px rgba(249, 115, 22, 0.4)',
    border: '2px solid #f97316',
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
};

function CardComponent({
  card,
  selected = false,
  onClick,
  order,
}: {
  card: Card;
  selected?: boolean;
  onClick?: () => void;
  order?: number;
}) {
  const isBlack = card.type === 'black';

  const style = {
    ...cardStyles.card,
    ...(isBlack ? cardStyles.blackCard : cardStyles.whiteCard),
    ...(selected ? cardStyles.selected : {}),
  };

  return (
    <div style={style} onClick={onClick}>
      {order !== undefined && <div style={cardStyles.orderBadge}>{order}</div>}
      <div style={cardStyles.cardText}>{card.properties?.text ?? ''}</div>
      <div style={cardStyles.cardFooter}>
        {isBlack ? 'Cards Against Humanity' : 'Full Uproar'}
      </div>
    </div>
  );
}

// =============================================================================
// PAGE STYLES
// =============================================================================

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#fff',
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    padding: '16px 24px',
    background: 'rgba(30, 41, 59, 0.8)',
    borderRadius: '12px',
    border: '2px solid rgba(249, 115, 22, 0.3)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold' as const,
    color: '#f97316',
  },
  phaseTag: {
    background: 'rgba(249, 115, 22, 0.2)',
    color: '#fdba74',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  mainArea: {
    display: 'grid',
    gridTemplateColumns: '1fr 300px',
    gap: '24px',
  },
  gameArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  sidebar: {
    background: 'rgba(30, 41, 59, 0.5)',
    borderRadius: '12px',
    padding: '20px',
  },
  section: {
    background: 'rgba(30, 41, 59, 0.5)',
    borderRadius: '12px',
    padding: '20px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600' as const,
    color: '#fdba74',
    marginBottom: '16px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  cardGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '12px',
    justifyContent: 'center',
  },
  button: {
    padding: '12px 24px',
    background: '#f97316',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buttonDisabled: {
    background: '#4b5563',
    color: '#9ca3af',
    cursor: 'not-allowed',
  },
  buttonSecondary: {
    background: 'transparent',
    border: '2px solid rgba(249, 115, 22, 0.5)',
    color: '#f97316',
  },
  playerRow: {
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
    background: '#4b5563',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
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
  statusBadge: {
    fontSize: '10px',
    padding: '4px 8px',
    borderRadius: '4px',
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
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
    padding: '12px',
    background: 'rgba(15, 23, 42, 0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  winnerBadge: {
    background: '#f97316',
    color: '#000',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    marginTop: '8px',
  },
  controlPanel: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    padding: '16px',
    background: 'rgba(139, 92, 246, 0.1)',
    borderRadius: '8px',
    border: '1px dashed rgba(139, 92, 246, 0.3)',
  },
  debugInfo: {
    fontSize: '12px',
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
};

// =============================================================================
// GAME CONTEXT
// =============================================================================

interface GameContextType {
  definition: typeof CAH_DEFINITION;
  packs: ReturnType<typeof combinePacks>[];
}

// =============================================================================
// PLAY ONLINE PAGE
// =============================================================================

export default function PlayOnlinePage() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [showLocalTest, setShowLocalTest] = useState(false);

  // Create a new multiplayer room
  const createRoom = useCallback(() => {
    const roomCode = generateRoomCode();
    router.push(`/play-online/${roomCode}`);
  }, [router]);

  // Join an existing room
  const joinRoom = useCallback(() => {
    const code = joinCode.trim().toUpperCase();
    if (code.length >= 3) {
      router.push(`/play-online/${code}`);
    }
  }, [joinCode, router]);

  // Create game context
  const gameContext: GameContextType = useMemo(
    () => ({
      definition: CAH_DEFINITION,
      packs: [combinePacks(getAllPacks())],
    }),
    []
  );

  // Helper to dispatch action
  const dispatchAction = useCallback(
    (action: GameAction['action'], playerId?: string) => {
      if (!gameState) return;

      const gameAction: GameAction = {
        id: generateId(),
        playerId: playerId || currentPlayerId || '',
        action,
        timestamp: now(),
      };

      const result = applyAction(gameState, gameAction, gameContext);
      setGameState(result.state);
      setEvents((prev) => [...prev, ...result.events]);
    },
    [gameState, currentPlayerId, gameContext]
  );

  // Create a new game with multiple players
  const createTestGame = useCallback(() => {
    const gameId = generateId();
    const player1Id = generateId();
    const player2Id = generateId();
    const player3Id = generateId();

    // Create game
    let state = createGame(gameId, player1Id, CAH_DEFINITION);

    // Add players
    const players = [
      { id: player1Id, name: 'You', isLead: true },
      { id: player2Id, name: 'Bot Alice', isLead: false },
      { id: player3Id, name: 'Bot Bob', isLead: false },
    ];

    for (const p of players) {
      const result = addPlayer(state, {
        id: p.id,
        name: p.name,
        isLead: p.isLead,
        presence: 'active',
        joinedAt: now(),
      });
      state = result.state;
    }

    setGameState(state);
    setCurrentPlayerId(player1Id);
    setSelectedCards([]);
    setEvents([]);
  }, []);

  // Start game
  const startGame = useCallback(() => {
    dispatchAction({ type: 'startGame' });
    setSelectedCards([]);
  }, [dispatchAction]);

  // Handle card selection
  const handleCardSelect = useCallback(
    (cardId: string) => {
      if (!gameState) return;

      const promptCard = gameState.globalSlots['table']?.[0];
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
    },
    [gameState]
  );

  // Submit cards
  const submitCards = useCallback(() => {
    if (selectedCards.length === 0) return;
    dispatchAction({ type: 'submitCards', cardIds: selectedCards });
    setSelectedCards([]);
  }, [dispatchAction, selectedCards]);

  // Bot submit (for testing)
  const botSubmit = useCallback(
    (playerId: string) => {
      if (!gameState) return;

      const player = gameState.players.find((p) => p.id === playerId);
      if (!player || !player.hand.length) return;

      const promptCard = gameState.globalSlots['table']?.[0];
      const pickCount = promptCard?.properties?.pick ?? 1;

      const cardIds = player.hand.slice(0, pickCount).map((c) => c.id);
      dispatchAction({ type: 'submitCards', cardIds }, playerId);
    },
    [dispatchAction, gameState]
  );

  // Select winner
  const selectWinner = useCallback(
    (playerId: string) => {
      dispatchAction({ type: 'selectWinner', playerId });
    },
    [dispatchAction]
  );

  // Get current player
  const currentPlayer = gameState?.players.find((p) => p.id === currentPlayerId);
  const judgeId = gameState?.roles.judge;
  const isJudge = currentPlayerId === judgeId;
  const promptCard = gameState?.globalSlots['table']?.[0];
  const pickCount = promptCard?.properties?.pick ?? 1;
  const hasSubmitted = gameState?.roundState?.submissions[currentPlayerId || ''] !== undefined;

  // Check if all non-judges have submitted
  const allSubmitted =
    gameState &&
    gameState.players
      .filter((p) => p.presence === 'active' && p.id !== judgeId)
      .every((p) => gameState.roundState?.submissions[p.id]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>Cards Against Humanity - Test Mode</h1>
        {gameState && (
          <span style={styles.phaseTag}>
            Phase: {gameState.currentPhase} | Round: {gameState.round}
          </span>
        )}
      </header>

      {/* No game state - show options */}
      {!gameState && !showLocalTest && (
        <div style={{ textAlign: 'center', padding: '60px', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: '#fdba74', marginBottom: '12px', fontSize: '32px' }}>
            Play Cards Against Humanity
          </h2>
          <p style={{ color: '#9ca3af', marginBottom: '40px' }}>
            Create a room and invite friends, or join an existing game.
          </p>

          {/* Create Room Button */}
          <button
            style={{ ...styles.button, fontSize: '18px', padding: '16px 48px', marginBottom: '24px' }}
            onClick={createRoom}
          >
            Create Game Room
          </button>

          {/* Join Room Section */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '48px',
          }}>
            <input
              type="text"
              placeholder="Enter room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
              maxLength={6}
              style={{
                padding: '12px 16px',
                fontSize: '18px',
                fontWeight: 'bold',
                letterSpacing: '4px',
                textAlign: 'center',
                width: '160px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '2px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '8px',
                color: '#fff',
                textTransform: 'uppercase',
              }}
            />
            <button
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                padding: '12px 24px',
                opacity: joinCode.length >= 3 ? 1 : 0.5,
              }}
              onClick={joinRoom}
              disabled={joinCode.length < 3}
            >
              Join
            </button>
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
            opacity: 0.5,
          }}>
            <div style={{ flex: 1, height: '1px', background: '#4b5563' }} />
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#4b5563' }} />
          </div>

          {/* Local Test Mode */}
          <button
            style={{
              ...styles.button,
              background: 'transparent',
              border: '1px dashed rgba(139, 92, 246, 0.4)',
              color: '#a78bfa',
              fontSize: '14px',
            }}
            onClick={() => setShowLocalTest(true)}
          >
            Local Test Mode (Offline)
          </button>
          <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '8px' }}>
            Test game mechanics with simulated players
          </p>
        </div>
      )}

      {/* Local Test Mode */}
      {!gameState && showLocalTest && (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <button
            style={{
              ...styles.button,
              ...styles.buttonSecondary,
              fontSize: '12px',
              padding: '8px 16px',
              marginBottom: '24px',
            }}
            onClick={() => setShowLocalTest(false)}
          >
            ← Back to Multiplayer
          </button>
          <h2 style={{ color: '#a78bfa', marginBottom: '24px' }}>
            Local Test Mode
          </h2>
          <p style={{ color: '#9ca3af', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
            Test the game platform locally with simulated players. No network required.
          </p>
          <button style={styles.button} onClick={createTestGame}>
            Create Test Game
          </button>
        </div>
      )}

      {/* Game active */}
      {gameState && (
        <div style={styles.mainArea}>
          {/* Main game area */}
          <div style={styles.gameArea}>
            {/* Control Panel - for testing */}
            <div style={styles.controlPanel}>
              <span style={styles.debugInfo}>Test Controls:</span>
              {gameState.status === 'lobby' && (
                <button style={styles.button} onClick={startGame}>
                  Start Game
                </button>
              )}
              {gameState.currentPhase === 'SUBMIT' && !allSubmitted && (
                <>
                  {gameState.players
                    .filter((p) => p.id !== currentPlayerId && p.id !== judgeId)
                    .filter((p) => !gameState.roundState?.submissions[p.id])
                    .map((p) => (
                      <button
                        key={p.id}
                        style={{ ...styles.button, ...styles.buttonSecondary }}
                        onClick={() => botSubmit(p.id)}
                      >
                        {p.name} Submit
                      </button>
                    ))}
                </>
              )}
              <button
                style={{ ...styles.button, ...styles.buttonSecondary }}
                onClick={createTestGame}
              >
                Reset Game
              </button>
            </div>

            {/* Prompt Card */}
            {promptCard && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Black Card</h3>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <CardComponent card={promptCard} />
                </div>
              </div>
            )}

            {/* Phase-specific content */}
            {gameState.currentPhase === 'SUBMIT' && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                  {isJudge ? 'You are the Card Czar' : 'Select Your Card(s)'}
                </h3>

                {isJudge ? (
                  <p style={styles.message}>
                    Wait for players to submit their cards...
                    <br />
                    <span style={styles.debugInfo}>
                      {Object.keys(gameState.roundState?.submissions || {}).length}/
                      {gameState.players.filter((p) => p.id !== judgeId).length} submitted
                    </span>
                  </p>
                ) : hasSubmitted ? (
                  <p style={styles.message}>
                    Submitted! Waiting for others...
                  </p>
                ) : (
                  <>
                    <div style={styles.cardGrid}>
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
                          />
                        );
                      })}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                      <button
                        style={{
                          ...styles.button,
                          ...(selectedCards.length === pickCount ? {} : styles.buttonDisabled),
                        }}
                        onClick={submitCards}
                        disabled={selectedCards.length !== pickCount}
                      >
                        Submit {pickCount > 1 ? `${selectedCards.length}/${pickCount} Cards` : 'Card'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Judging phase */}
            {(gameState.currentPhase === 'JUDGE' || gameState.currentPhase === 'REVEAL') && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                  {isJudge ? 'Pick the Winner!' : 'Card Czar is Choosing...'}
                </h3>
                <div style={styles.cardGrid}>
                  {Object.entries(gameState.roundState?.submissions || {}).map(
                    ([playerId, submission]) => (
                      <div
                        key={playerId}
                        style={{
                          ...styles.submissionGroup,
                          ...(isJudge ? { cursor: 'pointer' } : {}),
                        }}
                        onClick={isJudge ? () => selectWinner(playerId) : undefined}
                      >
                        {submission.cards.map((card) => (
                          <CardComponent key={card.id} card={card} />
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Resolve phase */}
            {gameState.currentPhase === 'RESOLVE' && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Round Winner!</h3>
                <div style={styles.cardGrid}>
                  {Object.entries(gameState.roundState?.submissions || {}).map(
                    ([playerId, submission]) => {
                      const isWinner = playerId === gameState.roundState?.winnerId;
                      const winner = gameState.players.find((p) => p.id === playerId);
                      return (
                        <div key={playerId} style={styles.submissionGroup}>
                          {submission.cards.map((card) => (
                            <CardComponent key={card.id} card={card} selected={isWinner} />
                          ))}
                          {isWinner && (
                            <span style={styles.winnerBadge}>{winner?.name} wins!</span>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Players */}
          <aside style={styles.sidebar}>
            <h3 style={styles.sectionTitle}>Players</h3>
            {gameState.players
              .filter((p) => p.presence === 'active')
              .sort((a, b) => (b.score || 0) - (a.score || 0))
              .map((player) => {
                const isCurrentJudge = player.id === judgeId;
                const playerSubmitted = gameState.roundState?.submissions[player.id];
                const isYou = player.id === currentPlayerId;

                return (
                  <div key={player.id} style={styles.playerRow}>
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
                          ...styles.statusBadge,
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

            {/* Event log */}
            <h3 style={{ ...styles.sectionTitle, marginTop: '24px' }}>Recent Events</h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {events
                .slice(-10)
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
          </aside>
        </div>
      )}
    </div>
  );
}
