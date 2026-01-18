'use client';

import React from 'react';
import type { GameState, Player, Card as CardType, Submission } from '@full-uproar/game-platform-core';
import { PromptCard } from './PromptCard';
import { Card } from './Card';
import { Hand } from './Hand';

// =============================================================================
// STYLES
// =============================================================================

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    background: 'rgba(30, 41, 59, 0.9)',
    borderBottom: '2px solid rgba(249, 115, 22, 0.3)',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logo: {
    fontSize: '20px',
    fontWeight: 'bold' as const,
    color: '#f97316',
  },
  phaseIndicator: {
    background: 'rgba(249, 115, 22, 0.2)',
    color: '#fdba74',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  roundInfo: {
    fontSize: '14px',
    color: '#9ca3af',
  },
  leaveButton: {
    background: 'transparent',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    color: '#ef4444',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  main: {
    flex: 1,
    display: 'flex',
    padding: '24px',
    gap: '24px',
    overflow: 'hidden',
  },
  gameArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '32px',
  },
  sidebar: {
    width: '280px',
    background: 'rgba(30, 41, 59, 0.5)',
    borderRadius: '12px',
    padding: '16px',
    overflowY: 'auto' as const,
  },
  sidebarTitle: {
    fontSize: '14px',
    fontWeight: '600' as const,
    color: '#fdba74',
    marginBottom: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  // Player list in sidebar
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '6px',
    background: 'rgba(15, 23, 42, 0.5)',
  },
  playerRowActive: {
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
  playerStatus: {
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '600' as const,
  },
  statusSubmitted: {
    background: 'rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
  },
  statusWaiting: {
    background: 'rgba(234, 179, 8, 0.2)',
    color: '#eab308',
  },
  statusJudge: {
    background: 'rgba(249, 115, 22, 0.2)',
    color: '#f97316',
  },
  // Submissions area
  submissionsArea: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '16px',
    justifyContent: 'center',
    maxWidth: '800px',
  },
  submissionCard: {
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  submissionGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    alignItems: 'center',
  },
  winnerLabel: {
    background: '#f97316',
    color: '#000',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    marginTop: '8px',
  },
  // Phase messages
  phaseMessage: {
    fontSize: '18px',
    color: '#fdba74',
    textAlign: 'center' as const,
    marginBottom: '16px',
  },
  waitingMessage: {
    fontSize: '14px',
    color: '#9ca3af',
    textAlign: 'center' as const,
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getPhaseDisplay(phase: string): string {
  const displays: Record<string, string> = {
    LOBBY: 'Lobby',
    SETUP: 'Setting Up',
    PROMPT: 'New Round',
    SUBMIT: 'Submitting',
    REVEAL: 'Revealing',
    JUDGE: 'Judging',
    RESOLVE: 'Winner!',
    END: 'Game Over',
  };
  return displays[phase] || phase;
}

// =============================================================================
// GAME BOARD COMPONENT
// =============================================================================

interface GameBoardProps {
  gameState: GameState;
  currentPlayerId: string;
  onSubmitCards: (cardIds: string[]) => void;
  onSelectWinner: (playerId: string) => void;
  onRevealNext?: () => void;
  onNextRound?: () => void;
  onLeaveGame: () => void;
}

export function GameBoard({
  gameState,
  currentPlayerId,
  onSubmitCards,
  onSelectWinner,
  onRevealNext,
  onNextRound,
  onLeaveGame,
}: GameBoardProps) {
  const currentPlayer = gameState.players.find((p) => p.id === currentPlayerId);
  const currentPhase = gameState.currentPhase;
  const roundState = gameState.roundState;

  // Get the current prompt card from the table slot
  const promptCard = gameState.globalSlots['table']?.[0];

  // Get the judge for this round (from GameState.roles)
  const judgeId = gameState.roles.judge;
  const judge = judgeId ? gameState.players.find((p) => p.id === judgeId) : null;
  const isJudge = currentPlayerId === judgeId;

  // Get current player's hand
  const playerHand = currentPlayer?.hand || [];

  // Get pick count from prompt card
  const pickCount = promptCard?.properties?.pick || 1;

  // Check if current player has submitted
  const hasSubmitted = roundState?.submissions?.[currentPlayerId] !== undefined;

  // Get all submissions
  const submissions = roundState?.submissions || {};
  const submissionEntries = Object.entries(submissions);

  // Count submissions (excluding judge)
  const submitterCount = gameState.players.filter(
    (p) => p.presence === 'active' && p.id !== judgeId
  ).length;
  const submittedCount = submissionEntries.length;

  // Render submissions based on phase
  const renderSubmissions = () => {
    if (currentPhase === 'SUBMIT') {
      // Show anonymous card backs for submitted players
      return (
        <div style={styles.submissionsArea}>
          {submissionEntries.map(([, submission], index) => (
            <div key={index} style={styles.submissionGroup}>
              {Array.from({ length: pickCount }).map((_: unknown, cardIndex: number) => (
                <Card
                  key={cardIndex}
                  card={{ id: `back-${index}-${cardIndex}`, type: 'white', properties: {} }}
                  faceDown
                />
              ))}
            </div>
          ))}
        </div>
      );
    }

    if (currentPhase === 'REVEAL' || currentPhase === 'JUDGE') {
      // Show revealed cards (still anonymous during judging)
      return (
        <div style={styles.submissionsArea}>
          {submissionEntries.map(([playerId, submission], index) => {
            const sub = submission as Submission;
            const cards = sub.cards;

            // For now, show all cards (reveal logic could be added later)
            return (
              <div
                key={playerId}
                style={{
                  ...styles.submissionGroup,
                  ...(isJudge && currentPhase === 'JUDGE' ? styles.submissionCard : {}),
                }}
                onClick={isJudge && currentPhase === 'JUDGE' ? () => onSelectWinner(playerId) : undefined}
              >
                {cards.map((card) => (
                  <Card key={card.id} card={card} />
                ))}
              </div>
            );
          })}
        </div>
      );
    }

    if (currentPhase === 'RESOLVE') {
      const winnerId = roundState?.winnerId;
      const winner = gameState.players.find((p: Player) => p.id === winnerId);

      return (
        <div style={styles.submissionsArea}>
          {submissionEntries.map(([playerId, submission]) => {
            const sub = submission as Submission;
            const cards = sub.cards;
            const isWinner = playerId === winnerId;

            return (
              <div key={playerId} style={styles.submissionGroup}>
                {cards.map((card) => (
                  <Card
                    key={card.id}
                    card={card}
                    selected={isWinner}
                  />
                ))}
                {isWinner && (
                  <span style={styles.winnerLabel}>{winner?.name || 'Winner'}!</span>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>Full Uproar</span>
          <span style={styles.phaseIndicator}>{getPhaseDisplay(currentPhase)}</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.roundInfo}>
            Round {gameState.round} • {judge?.name || 'Unknown'} is judging
          </span>
          <button style={styles.leaveButton} onClick={onLeaveGame}>
            Leave
          </button>
        </div>
      </header>

      {/* Main game area */}
      <div style={styles.main}>
        {/* Game area */}
        <div style={styles.gameArea}>
          {/* Prompt card */}
          {promptCard && <PromptCard card={promptCard} />}

          {/* Phase-specific content */}
          {currentPhase === 'SUBMIT' && (
            <>
              {isJudge ? (
                <p style={styles.waitingMessage}>
                  You are the Card Czar. Wait for players to submit...
                  <br />
                  ({submittedCount}/{submitterCount} submitted)
                </p>
              ) : hasSubmitted ? (
                <p style={styles.waitingMessage}>
                  Submitted! Waiting for others...
                  <br />
                  ({submittedCount}/{submitterCount} submitted)
                </p>
              ) : (
                <p style={styles.phaseMessage}>
                  Select {pickCount} card{pickCount > 1 ? 's' : ''} from your hand
                </p>
              )}
            </>
          )}

          {currentPhase === 'REVEAL' && (
            <p style={styles.phaseMessage}>
              {isJudge ? 'Click cards to reveal them' : 'The Card Czar is revealing submissions...'}
            </p>
          )}

          {currentPhase === 'JUDGE' && (
            <p style={styles.phaseMessage}>
              {isJudge ? 'Pick the winner!' : `${judge?.name} is picking the winner...`}
            </p>
          )}

          {currentPhase === 'RESOLVE' && (
            <>
              <p style={styles.phaseMessage}>
                {roundState?.winnerId === currentPlayerId ? 'You won this round!' : `${gameState.players.find((p: Player) => p.id === roundState?.winnerId)?.name} wins!`}
              </p>
              {isJudge && onNextRound && (
                <button
                  style={{
                    padding: '12px 24px',
                    background: '#f97316',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold' as const,
                    cursor: 'pointer',
                  }}
                  onClick={onNextRound}
                >
                  Next Round
                </button>
              )}
            </>
          )}

          {/* Submissions display */}
          {renderSubmissions()}
        </div>

        {/* Sidebar - Scoreboard */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarTitle}>Players</div>
          {gameState.players
            .filter((p: Player) => p.presence === 'active')
            .sort((a: Player, b: Player) => (b.score || 0) - (a.score || 0))
            .map((player: Player) => {
              const isCurrentJudge = player.id === judgeId;
              const playerSubmitted = submissions[player.id] !== undefined;

              return (
                <div
                  key={player.id}
                  style={{
                    ...styles.playerRow,
                    ...(player.id === currentPlayerId ? styles.playerRowActive : {}),
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
                      {player.id === currentPlayerId && ' (You)'}
                    </div>
                    <div style={styles.playerScore}>{player.score || 0} points</div>
                  </div>
                  {currentPhase === 'SUBMIT' && (
                    <span
                      style={{
                        ...styles.playerStatus,
                        ...(isCurrentJudge
                          ? styles.statusJudge
                          : playerSubmitted
                          ? styles.statusSubmitted
                          : styles.statusWaiting),
                      }}
                    >
                      {isCurrentJudge ? 'CZAR' : playerSubmitted ? 'READY' : '...'}
                    </span>
                  )}
                </div>
              );
            })}
        </aside>
      </div>

      {/* Hand - only show during submit phase for non-judges */}
      {currentPhase === 'SUBMIT' && !isJudge && !hasSubmitted && (
        <Hand
          cards={playerHand}
          pickCount={pickCount}
          onSubmit={onSubmitCards}
          disabled={hasSubmitted}
        />
      )}
    </div>
  );
}
