/**
 * Full Uproar Game Platform - Core Package
 *
 * A flexible game engine for card and dice games.
 */

// Types
export type {
  // Cards
  Card,
  CardProperties,
  CardPack,
  Deck,

  // Zones & Slots
  ZoneType,
  Visibility,
  SlotScope,
  SlotDefinition,

  // Dice
  DieFace,
  DieDef,
  DieState,

  // Players
  PlayerPresence,
  Player,
  GameRoles,

  // Game Configuration
  EndCondition,
  GameSettings,
  VariantDefinition,
  GameDefinition,
  DeckDefinition,

  // Phases
  ActiveRole,
  TransitionCondition,
  PhaseTransition,
  PhaseTimeout,
  PhaseDefinition,

  // Game State
  GameStatus,
  Submission,
  RoundState,
  GameState,

  // Actions
  ActionType,
  Action,
  GameAction,

  // Validation
  ValidationResult,

  // Events
  AnonymizedSubmission,
  GameEvent,

  // Networking
  ClientMessage,
  ServerMessage,

  // Utility
  StateTransitionResult,
  GameContext,
  Timestamp,
} from './types.js';

// State Machine
export {
  applyAction,
  createGame,
  addPlayer,
  removePlayer,
} from './state-machine.js';

// Validation
export {
  validateAction,
  checkTransitionCondition,
} from './validation.js';

// Utilities
export {
  shuffle,
  drawCards,
  discardCards,
  shuffleDeck,
  reshuffleDiscardIntoDeck,
  findPlayer,
  updatePlayer,
  getActivePlayers,
  getSubmitters,
  getNextInRotation,
  assignNewLead,
  findCardInHand,
  removeCardFromHand,
  addCardsToHand,
  mergePacksIntoDecks,
  generateId,
  now,
  deepClone,
  removeWhere,
  removeById,
} from './utils.js';

// Games
export {
  CAH_DEFINITION,
  createPlaceholderPack,
  interpolatePrompt,
  getPickCount,
  isValidSubmission,
} from './games/cah-definition.js';

// Card Packs
export {
  getCAHPack,
  getAllPacks,
  combinePacks,
} from './games/cah-packs.js';
