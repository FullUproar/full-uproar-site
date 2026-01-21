/**
 * Pure functional state machine for the game platform
 * Each handler takes (state, action, context) => StateTransitionResult
 */

import type {
  GameState,
  GameAction,
  GameEvent,
  GameContext,
  StateTransitionResult,
  Player,
  Card,
  Deck,
  Action,
  PlayerPresence,
  GameDefinition,
  Timestamp,
} from './types';
import {
  shuffle,
  drawCards,
  discardCards,
  findPlayer,
  updatePlayer,
  getActivePlayers,
  getSubmitters,
  getNextInRotation,
  assignNewLead,
  removeCardFromHand,
  addCardsToHand,
  mergePacksIntoDecks,
  generateId,
  now,
  shuffleDeck,
} from './utils';
import { validateAction, checkTransitionCondition } from './validation';

// =============================================================================
// MAIN STATE MACHINE
// =============================================================================

/**
 * Apply an action to the game state
 * Returns new state and emitted events
 */
export function applyAction(
  state: GameState,
  action: GameAction,
  context: GameContext
): StateTransitionResult {
  // Validate first
  const validation = validateAction(state, action, context.definition);
  if (!validation.valid) {
    // Return unchanged state with error event
    return {
      state,
      events: [],
    };
  }

  // Apply the action
  let result: StateTransitionResult;

  switch (action.action.type) {
    case 'startGame':
      result = handleStartGame(state, action, context);
      break;

    case 'pauseGame':
      result = handlePauseGame(state, action);
      break;

    case 'resumeGame':
      result = handleResumeGame(state, action);
      break;

    case 'endGame':
      result = handleEndGame(state, action);
      break;

    case 'restartGame':
      result = handleRestartGame(state, action);
      break;

    case 'draw':
      result = handleDraw(state, action);
      break;

    case 'play':
      result = handlePlay(state, action, context);
      break;

    case 'submitCards':
      result = handleSubmitCards(state, action, context);
      break;

    case 'discard':
      result = handleDiscard(state, action);
      break;

    case 'shuffle':
      result = handleShuffle(state, action);
      break;

    case 'selectWinner':
      result = handleSelectWinner(state, action, context);
      break;

    case 'kickPlayer':
      result = handleKickPlayer(state, action);
      break;

    case 'setPresence':
      result = handleSetPresence(state, action);
      break;

    case 'score':
      result = handleScore(state, action);
      break;

    case 'setPhase':
      result = handleSetPhase(state, action);
      break;

    case 'roll':
      result = handleRoll(state, action);
      break;

    case 'claimLead':
      result = handleClaimLead(state, action);
      break;

    case 'transferLead':
      result = handleTransferLead(state, action);
      break;

    default:
      result = { state, events: [] };
  }

  // Check for automatic phase transitions
  result = checkAutoTransitions(result.state, result.events, context);

  return result;
}

// =============================================================================
// ACTION HANDLERS
// =============================================================================

function handleStartGame(
  state: GameState,
  action: GameAction,
  context: GameContext
): StateTransitionResult {
  const timestamp = now();
  const activePlayers = getActivePlayers(state);

  // Merge packs into decks
  const selectedPacks = context.packs.filter((p) =>
    state.settings.packIds.includes(p.id)
  );
  const decks = mergePacksIntoDecks(selectedPacks, context.definition.decks);

  // Shuffle all decks
  const shuffledDecks: Record<string, Deck> = {};
  for (const [deckId, deck] of Object.entries(decks)) {
    shuffledDecks[deckId] = shuffleDeck(deck);
  }

  // Set up turn order (shuffle active players)
  const turnOrder = shuffle(activePlayers.map((p) => p.id));

  // Select first judge randomly
  const firstJudge = turnOrder[0];

  // Deal initial hands
  let playersWithHands = state.players.map((player) => {
    if (player.presence !== 'active') return player;

    // Find the white card deck
    const whiteDeckId = Object.entries(context.definition.decks).find(
      ([, def]) => def.cardType === 'white'
    )?.[0];

    if (!whiteDeckId) return player;

    const deck = shuffledDecks[whiteDeckId];
    const { deck: newDeck, cards } = drawCards(deck, state.settings.handSize);
    shuffledDecks[whiteDeckId] = newDeck;

    return {
      ...player,
      hand: cards,
    };
  });

  // Draw initial black card (prompt) for the table
  const blackDeckId = Object.entries(context.definition.decks).find(
    ([, def]) => def.cardType === 'black'
  )?.[0];

  let globalSlots: Record<string, Card[]> = {};
  if (blackDeckId && shuffledDecks[blackDeckId]) {
    const { deck: newBlackDeck, cards: promptCards } = drawCards(shuffledDecks[blackDeckId], 1);
    shuffledDecks[blackDeckId] = newBlackDeck;
    globalSlots['table'] = promptCards;
  }

  const newState: GameState = {
    ...state,
    status: 'playing',
    startedAt: timestamp,
    decks: shuffledDecks,
    players: playersWithHands,
    turnOrder,
    roles: {
      ...state.roles,
      judge: firstJudge,
    },
    globalSlots,
    currentPhase: 'SUBMIT', // Go directly to SUBMIT phase with prompt already dealt
    phaseStartedAt: timestamp,
    round: 1,
    roundState: {
      submissions: {},
    },
  };

  const events: GameEvent[] = [
    { type: 'gameStarted', timestamp },
    { type: 'phaseChanged', from: 'LOBBY', to: 'SUBMIT', timestamp },
    { type: 'judgeChanged', playerId: firstJudge, timestamp },
  ];

  return { state: newState, events };
}

function handlePauseGame(state: GameState, action: GameAction): StateTransitionResult {
  const timestamp = now();
  return {
    state: { ...state, status: 'paused' },
    events: [{ type: 'gamePaused', timestamp }],
  };
}

function handleResumeGame(state: GameState, action: GameAction): StateTransitionResult {
  const timestamp = now();
  return {
    state: { ...state, status: 'playing' },
    events: [{ type: 'gameResumed', timestamp }],
  };
}

function handleEndGame(state: GameState, action: GameAction): StateTransitionResult {
  const timestamp = now();
  const finalScores: Record<string, number> = {};
  state.players.forEach((p) => {
    finalScores[p.id] = p.score;
  });

  // Find winner (highest score)
  const winner = state.players.reduce((best, player) =>
    player.score > (best?.score ?? -1) ? player : best
  , state.players[0]);

  return {
    state: {
      ...state,
      status: 'ended',
      endedAt: timestamp,
      currentPhase: 'END',
    },
    events: [
      {
        type: 'gameEnded',
        winner: winner?.id,
        finalScores,
        timestamp,
      },
    ],
  };
}

function handleRestartGame(state: GameState, action: GameAction): StateTransitionResult {
  const timestamp = now();

  // Reset players - clear hands and scores but keep them in the game
  const resetPlayers = state.players.map((player) => ({
    ...player,
    hand: [],
    score: 0,
    slots: {},
  }));

  return {
    state: {
      ...state,
      status: 'lobby',
      startedAt: undefined,
      endedAt: undefined,
      players: resetPlayers,
      turnOrder: [],
      decks: {}, // Decks will be reinitialized on startGame
      globalSlots: {},
      roles: {
        ...state.roles,
        judge: null,
      },
      currentPhase: 'LOBBY',
      phaseStartedAt: timestamp,
      round: 0,
      roundState: {
        submissions: {},
      },
    },
    events: [
      { type: 'phaseChanged', from: 'END', to: 'LOBBY', timestamp },
    ],
  };
}

function handleDraw(state: GameState, action: GameAction): StateTransitionResult {
  if (action.action.type !== 'draw') return { state, events: [] };

  const { deckId, count, toZone } = action.action;
  const timestamp = now();

  const deck = state.decks[deckId];
  if (!deck) return { state, events: [] };

  const { deck: newDeck, cards } = drawCards(deck, count);

  let newState: GameState = {
    ...state,
    decks: {
      ...state.decks,
      [deckId]: newDeck,
    },
  };

  // If drawing to hand, add to player's hand
  if (toZone === 'hand') {
    const player = findPlayer(state, action.playerId);
    if (player) {
      newState = updatePlayer(newState, action.playerId, {
        hand: [...player.hand, ...cards],
      });
    }
  } else {
    // Drawing to a global slot
    const currentCards = state.globalSlots[toZone] ?? [];
    newState = {
      ...newState,
      globalSlots: {
        ...newState.globalSlots,
        [toZone]: [...currentCards, ...cards],
      },
    };
  }

  return {
    state: newState,
    events: [
      {
        type: 'cardDrawn',
        playerId: action.playerId,
        deckId,
        count,
        timestamp,
      },
    ],
  };
}

function handlePlay(
  state: GameState,
  action: GameAction,
  context: GameContext
): StateTransitionResult {
  if (action.action.type !== 'play') return { state, events: [] };

  const { cardId, toSlot, position } = action.action;
  const timestamp = now();

  const player = findPlayer(state, action.playerId);
  if (!player) return { state, events: [] };

  const { player: updatedPlayer, card } = removeCardFromHand(player, cardId);
  if (!card) return { state, events: [] };

  // Add to player's slot
  const currentSlotCards = updatedPlayer.slots[toSlot] ?? [];
  const newSlotCards =
    position !== undefined
      ? [...currentSlotCards.slice(0, position), card, ...currentSlotCards.slice(position)]
      : [...currentSlotCards, card];

  const newState = updatePlayer(state, action.playerId, {
    hand: updatedPlayer.hand,
    slots: {
      ...updatedPlayer.slots,
      [toSlot]: newSlotCards,
    },
  });

  return {
    state: newState,
    events: [
      {
        type: 'cardPlayed',
        playerId: action.playerId,
        cardId,
        toSlot,
        timestamp,
      },
    ],
  };
}

function handleSubmitCards(
  state: GameState,
  action: GameAction,
  context: GameContext
): StateTransitionResult {
  if (action.action.type !== 'submitCards') return { state, events: [] };

  const { cardIds } = action.action;
  const timestamp = now();

  const player = findPlayer(state, action.playerId);
  if (!player) return { state, events: [] };

  // Remove cards from hand and collect them
  let currentPlayer = player;
  const submittedCards: Card[] = [];

  for (const cardId of cardIds) {
    const { player: updatedPlayer, card } = removeCardFromHand(currentPlayer, cardId);
    if (card) {
      submittedCards.push(card);
      currentPlayer = updatedPlayer;
    }
  }

  // Update player's hand
  let newState = updatePlayer(state, action.playerId, {
    hand: currentPlayer.hand,
  });

  // Record submission
  newState = {
    ...newState,
    roundState: {
      ...newState.roundState,
      submissions: {
        ...newState.roundState.submissions,
        [action.playerId]: {
          cards: submittedCards,
          submittedAt: timestamp,
        },
      },
    },
  };

  const events: GameEvent[] = [];

  // Check if all submitters have submitted
  const submitters = getSubmitters(newState);
  const allSubmitted = submitters.every(
    (p) => newState.roundState.submissions[p.id]
  );

  if (allSubmitted) {
    // Shuffle submission order for anonymity
    const shuffledOrder = shuffle(Object.keys(newState.roundState.submissions));
    newState = {
      ...newState,
      roundState: {
        ...newState.roundState,
        shuffledOrder,
      },
    };

    // Create anonymized submissions for reveal
    const anonymizedSubmissions = shuffledOrder.map((playerId, index) => ({
      index,
      cards: newState.roundState.submissions[playerId].cards,
    }));

    events.push({
      type: 'submissionsRevealed',
      submissions: anonymizedSubmissions,
      timestamp,
    });
  }

  return { state: newState, events };
}

function handleDiscard(state: GameState, action: GameAction): StateTransitionResult {
  if (action.action.type !== 'discard') return { state, events: [] };

  const { cardId, fromZone, toDeckId } = action.action;
  const timestamp = now();

  const player = findPlayer(state, action.playerId);
  if (!player) return { state, events: [] };

  // Remove from hand
  const { player: updatedPlayer, card } = removeCardFromHand(player, cardId);
  if (!card) return { state, events: [] };

  let newState = updatePlayer(state, action.playerId, {
    hand: updatedPlayer.hand,
  });

  // Add to discard pile if specified
  if (toDeckId && newState.decks[toDeckId]) {
    newState = {
      ...newState,
      decks: {
        ...newState.decks,
        [toDeckId]: discardCards(newState.decks[toDeckId], [card]),
      },
    };
  }

  return {
    state: newState,
    events: [{ type: 'cardDiscarded', cardId, timestamp }],
  };
}

function handleShuffle(state: GameState, action: GameAction): StateTransitionResult {
  if (action.action.type !== 'shuffle') return { state, events: [] };

  const { deckId } = action.action;
  const deck = state.decks[deckId];
  if (!deck) return { state, events: [] };

  return {
    state: {
      ...state,
      decks: {
        ...state.decks,
        [deckId]: shuffleDeck(deck),
      },
    },
    events: [],
  };
}

function handleSelectWinner(
  state: GameState,
  action: GameAction,
  context: GameContext
): StateTransitionResult {
  if (action.action.type !== 'selectWinner') return { state, events: [] };

  const { playerId: winnerId } = action.action;
  const timestamp = now();

  const winner = findPlayer(state, winnerId);
  if (!winner) return { state, events: [] };

  const submission = state.roundState.submissions[winnerId];
  if (!submission) return { state, events: [] };

  const newScore = winner.score + 1;

  // Update winner's score
  let newState = updatePlayer(state, winnerId, {
    score: newScore,
  });

  // Record winner and transition to RESOLVE briefly
  newState = {
    ...newState,
    currentPhase: 'RESOLVE',
    roundState: {
      ...newState.roundState,
      winnerId,
    },
  };

  const events: GameEvent[] = [
    {
      type: 'winnerSelected',
      playerId: winnerId,
      cardIds: submission.cards.map((c) => c.id),
      timestamp,
    },
    {
      type: 'scoreChanged',
      playerId: winnerId,
      newScore,
      timestamp,
    },
    {
      type: 'phaseChanged',
      from: 'JUDGE',
      to: 'RESOLVE',
      timestamp,
    },
  ];

  // Check if game should end
  const endValue = state.settings.endValue ?? 10;
  if (state.settings.endCondition === 'points' && newScore >= endValue) {
    // Game over!
    const finalScores: Record<string, number> = {};
    newState.players.forEach((p) => {
      finalScores[p.id] = p.id === winnerId ? newScore : p.score;
    });

    newState = {
      ...newState,
      status: 'ended',
      endedAt: timestamp,
      currentPhase: 'END',
    };

    events.push({
      type: 'gameEnded',
      winner: winnerId,
      finalScores,
      timestamp,
    });

    return { state: newState, events };
  }

  // Start next round after a brief RESOLVE phase
  // In a real implementation, you might want a delay here for the UI to show the winner
  // For now, we'll advance immediately

  // Rotate judge
  const currentJudgeIndex = state.turnOrder.indexOf(state.roles.judge ?? '');
  const nextJudgeIndex = (currentJudgeIndex + 1) % state.turnOrder.length;
  const nextJudge = state.turnOrder[nextJudgeIndex];

  // Refill hands for all players who submitted
  const whiteDeckId = Object.entries(context.definition.decks).find(
    ([, def]) => def.cardType === 'white'
  )?.[0];

  let decks = { ...newState.decks };
  const playersWithRefilledHands = newState.players.map((player) => {
    if (player.presence !== 'active') return player;

    // Count how many cards were submitted
    const playerSubmission = state.roundState.submissions[player.id];
    const cardsSubmitted = playerSubmission?.cards.length ?? 0;

    if (cardsSubmitted === 0 || !whiteDeckId) return player;

    // Draw replacement cards
    const deck = decks[whiteDeckId];
    const { deck: newDeck, cards } = drawCards(deck, cardsSubmitted);
    decks[whiteDeckId] = newDeck;

    return {
      ...player,
      hand: [...player.hand, ...cards],
    };
  });

  // Draw new black card
  const blackDeckId = Object.entries(context.definition.decks).find(
    ([, def]) => def.cardType === 'black'
  )?.[0];

  let globalSlots = { ...newState.globalSlots };
  if (blackDeckId && decks[blackDeckId]) {
    const { deck: newBlackDeck, cards: promptCards } = drawCards(decks[blackDeckId], 1);
    decks[blackDeckId] = newBlackDeck;
    globalSlots['table'] = promptCards;
  }

  // Advance to next round
  newState = {
    ...newState,
    decks,
    players: playersWithRefilledHands,
    globalSlots,
    roles: {
      ...newState.roles,
      judge: nextJudge,
    },
    currentPhase: 'SUBMIT',
    phaseStartedAt: timestamp,
    round: state.round + 1,
    roundState: {
      submissions: {},
    },
  };

  events.push(
    { type: 'roundEnded', round: state.round, timestamp },
    { type: 'judgeChanged', playerId: nextJudge, timestamp },
    { type: 'phaseChanged', from: 'RESOLVE', to: 'SUBMIT', timestamp }
  );

  return { state: newState, events };
}

function handleKickPlayer(state: GameState, action: GameAction): StateTransitionResult {
  if (action.action.type !== 'kickPlayer') return { state, events: [] };

  const { playerId } = action.action;
  const timestamp = now();

  const newState = updatePlayer(state, playerId, {
    presence: 'left',
  });

  return {
    state: newState,
    events: [
      {
        type: 'playerLeft',
        playerId,
        reason: 'kicked',
        timestamp,
      },
    ],
  };
}

function handleSetPresence(state: GameState, action: GameAction): StateTransitionResult {
  if (action.action.type !== 'setPresence') return { state, events: [] };

  const { presence } = action.action;
  const timestamp = now();

  const newState = updatePlayer(state, action.playerId, {
    presence,
    lastSeen: timestamp,
  });

  return {
    state: newState,
    events: [
      {
        type: 'playerPresenceChanged',
        playerId: action.playerId,
        presence,
        timestamp,
      },
    ],
  };
}

function handleScore(state: GameState, action: GameAction): StateTransitionResult {
  if (action.action.type !== 'score') return { state, events: [] };

  const { playerId, delta } = action.action;
  const timestamp = now();

  const player = findPlayer(state, playerId);
  if (!player) return { state, events: [] };

  const newScore = player.score + delta;
  const newState = updatePlayer(state, playerId, { score: newScore });

  return {
    state: newState,
    events: [
      {
        type: 'scoreChanged',
        playerId,
        newScore,
        timestamp,
      },
    ],
  };
}

function handleSetPhase(state: GameState, action: GameAction): StateTransitionResult {
  if (action.action.type !== 'setPhase') return { state, events: [] };

  const { phaseId } = action.action;
  const timestamp = now();

  const oldPhase = state.currentPhase;

  return {
    state: {
      ...state,
      currentPhase: phaseId,
      phaseStartedAt: timestamp,
    },
    events: [
      {
        type: 'phaseChanged',
        from: oldPhase,
        to: phaseId,
        timestamp,
      },
    ],
  };
}

function handleRoll(state: GameState, action: GameAction): StateTransitionResult {
  if (action.action.type !== 'roll') return { state, events: [] };

  const { dieId } = action.action;
  const timestamp = now();

  const dieState = state.dice?.[dieId];
  if (!dieState) return { state, events: [] };

  // Random roll
  const faceIndex = Math.floor(Math.random() * dieState.definition.faces.length);
  const result = dieState.definition.faces[faceIndex];

  const newState: GameState = {
    ...state,
    dice: {
      ...state.dice,
      [dieId]: {
        ...dieState,
        currentFace: result,
        rolledAt: timestamp,
      },
    },
  };

  return {
    state: newState,
    events: [{ type: 'dieRolled', dieId, result, timestamp }],
  };
}

// =============================================================================
// AUTOMATIC PHASE TRANSITIONS
// =============================================================================

function checkAutoTransitions(
  state: GameState,
  events: GameEvent[],
  context: GameContext
): StateTransitionResult {
  if (state.status !== 'playing') {
    return { state, events };
  }

  const phase = context.definition.phases.find((p) => p.id === state.currentPhase);
  if (!phase) {
    return { state, events };
  }

  // Check each automatic transition
  for (const transition of phase.transitions) {
    if (!transition.automatic) continue;

    if (checkTransitionCondition(state, transition.condition)) {
      const timestamp = now();

      // Perform the transition
      const newState: GameState = {
        ...state,
        currentPhase: transition.to,
        phaseStartedAt: timestamp,
      };

      const newEvents: GameEvent[] = [
        ...events,
        {
          type: 'phaseChanged',
          from: phase.id,
          to: transition.to,
          timestamp,
        },
      ];

      // Handle phase entry actions
      const result = handlePhaseEntry(newState, transition.to, context);

      // Recursively check for more transitions
      return checkAutoTransitions(
        result.state,
        [...newEvents, ...result.events],
        context
      );
    }
  }

  return { state, events };
}

/**
 * Handle automatic actions when entering a phase
 */
function handlePhaseEntry(
  state: GameState,
  phaseId: string,
  context: GameContext
): StateTransitionResult {
  const timestamp = now();
  const events: GameEvent[] = [];
  let newState = state;

  switch (phaseId) {
    case 'PROMPT': {
      // Judge draws a black card to prompt slot
      const blackDeckId = Object.entries(context.definition.decks).find(
        ([, def]) => def.cardType === 'black'
      )?.[0];

      if (blackDeckId && newState.decks[blackDeckId]) {
        const { deck: newDeck, cards } = drawCards(newState.decks[blackDeckId], 1);
        newState = {
          ...newState,
          decks: { ...newState.decks, [blackDeckId]: newDeck },
          globalSlots: { ...newState.globalSlots, prompt: cards },
        };

        if (newState.roles.judge) {
          events.push({
            type: 'cardDrawn',
            playerId: newState.roles.judge,
            deckId: blackDeckId,
            count: 1,
            timestamp,
          });
        }
      }
      break;
    }

    case 'RESOLVE': {
      // Discard all submissions
      const whiteDeckId = Object.entries(context.definition.decks).find(
        ([, def]) => def.cardType === 'white'
      )?.[0];

      if (whiteDeckId) {
        const allSubmittedCards: Card[] = [];
        for (const submission of Object.values(newState.roundState.submissions)) {
          allSubmittedCards.push(...submission.cards);
        }

        if (newState.decks[whiteDeckId]) {
          newState = {
            ...newState,
            decks: {
              ...newState.decks,
              [whiteDeckId]: discardCards(newState.decks[whiteDeckId], allSubmittedCards),
            },
          };
        }
      }

      // Discard prompt card
      const blackDeckId = Object.entries(context.definition.decks).find(
        ([, def]) => def.cardType === 'black'
      )?.[0];

      const promptCard = newState.globalSlots['prompt']?.[0];
      if (blackDeckId && promptCard && newState.decks[blackDeckId]) {
        newState = {
          ...newState,
          decks: {
            ...newState.decks,
            [blackDeckId]: discardCards(newState.decks[blackDeckId], [promptCard]),
          },
          globalSlots: {
            ...newState.globalSlots,
            prompt: [],
          },
        };
      }

      // Draw cards back to hand size for all players
      const whiteDeckIdForDraw = Object.entries(context.definition.decks).find(
        ([, def]) => def.cardType === 'white'
      )?.[0];

      if (whiteDeckIdForDraw) {
        const deck = newState.decks[whiteDeckIdForDraw];
        let currentDeck = deck;

        const updatedPlayers = newState.players.map((player) => {
          if (player.presence !== 'active') return player;

          const cardsNeeded = newState.settings.handSize - player.hand.length;
          if (cardsNeeded <= 0) return player;

          const { deck: newDeck, cards } = drawCards(currentDeck, cardsNeeded);
          currentDeck = newDeck;

          return addCardsToHand(player, cards);
        });

        newState = {
          ...newState,
          decks: { ...newState.decks, [whiteDeckIdForDraw]: currentDeck },
          players: updatedPlayers,
        };
      }

      // Rotate judge
      const currentJudge = newState.roles.judge;
      if (currentJudge) {
        const nextJudge = getNextInRotation(
          newState.turnOrder,
          currentJudge,
          newState.players
        );

        if (nextJudge) {
          newState = {
            ...newState,
            roles: { ...newState.roles, judge: nextJudge },
          };
          events.push({ type: 'judgeChanged', playerId: nextJudge, timestamp });
        }
      }

      // Increment round and reset submissions (preserve winnerId for result display)
      newState = {
        ...newState,
        round: newState.round + 1,
        roundState: {
          submissions: {},
          winnerId: newState.roundState.winnerId, // Preserve for round result
        },
      };

      events.push({ type: 'roundEnded', round: newState.round - 1, timestamp });

      // Check end condition
      if (checkEndCondition(newState)) {
        const finalScores: Record<string, number> = {};
        newState.players.forEach((p) => {
          finalScores[p.id] = p.score;
        });

        const winner = newState.players.reduce((best, player) =>
          player.score > (best?.score ?? -1) ? player : best
        , newState.players[0]);

        newState = {
          ...newState,
          status: 'ended',
          endedAt: timestamp,
          currentPhase: 'END',
        };

        events.push({
          type: 'gameEnded',
          winner: winner?.id,
          finalScores,
          timestamp,
        });
      }
      break;
    }
  }

  return { state: newState, events };
}

/**
 * Check if game end condition is met
 */
function checkEndCondition(state: GameState): boolean {
  switch (state.settings.endCondition) {
    case 'points': {
      const targetPoints = state.settings.endValue ?? 10;
      return state.players.some((p) => p.score >= targetPoints);
    }

    case 'rounds': {
      const targetRounds = state.settings.endValue ?? 10;
      return state.round > targetRounds;
    }

    case 'none':
    default:
      return false;
  }
}

// =============================================================================
// GAME INITIALIZATION
// =============================================================================

/**
 * Create initial game state for lobby
 */
export function createGame(
  gameId: string,
  hostId: string,
  definition: GameDefinition,
  settings?: Partial<GameState['settings']>
): GameState {
  const timestamp = now();

  return {
    gameId,
    definitionId: definition.id,
    status: 'lobby',
    createdAt: timestamp,

    settings: {
      ...definition.defaultSettings,
      ...settings,
    },
    activeVariants: definition.defaultSettings.activeVariants,

    roles: {
      lead: hostId,
      judge: null,
    },

    players: [],
    turnOrder: [],

    currentPhase: 'LOBBY',
    phaseStartedAt: timestamp,
    round: 0,

    decks: {},
    globalSlots: {},
    roundState: { submissions: {} },
  };
}

/**
 * Add a player to the game
 */
export function addPlayer(
  state: GameState,
  player: Omit<Player, 'hand' | 'slots' | 'score' | 'lastSeen'>
): StateTransitionResult {
  const timestamp = now();

  const newPlayer: Player = {
    ...player,
    hand: [],
    slots: {},
    score: 0,
    lastSeen: timestamp,
  };

  return {
    state: {
      ...state,
      players: [...state.players, newPlayer],
    },
    events: [{ type: 'playerJoined', player: newPlayer, timestamp }],
  };
}

/**
 * Remove a player from the game
 */
export function removePlayer(
  state: GameState,
  playerId: string,
  reason: 'left' | 'kicked' | 'disconnected'
): StateTransitionResult {
  const timestamp = now();

  const newState = updatePlayer(state, playerId, { presence: 'left' });

  // Handle lead succession if needed
  const player = findPlayer(state, playerId);
  let finalState = newState;
  const events: GameEvent[] = [{ type: 'playerLeft', playerId, reason, timestamp }];

  if (player?.isLead) {
    const newLead = assignNewLead(finalState.players);
    if (newLead) {
      finalState = updatePlayer(finalState, newLead, { isLead: true });
      finalState = updatePlayer(finalState, playerId, { isLead: false });
      finalState = {
        ...finalState,
        roles: { ...finalState.roles, lead: newLead },
      };
      events.push({ type: 'leadChanged', playerId: newLead, timestamp });
    }
  }

  return { state: finalState, events };
}

/**
 * Claim lead when current lead is disconnected
 */
function handleClaimLead(
  state: GameState,
  action: GameAction
): StateTransitionResult {
  const timestamp = now();
  const claimerId = action.playerId;

  // Find current lead
  const currentLead = state.players.find((p) => p.isLead);

  // Can only claim if current lead is disconnected
  if (currentLead && currentLead.presence === 'active') {
    // Lead is still active - can't claim without their permission
    return { state, events: [] };
  }

  // Find claimer
  const claimer = findPlayer(state, claimerId);
  if (!claimer || claimer.presence !== 'active') {
    return { state, events: [] };
  }

  // Transfer lead
  let newState = state;
  if (currentLead) {
    newState = updatePlayer(newState, currentLead.id, { isLead: false });
  }
  newState = updatePlayer(newState, claimerId, { isLead: true });
  newState = {
    ...newState,
    roles: { ...newState.roles, lead: claimerId },
  };

  return {
    state: newState,
    events: [{ type: 'leadChanged', playerId: claimerId, timestamp }],
  };
}

/**
 * Transfer lead to another player (only current lead can do this)
 */
function handleTransferLead(
  state: GameState,
  action: GameAction
): StateTransitionResult {
  const timestamp = now();
  const currentLeadId = action.playerId;
  const targetPlayerId = (action.action as { type: 'transferLead'; targetPlayerId: string }).targetPlayerId;

  // Verify caller is current lead
  const currentLead = findPlayer(state, currentLeadId);
  if (!currentLead?.isLead) {
    return { state, events: [] };
  }

  // Find target player
  const targetPlayer = findPlayer(state, targetPlayerId);
  if (!targetPlayer || targetPlayer.presence !== 'active') {
    return { state, events: [] };
  }

  // Transfer lead
  let newState = updatePlayer(state, currentLeadId, { isLead: false });
  newState = updatePlayer(newState, targetPlayerId, { isLead: true });
  newState = {
    ...newState,
    roles: { ...newState.roles, lead: targetPlayerId },
  };

  return {
    state: newState,
    events: [{ type: 'leadChanged', playerId: targetPlayerId, timestamp }],
  };
}
