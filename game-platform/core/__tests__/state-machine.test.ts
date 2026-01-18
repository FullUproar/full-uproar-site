/**
 * Tests for the game platform state machine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGame,
  addPlayer,
  applyAction,
  CAH_DEFINITION,
  createPlaceholderPack,
  type GameState,
  type GameContext,
  type Player,
  type GameAction,
} from '../src/index.js';
import { generateId, now } from '../src/utils.js';

// =============================================================================
// TEST HELPERS
// =============================================================================

function createTestContext(): GameContext {
  return {
    definition: CAH_DEFINITION,
    packs: [createPlaceholderPack()],
  };
}

function createTestPlayer(
  id: string,
  name: string,
  isLead: boolean = false
): Omit<Player, 'hand' | 'slots' | 'score' | 'lastSeen'> {
  return {
    id,
    name,
    isLead,
    presence: 'active',
    joinedAt: now(),
  };
}

function createTestAction(
  playerId: string,
  action: GameAction['action']
): GameAction {
  return {
    id: generateId(),
    playerId,
    action,
    timestamp: now(),
  };
}

// =============================================================================
// GAME CREATION TESTS
// =============================================================================

describe('Game Creation', () => {
  it('should create a game in lobby state', () => {
    const state = createGame('game-1', 'host-1', CAH_DEFINITION);

    expect(state.gameId).toBe('game-1');
    expect(state.status).toBe('lobby');
    expect(state.currentPhase).toBe('LOBBY');
    expect(state.roles.lead).toBe('host-1');
    expect(state.roles.judge).toBeNull();
    expect(state.players).toHaveLength(0);
  });

  it('should use default settings from definition', () => {
    const state = createGame('game-1', 'host-1', CAH_DEFINITION);

    expect(state.settings.handSize).toBe(7);
    expect(state.settings.endCondition).toBe('points');
    expect(state.settings.endValue).toBe(10);
  });

  it('should allow custom settings', () => {
    const state = createGame('game-1', 'host-1', CAH_DEFINITION, {
      handSize: 10,
      endValue: 5,
    });

    expect(state.settings.handSize).toBe(10);
    expect(state.settings.endValue).toBe(5);
  });
});

// =============================================================================
// PLAYER MANAGEMENT TESTS
// =============================================================================

describe('Player Management', () => {
  let state: GameState;

  beforeEach(() => {
    state = createGame('game-1', 'host-1', CAH_DEFINITION);
  });

  it('should add a player to the game', () => {
    const player = createTestPlayer('player-1', 'Alice', true);
    const result = addPlayer(state, player);

    expect(result.state.players).toHaveLength(1);
    expect(result.state.players[0].name).toBe('Alice');
    expect(result.state.players[0].hand).toEqual([]);
    expect(result.state.players[0].score).toBe(0);

    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe('playerJoined');
  });

  it('should add multiple players', () => {
    let result = addPlayer(state, createTestPlayer('p1', 'Alice', true));
    result = addPlayer(result.state, createTestPlayer('p2', 'Bob'));
    result = addPlayer(result.state, createTestPlayer('p3', 'Charlie'));

    expect(result.state.players).toHaveLength(3);
  });
});

// =============================================================================
// GAME START TESTS
// =============================================================================

describe('Game Start', () => {
  let state: GameState;
  let context: GameContext;

  beforeEach(() => {
    state = createGame('game-1', 'host-1', CAH_DEFINITION);
    context = createTestContext();

    // Add 4 players
    let result = addPlayer(state, createTestPlayer('host-1', 'Host', true));
    result = addPlayer(result.state, createTestPlayer('p2', 'Player 2'));
    result = addPlayer(result.state, createTestPlayer('p3', 'Player 3'));
    result = addPlayer(result.state, createTestPlayer('p4', 'Player 4'));
    state = result.state;
  });

  it('should not start with too few players', () => {
    // Create fresh game with only 2 players
    let newState = createGame('game-2', 'host-1', CAH_DEFINITION);
    let result = addPlayer(newState, createTestPlayer('host-1', 'Host', true));
    result = addPlayer(result.state, createTestPlayer('p2', 'Player 2'));
    newState = result.state;

    const action = createTestAction('host-1', { type: 'startGame' });
    const startResult = applyAction(newState, action, context);

    // State should be unchanged (validation failed)
    expect(startResult.state.status).toBe('lobby');
  });

  it('should start the game with enough players', () => {
    const action = createTestAction('host-1', { type: 'startGame' });
    const result = applyAction(state, action, context);

    expect(result.state.status).toBe('playing');
    expect(result.state.startedAt).toBeDefined();
    expect(result.state.round).toBe(1);

    // Should have dealt cards
    result.state.players.forEach((player) => {
      expect(player.hand.length).toBe(7);
    });

    // Should have assigned judge
    expect(result.state.roles.judge).toBeDefined();
    expect(result.state.turnOrder).toHaveLength(4);

    // Should have set up decks
    expect(result.state.decks.black.cards.length).toBeGreaterThan(0);
    expect(result.state.decks.white.cards.length).toBeGreaterThan(0);
  });

  it('should emit gameStarted and judgeChanged events', () => {
    const action = createTestAction('host-1', { type: 'startGame' });
    const result = applyAction(state, action, context);

    const eventTypes = result.events.map((e) => e.type);
    expect(eventTypes).toContain('gameStarted');
    expect(eventTypes).toContain('judgeChanged');
  });

  it('should only allow lead to start game', () => {
    const action = createTestAction('p2', { type: 'startGame' }); // Not the lead
    const result = applyAction(state, action, context);

    // State should be unchanged
    expect(result.state.status).toBe('lobby');
  });
});

// =============================================================================
// CARD SUBMISSION TESTS
// =============================================================================

describe('Card Submission', () => {
  let state: GameState;
  let context: GameContext;

  beforeEach(() => {
    state = createGame('game-1', 'host-1', CAH_DEFINITION);
    context = createTestContext();

    // Add players
    let result = addPlayer(state, createTestPlayer('host-1', 'Host', true));
    result = addPlayer(result.state, createTestPlayer('p2', 'Player 2'));
    result = addPlayer(result.state, createTestPlayer('p3', 'Player 3'));
    result = addPlayer(result.state, createTestPlayer('p4', 'Player 4'));
    state = result.state;

    // Start the game
    const startAction = createTestAction('host-1', { type: 'startGame' });
    const startResult = applyAction(state, startAction, context);
    state = startResult.state;
  });

  it('should allow non-judges to submit cards', () => {
    // Find a non-judge player
    const submitter = state.players.find(
      (p) => p.id !== state.roles.judge && p.hand.length > 0
    );
    expect(submitter).toBeDefined();

    // Submit first card from hand
    const cardId = submitter!.hand[0].id;
    const action = createTestAction(submitter!.id, {
      type: 'submitCards',
      cardIds: [cardId],
    });

    // Need to be in SUBMIT phase
    const submitState = {
      ...state,
      currentPhase: 'SUBMIT',
    };

    const result = applyAction(submitState, action, context);

    // Check submission was recorded
    expect(result.state.roundState.submissions[submitter!.id]).toBeDefined();
    expect(result.state.roundState.submissions[submitter!.id].cards).toHaveLength(1);

    // Card should be removed from hand
    const playerAfter = result.state.players.find((p) => p.id === submitter!.id);
    expect(playerAfter!.hand.length).toBe(submitter!.hand.length - 1);
  });

  it('should not allow judge to submit', () => {
    const judge = state.players.find((p) => p.id === state.roles.judge);
    expect(judge).toBeDefined();

    const cardId = judge!.hand[0].id;
    const action = createTestAction(judge!.id, {
      type: 'submitCards',
      cardIds: [cardId],
    });

    const submitState = {
      ...state,
      currentPhase: 'SUBMIT',
    };

    const result = applyAction(submitState, action, context);

    // Submission should not be recorded
    expect(result.state.roundState.submissions[judge!.id]).toBeUndefined();
  });

  it('should auto-transition to REVEAL when all submit', () => {
    // Put in SUBMIT phase
    let submitState: GameState = {
      ...state,
      currentPhase: 'SUBMIT',
    };

    // Submit for all non-judges
    const nonJudges = submitState.players.filter(
      (p) => p.id !== submitState.roles.judge
    );

    for (const player of nonJudges) {
      const cardId = submitState.players.find((p) => p.id === player.id)!.hand[0].id;
      const action = createTestAction(player.id, {
        type: 'submitCards',
        cardIds: [cardId],
      });

      const result = applyAction(submitState, action, context);
      submitState = result.state;
    }

    // Should have transitioned to REVEAL or JUDGE
    expect(['REVEAL', 'JUDGE']).toContain(submitState.currentPhase);

    // Should have shuffled order set
    expect(submitState.roundState.shuffledOrder).toBeDefined();
    expect(submitState.roundState.shuffledOrder!.length).toBe(nonJudges.length);
  });
});

// =============================================================================
// WINNER SELECTION TESTS
// =============================================================================

describe('Winner Selection', () => {
  it('should allow judge to select winner', () => {
    const context = createTestContext();
    let state = createGame('game-1', 'host-1', CAH_DEFINITION);

    // Add players
    let result = addPlayer(state, createTestPlayer('host-1', 'Host', true));
    result = addPlayer(result.state, createTestPlayer('p2', 'Player 2'));
    result = addPlayer(result.state, createTestPlayer('p3', 'Player 3'));
    state = result.state;

    // Start the game
    const startAction = createTestAction('host-1', { type: 'startGame' });
    const startResult = applyAction(state, startAction, context);
    state = startResult.state;

    // Verify game started correctly
    expect(state.status).toBe('playing');
    expect(state.roles.judge).toBeDefined();

    // Get the judge and non-judges
    const judge = state.roles.judge!;
    const nonJudges = state.players.filter((p) => p.id !== judge);

    // Create submissions manually
    const submissions: Record<string, { cards: typeof state.players[0]['hand']; submittedAt: number }> = {};
    nonJudges.forEach((p) => {
      const playerInState = state.players.find((pl) => pl.id === p.id)!;
      submissions[p.id] = {
        cards: [playerInState.hand[0]],
        submittedAt: now(),
      };
    });

    // Create state in JUDGE phase with submissions
    const judgePhaseState: GameState = {
      ...state,
      currentPhase: 'JUDGE',
      roundState: {
        submissions,
        shuffledOrder: nonJudges.map((p) => p.id),
      },
    };

    const winnerId = Object.keys(judgePhaseState.roundState.submissions)[0];

    const action = createTestAction(judge, {
      type: 'selectWinner',
      playerId: winnerId,
    });

    const selectResult = applyAction(judgePhaseState, action, context);

    expect(selectResult.state.roundState.winnerId).toBe(winnerId);

    // Winner's score should increase
    const winner = selectResult.state.players.find((p) => p.id === winnerId);
    expect(winner!.score).toBe(1);

    // Events should include winner selection and score change
    const eventTypes = selectResult.events.map((e) => e.type);
    expect(eventTypes).toContain('winnerSelected');
    expect(eventTypes).toContain('scoreChanged');
  });

  it('should not allow non-judges to select winner', () => {
    const context = createTestContext();
    let state = createGame('game-1', 'host-1', CAH_DEFINITION);

    // Add players
    let result = addPlayer(state, createTestPlayer('host-1', 'Host', true));
    result = addPlayer(result.state, createTestPlayer('p2', 'Player 2'));
    result = addPlayer(result.state, createTestPlayer('p3', 'Player 3'));
    state = result.state;

    // Start the game
    const startAction = createTestAction('host-1', { type: 'startGame' });
    const startResult = applyAction(state, startAction, context);
    state = startResult.state;

    const judge = state.roles.judge!;
    const nonJudges = state.players.filter((p) => p.id !== judge);
    const nonJudge = nonJudges[0];

    // Create submissions
    const submissions: Record<string, { cards: typeof state.players[0]['hand']; submittedAt: number }> = {};
    nonJudges.forEach((p) => {
      const playerInState = state.players.find((pl) => pl.id === p.id)!;
      submissions[p.id] = {
        cards: [playerInState.hand[0]],
        submittedAt: now(),
      };
    });

    const judgePhaseState: GameState = {
      ...state,
      currentPhase: 'JUDGE',
      roundState: {
        submissions,
        shuffledOrder: nonJudges.map((p) => p.id),
      },
    };

    const winnerId = Object.keys(judgePhaseState.roundState.submissions)[0];

    const action = createTestAction(nonJudge.id, {
      type: 'selectWinner',
      playerId: winnerId,
    });

    const selectResult = applyAction(judgePhaseState, action, context);

    // Winner should not be set (non-judge tried to select)
    expect(selectResult.state.roundState.winnerId).toBeUndefined();
  });
});

// =============================================================================
// PAUSE/RESUME TESTS
// =============================================================================

describe('Pause and Resume', () => {
  let state: GameState;
  let context: GameContext;

  beforeEach(() => {
    state = createGame('game-1', 'host-1', CAH_DEFINITION);
    context = createTestContext();

    // Add players and start
    let result = addPlayer(state, createTestPlayer('host-1', 'Host', true));
    result = addPlayer(result.state, createTestPlayer('p2', 'Player 2'));
    result = addPlayer(result.state, createTestPlayer('p3', 'Player 3'));

    const startAction = createTestAction('host-1', { type: 'startGame' });
    const startResult = applyAction(result.state, startAction, context);
    state = startResult.state;
  });

  it('should allow lead to pause', () => {
    const action = createTestAction('host-1', { type: 'pauseGame' });
    const result = applyAction(state, action, context);

    expect(result.state.status).toBe('paused');
    expect(result.events.some((e) => e.type === 'gamePaused')).toBe(true);
  });

  it('should allow lead to resume', () => {
    // First pause
    const pauseAction = createTestAction('host-1', { type: 'pauseGame' });
    let result = applyAction(state, pauseAction, context);

    // Then resume
    const resumeAction = createTestAction('host-1', { type: 'resumeGame' });
    result = applyAction(result.state, resumeAction, context);

    expect(result.state.status).toBe('playing');
    expect(result.events.some((e) => e.type === 'gameResumed')).toBe(true);
  });

  it('should not allow non-lead to pause', () => {
    const action = createTestAction('p2', { type: 'pauseGame' });
    const result = applyAction(state, action, context);

    expect(result.state.status).toBe('playing'); // Unchanged
  });
});

// =============================================================================
// CAH HELPER TESTS
// =============================================================================

describe('CAH Helpers', () => {
  it('interpolatePrompt should fill blanks', async () => {
    const { interpolatePrompt } = await import('../src/games/cah-definition.js');

    const blackCard = {
      id: 'b1',
      type: 'black',
      properties: { text: 'What ended my last relationship? _.' },
    };

    const whiteCards = [
      { id: 'w1', type: 'white', properties: { text: 'A disappointing birthday party' } },
    ];

    const result = interpolatePrompt(blackCard, whiteCards);
    expect(result).toBe('What ended my last relationship? **A disappointing birthday party**.');
  });

  it('interpolatePrompt should handle multiple blanks', async () => {
    const { interpolatePrompt } = await import('../src/games/cah-definition.js');

    const blackCard = {
      id: 'b1',
      type: 'black',
      properties: { text: '_ is the new _.', pick: 2, blanks: 2 },
    };

    const whiteCards = [
      { id: 'w1', type: 'white', properties: { text: 'Existential dread' } },
      { id: 'w2', type: 'white', properties: { text: 'Self-care' } },
    ];

    const result = interpolatePrompt(blackCard, whiteCards);
    expect(result).toBe('**Existential dread** is the new **Self-care**.');
  });

  it('getPickCount should return correct count', async () => {
    const { getPickCount } = await import('../src/games/cah-definition.js');

    expect(getPickCount({ id: 'b1', type: 'black', properties: {} })).toBe(1);
    expect(getPickCount({ id: 'b2', type: 'black', properties: { pick: 2 } })).toBe(2);
    expect(getPickCount({ id: 'b3', type: 'black', properties: { pick: 3 } })).toBe(3);
  });
});
