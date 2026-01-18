/**
 * Core types for the Full Uproar Game Platform
 * Based on game-platform-design.md v1.0
 */

// =============================================================================
// PRIMITIVE TYPES
// =============================================================================

export type Timestamp = number; // Unix milliseconds

// =============================================================================
// CARDS
// =============================================================================

/**
 * The atomic unit of card games. Each card has an ID, a type, and arbitrary properties.
 */
export interface Card {
  id: string;
  type: string; // e.g., "white", "black", "action"
  properties: CardProperties;
}

export interface CardProperties {
  text?: string;
  image?: string;
  value?: number;
  category?: string;
  pick?: number; // for prompt cards requiring multiple responses
  blanks?: number; // number of blanks in text (may differ from pick)
  [key: string]: unknown; // game-specific properties
}

/**
 * Collections of cards that can be combined. Supports base games and expansions.
 */
export interface CardPack {
  id: string;
  name: string;
  description?: string;
  official: boolean; // licensed vs custom content
  cards: {
    [deckType: string]: Card[]; // e.g., { white: [...], black: [...] }
  };
}

/**
 * Named collections of cards that form draw piles.
 */
export interface Deck {
  id: string;
  cards: Card[]; // ordered, index 0 = top
  discardPile: Card[];
}

// =============================================================================
// ZONES & SLOTS
// =============================================================================

/**
 * Where cards can exist during play
 */
export type ZoneType = 'hand' | 'slot' | 'pile';

/**
 * Visibility rules for card zones
 */
export type Visibility = 'public' | 'owner' | 'judge' | 'hidden';

/**
 * Scope of a slot - global or per-player
 */
export type SlotScope = 'global' | 'player';

/**
 * Fixed positions where cards can be placed. The key abstraction for game-specific mechanics.
 */
export interface SlotDefinition {
  id: string;
  name: string;
  scope: SlotScope;
  capacity: number; // max cards allowed
  ordered: boolean; // does order matter?
  visibility: Visibility;
  allowedCardTypes?: string[]; // filter what can go here
}

// =============================================================================
// DICE
// =============================================================================

export interface DieFace {
  value: number | string;
  label?: string;
  image?: string;
}

export interface DieDef {
  id: string;
  name: string;
  faces: DieFace[];
}

export interface DieState {
  definition: DieDef;
  currentFace?: DieFace;
  rolledAt?: Timestamp;
}

// =============================================================================
// PLAYERS
// =============================================================================

export type PlayerPresence =
  | 'active' // connected and playing
  | 'away' // temporarily unavailable, skip turns
  | 'disconnected' // connection lost, may return
  | 'left'; // intentionally quit

export interface Player {
  id: string;
  name: string;
  avatarUrl?: string;

  // Permissions
  isLead: boolean; // administrative control

  // Presence
  presence: PlayerPresence;
  lastSeen: Timestamp;
  joinedAt: Timestamp;

  // Game state (populated during play)
  hand: Card[];
  slots: {
    [slotId: string]: Card[];
  };
  score: number;
}

// =============================================================================
// ROLES
// =============================================================================

/**
 * Two distinct roles: Lead (admin) and Judge (rotates)
 */
export interface GameRoles {
  lead: string; // playerId
  judge: string | null; // playerId (current round), null in lobby
}

// =============================================================================
// GAME CONFIGURATION
// =============================================================================

export type EndCondition = 'none' | 'points' | 'rounds';

export interface GameSettings {
  handSize: number;
  endCondition: EndCondition;
  endValue?: number; // points or rounds to win

  // Timing (optional, for non-VC games)
  submitTimeout?: number; // seconds
  judgeTimeout?: number; // seconds

  // Selected card packs
  packIds: string[];

  // Active variants
  activeVariants: string[];
}

export interface VariantDefinition {
  id: string;
  name: string;
  description: string;
  default: boolean;
}

// =============================================================================
// PHASES
// =============================================================================

/**
 * Who can act in a phase
 */
export type ActiveRole = 'judge' | 'submitters' | 'all' | 'lead';

/**
 * Condition that triggers a phase transition
 */
export type TransitionCondition =
  | { type: 'allSubmitted' }
  | { type: 'judgeSelected' }
  | { type: 'timeout' }
  | { type: 'action'; action: ActionType }
  | { type: 'manual' }; // lead triggers manually

export interface PhaseTransition {
  to: string; // target phase id
  condition: TransitionCondition;
  automatic: boolean; // triggered automatically or requires action
}

export interface PhaseTimeout {
  seconds: number;
  action: 'auto-transition' | 'skip-inactive' | 'pause';
}

export interface PhaseDefinition {
  id: string;
  name: string;

  // Who can act in this phase
  activeRoles: ActiveRole[];

  // Valid actions in this phase
  allowedActions: ActionType[];

  // Transition rules
  transitions: PhaseTransition[];

  // Timeout behavior (optional)
  timeout?: PhaseTimeout;
}

// =============================================================================
// GAME DEFINITION
// =============================================================================

export interface DeckDefinition {
  displayName: string;
  cardType: string;
}

export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;

  // Deck configuration
  decks: {
    [deckId: string]: DeckDefinition;
  };

  // Slot definitions
  slots: SlotDefinition[];

  // Default settings
  defaultSettings: GameSettings;

  // Available variants
  variants: VariantDefinition[];

  // Phase definitions
  phases: PhaseDefinition[];

  // Starting phase
  initialPhase: string;
}

// =============================================================================
// GAME STATE
// =============================================================================

export type GameStatus = 'lobby' | 'playing' | 'paused' | 'ended';

export interface Submission {
  cards: Card[];
  submittedAt: Timestamp;
}

export interface RoundState {
  submissions: {
    [playerId: string]: Submission;
  };
  shuffledOrder?: string[]; // anonymized submission order for judging (playerIds)
  winnerId?: string;
}

export interface GameState {
  // Metadata
  gameId: string;
  definitionId: string;
  status: GameStatus;
  createdAt: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;

  // Configuration (locked at game start)
  settings: GameSettings;
  activeVariants: string[];

  // Roles
  roles: GameRoles;

  // Players
  players: Player[];
  turnOrder: string[]; // playerIds in rotation order

  // Phase
  currentPhase: string;
  phaseStartedAt: Timestamp;
  round: number;

  // Decks
  decks: {
    [deckId: string]: Deck;
  };

  // Global slots
  globalSlots: {
    [slotId: string]: Card[];
  };

  // Dice (if applicable)
  dice?: {
    [dieId: string]: DieState;
  };

  // Round-specific state
  roundState: RoundState;

  // History (optional, for replay/debugging)
  history?: GameEvent[];
}

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * All possible action types (for type narrowing)
 */
export type ActionType =
  | 'draw'
  | 'play'
  | 'discard'
  | 'reveal'
  | 'hide'
  | 'shuffle'
  | 'roll'
  | 'selectWinner'
  | 'setPhase'
  | 'nextTurn'
  | 'score'
  | 'startGame'
  | 'pauseGame'
  | 'resumeGame'
  | 'endGame'
  | 'kickPlayer'
  | 'setPresence'
  | 'submitCards';

/**
 * Union type of all possible actions
 */
export type Action =
  | { type: 'draw'; deckId: string; count: number; toZone: 'hand' | string }
  | { type: 'play'; cardId: string; fromZone: string; toSlot: string; position?: number }
  | { type: 'discard'; cardId: string; fromZone: string; toDeckId?: string }
  | { type: 'reveal'; cardId: string }
  | { type: 'hide'; cardId: string }
  | { type: 'shuffle'; deckId: string }
  | { type: 'roll'; dieId: string }
  | { type: 'selectWinner'; playerId: string }
  | { type: 'setPhase'; phaseId: string }
  | { type: 'nextTurn' }
  | { type: 'score'; playerId: string; delta: number }
  // Administrative
  | { type: 'startGame' }
  | { type: 'pauseGame' }
  | { type: 'resumeGame' }
  | { type: 'endGame' }
  | { type: 'kickPlayer'; playerId: string }
  // Player presence
  | { type: 'setPresence'; presence: PlayerPresence }
  // CAH-specific compound action
  | { type: 'submitCards'; cardIds: string[] };

/**
 * A game action with metadata
 */
export interface GameAction {
  id: string;
  playerId: string; // who performed the action
  action: Action;
  timestamp: Timestamp;
}

// =============================================================================
// VALIDATION
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// =============================================================================
// EVENTS
// =============================================================================

export interface AnonymizedSubmission {
  index: number; // display order (shuffled)
  cards: Card[];
  // playerId intentionally omitted until winner revealed
}

/**
 * Union type of all game events
 */
export type GameEvent =
  | { type: 'gameCreated'; gameId: string; hostId: string; timestamp: Timestamp }
  | { type: 'playerJoined'; player: Player; timestamp: Timestamp }
  | { type: 'playerLeft'; playerId: string; reason: 'left' | 'kicked' | 'disconnected'; timestamp: Timestamp }
  | { type: 'playerPresenceChanged'; playerId: string; presence: PlayerPresence; timestamp: Timestamp }
  | { type: 'gameStarted'; timestamp: Timestamp }
  | { type: 'phaseChanged'; from: string; to: string; timestamp: Timestamp }
  | { type: 'cardDrawn'; playerId: string; deckId: string; count: number; timestamp: Timestamp }
  | { type: 'cardPlayed'; playerId: string; cardId: string; toSlot: string; timestamp: Timestamp }
  | { type: 'cardDiscarded'; cardId: string; timestamp: Timestamp }
  | { type: 'submissionsRevealed'; submissions: AnonymizedSubmission[]; timestamp: Timestamp }
  | { type: 'winnerSelected'; playerId: string; cardIds: string[]; timestamp: Timestamp }
  | { type: 'scoreChanged'; playerId: string; newScore: number; timestamp: Timestamp }
  | { type: 'judgeChanged'; playerId: string; timestamp: Timestamp }
  | { type: 'leadChanged'; playerId: string; timestamp: Timestamp }
  | { type: 'roundEnded'; round: number; timestamp: Timestamp }
  | { type: 'gameEnded'; winner?: string; finalScores: Record<string, number>; timestamp: Timestamp }
  | { type: 'gamePaused'; timestamp: Timestamp }
  | { type: 'gameResumed'; timestamp: Timestamp }
  | { type: 'dieRolled'; dieId: string; result: DieFace; timestamp: Timestamp };

// =============================================================================
// NETWORKING
// =============================================================================

/**
 * Client → Server message format
 */
export type ClientMessage =
  | { type: 'createGame'; playerName: string }
  | { type: 'joinGame'; playerName: string }
  | { type: 'leaveGame' }
  | { type: 'action'; action: Action };

/**
 * Server → Client message format
 */
export type ServerMessage =
  | { type: 'gameState'; state: GameState | null }
  | { type: 'joined'; playerId: string; gameState: GameState }
  | { type: 'left' }
  | { type: 'event'; event: GameEvent }
  | { type: 'error'; message: string };

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Result of a state transition - new state plus emitted events
 */
export interface StateTransitionResult {
  state: GameState;
  events: GameEvent[];
}

/**
 * Game context for accessing definitions during state transitions
 */
export interface GameContext {
  definition: GameDefinition;
  packs: CardPack[];
}
