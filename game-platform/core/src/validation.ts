/**
 * Action validation for the game platform
 * All validation is pure - no side effects
 */

import type {
  GameState,
  GameAction,
  ValidationResult,
  GameDefinition,
  PhaseDefinition,
  ActionType,
  Player,
  Action,
} from './types';
import { findPlayer, getSubmitters, findCardInHand } from './utils';

// =============================================================================
// MAIN VALIDATION FUNCTION
// =============================================================================

/**
 * Validate an action against current game state
 */
export function validateAction(
  state: GameState,
  action: GameAction,
  definition: GameDefinition
): ValidationResult {
  // 1. Check game status
  const statusResult = validateGameStatus(state, action.action);
  if (!statusResult.valid) return statusResult;

  // 2. Check phase permissions
  const phaseResult = validatePhasePermission(state, action, definition);
  if (!phaseResult.valid) return phaseResult;

  // 3. Check player permissions
  const playerResult = validatePlayerPermission(state, action);
  if (!playerResult.valid) return playerResult;

  // 4. Check action-specific rules
  const actionResult = validateActionSpecific(state, action, definition);
  if (!actionResult.valid) return actionResult;

  return { valid: true };
}

// =============================================================================
// STATUS VALIDATION
// =============================================================================

function validateGameStatus(state: GameState, action: Action): ValidationResult {
  // Actions allowed regardless of status
  const alwaysAllowed: ActionType[] = ['setPresence', 'claimLead', 'transferLead'];

  // Actions allowed in lobby
  const lobbyAllowed: ActionType[] = ['startGame', 'kickPlayer', 'setPresence'];

  // Actions allowed when paused
  const pausedAllowed: ActionType[] = ['resumeGame', 'endGame', 'kickPlayer', 'setPresence'];

  // Actions allowed when ended
  const endedAllowed: ActionType[] = ['setPresence', 'restartGame'];

  if (alwaysAllowed.includes(action.type)) {
    return { valid: true };
  }

  switch (state.status) {
    case 'lobby':
      if (!lobbyAllowed.includes(action.type)) {
        return { valid: false, error: `Cannot perform ${action.type} in lobby` };
      }
      break;

    case 'paused':
      if (!pausedAllowed.includes(action.type)) {
        return { valid: false, error: 'Game is paused' };
      }
      break;

    case 'ended':
      if (!endedAllowed.includes(action.type)) {
        return { valid: false, error: 'Game has ended' };
      }
      break;

    case 'playing':
      // Most actions are allowed when playing
      break;
  }

  return { valid: true };
}

// =============================================================================
// PHASE VALIDATION
// =============================================================================

function validatePhasePermission(
  state: GameState,
  action: GameAction,
  definition: GameDefinition
): ValidationResult {
  // Skip phase check for administrative actions
  const adminActions: ActionType[] = [
    'startGame',
    'pauseGame',
    'resumeGame',
    'endGame',
    'restartGame',
    'kickPlayer',
    'setPresence',
  ];

  if (adminActions.includes(action.action.type)) {
    return { valid: true };
  }

  // Find current phase definition
  const phase = definition.phases.find((p) => p.id === state.currentPhase);
  if (!phase) {
    return { valid: false, error: `Unknown phase: ${state.currentPhase}` };
  }

  // Check if action is allowed in this phase
  if (!phase.allowedActions.includes(action.action.type)) {
    return {
      valid: false,
      error: `Action ${action.action.type} not allowed in ${phase.name} phase`,
    };
  }

  return { valid: true };
}

// =============================================================================
// PLAYER PERMISSION VALIDATION
// =============================================================================

function validatePlayerPermission(
  state: GameState,
  action: GameAction
): ValidationResult {
  const player = findPlayer(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Check if player can act based on action type
  switch (action.action.type) {
    case 'startGame':
    case 'pauseGame':
    case 'resumeGame':
    case 'endGame':
    case 'kickPlayer':
      // Only lead can perform administrative actions
      if (!player.isLead) {
        return { valid: false, error: 'Only the game lead can perform this action' };
      }
      break;

    case 'selectWinner':
      // Only judge can select winner
      if (player.id !== state.roles.judge) {
        return { valid: false, error: 'Only the judge can select a winner' };
      }
      break;

    case 'submitCards':
    case 'play':
      // Only submitters can play cards (not the judge)
      if (player.id === state.roles.judge) {
        return { valid: false, error: 'Judge cannot submit cards' };
      }
      if (player.presence !== 'active') {
        return { valid: false, error: 'Only active players can submit cards' };
      }
      break;

    case 'draw':
      // Only active players can draw
      if (player.presence !== 'active') {
        return { valid: false, error: 'Only active players can draw cards' };
      }
      break;

    case 'setPresence':
      // Players can only set their own presence
      break;
  }

  return { valid: true };
}

// =============================================================================
// ACTION-SPECIFIC VALIDATION
// =============================================================================

function validateActionSpecific(
  state: GameState,
  action: GameAction,
  definition: GameDefinition
): ValidationResult {
  const player = findPlayer(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  switch (action.action.type) {
    case 'startGame':
      return validateStartGame(state, definition);

    case 'draw':
      return validateDraw(state, action.action);

    case 'play':
      return validatePlay(state, player, action.action, definition);

    case 'submitCards':
      return validateSubmitCards(state, player, action.action);

    case 'selectWinner':
      return validateSelectWinner(state, action.action);

    case 'kickPlayer':
      return validateKickPlayer(state, action);

    default:
      return { valid: true };
  }
}

function validateStartGame(state: GameState, definition: GameDefinition): ValidationResult {
  if (state.status !== 'lobby') {
    return { valid: false, error: 'Game has already started' };
  }

  const activePlayers = state.players.filter((p) => p.presence === 'active');
  if (activePlayers.length < definition.minPlayers) {
    return {
      valid: false,
      error: `Need at least ${definition.minPlayers} players to start`,
    };
  }

  if (activePlayers.length > definition.maxPlayers) {
    return {
      valid: false,
      error: `Maximum ${definition.maxPlayers} players allowed`,
    };
  }

  return { valid: true };
}

function validateDraw(state: GameState, action: { deckId: string; count: number }): ValidationResult {
  const deck = state.decks[action.deckId];
  if (!deck) {
    return { valid: false, error: `Deck ${action.deckId} not found` };
  }

  if (action.count <= 0) {
    return { valid: false, error: 'Must draw at least 1 card' };
  }

  const totalCards = deck.cards.length + deck.discardPile.length;
  if (totalCards < action.count) {
    return { valid: false, error: 'Not enough cards in deck' };
  }

  return { valid: true };
}

function validatePlay(
  state: GameState,
  player: Player,
  action: { cardId: string; fromZone: string; toSlot: string },
  definition: GameDefinition
): ValidationResult {
  // Check card exists in player's hand
  const card = findCardInHand(player, action.cardId);
  if (!card) {
    return { valid: false, error: 'Card not in hand' };
  }

  // Find slot definition
  const slotDef = definition.slots.find((s) => s.id === action.toSlot);
  if (!slotDef) {
    return { valid: false, error: `Unknown slot: ${action.toSlot}` };
  }

  // Check slot capacity
  const currentSlotCards = player.slots[action.toSlot] ?? [];
  if (currentSlotCards.length >= slotDef.capacity) {
    return { valid: false, error: 'Slot is full' };
  }

  // Check allowed card types
  if (slotDef.allowedCardTypes && !slotDef.allowedCardTypes.includes(card.type)) {
    return { valid: false, error: `Card type ${card.type} not allowed in this slot` };
  }

  return { valid: true };
}

function validateSubmitCards(
  state: GameState,
  player: Player,
  action: { cardIds: string[] }
): ValidationResult {
  // Check if already submitted
  if (state.roundState.submissions[player.id]) {
    return { valid: false, error: 'Already submitted cards this round' };
  }

  // Check all cards exist in hand
  for (const cardId of action.cardIds) {
    const card = findCardInHand(player, cardId);
    if (!card) {
      return { valid: false, error: `Card ${cardId} not in hand` };
    }
  }

  // Check pick count matches prompt
  const promptCard = state.globalSlots['prompt']?.[0];
  if (promptCard) {
    const requiredPick = promptCard.properties.pick ?? 1;
    if (action.cardIds.length !== requiredPick) {
      return {
        valid: false,
        error: `Must submit exactly ${requiredPick} card(s)`,
      };
    }
  }

  return { valid: true };
}

function validateSelectWinner(
  state: GameState,
  action: { playerId: string }
): ValidationResult {
  // Check winner is a valid submitter
  const submission = state.roundState.submissions[action.playerId];
  if (!submission) {
    return { valid: false, error: 'Selected player did not submit cards' };
  }

  return { valid: true };
}

function validateKickPlayer(state: GameState, action: GameAction): ValidationResult {
  if (action.action.type !== 'kickPlayer') return { valid: true };

  const targetPlayer = findPlayer(state, action.action.playerId);
  if (!targetPlayer) {
    return { valid: false, error: 'Player not found' };
  }

  if (targetPlayer.isLead) {
    return { valid: false, error: 'Cannot kick the game lead' };
  }

  return { valid: true };
}

// =============================================================================
// PHASE TRANSITION VALIDATION
// =============================================================================

/**
 * Check if a phase transition condition is met
 */
export function checkTransitionCondition(
  state: GameState,
  condition: { type: string; action?: string }
): boolean {
  switch (condition.type) {
    case 'allSubmitted': {
      const submitters = getSubmitters(state);
      const submitted = Object.keys(state.roundState.submissions);
      return submitters.every((p) => submitted.includes(p.id));
    }

    case 'judgeSelected':
      return state.roundState.winnerId !== undefined;

    case 'timeout':
      // Timeout is handled externally
      return false;

    case 'manual':
      // Manual transitions require explicit action
      return false;

    case 'action':
      // Checked when specific action is performed
      return false;

    default:
      return false;
  }
}
