/**
 * FULL UPROAR GAME DSL
 *
 * A recursive, scope-based domain-specific language for defining card games.
 *
 * Core Principle: EVERYTHING IS A SCOPE
 *
 * A Scope represents a bounded execution context with:
 * - Entry conditions (when can we enter?)
 * - Loop semantics (iterate over what? until when?)
 * - Exit conditions (early termination)
 * - Children (nested scopes or atomic actions)
 * - Local variables (state scoped to this context)
 *
 * This recursive structure allows infinite nesting:
 * Game → Round → Turn → Phase → SubPhase → Action
 *
 * Each level follows the IDENTICAL pattern, giving us:
 * 1. Uniform reasoning about game state
 * 2. Composability at every level
 * 3. Clear termination semantics
 * 4. Natural visual representation (nested blocks)
 */

// =============================================================================
// IDENTIFIERS & REFERENCES
// =============================================================================

/** Unique identifier for any entity in the game */
export type EntityId = string;

/** Reference to a variable in scope */
export type VariableRef = {
  type: 'variable';
  name: string;
  scope?: 'local' | 'parent' | 'game' | 'round' | 'turn';
};

/** Reference to the current iteration value in a loop */
export type IteratorRef = {
  type: 'iterator';
  scopeId?: string; // Which scope's iterator (defaults to nearest)
};

/** Reference to a player */
export type PlayerRef =
  | { type: 'player'; id: 'current' | 'next' | 'previous' | 'all' | 'others' }
  | { type: 'player'; id: 'specific'; playerId: EntityId }
  | { type: 'player'; id: 'byIndex'; index: Expression };

/** Reference to a zone (where cards can be) */
export type ZoneRef =
  | { type: 'zone'; id: 'deck' | 'discard' | 'table' | 'hand'; owner?: PlayerRef }
  | { type: 'zone'; id: 'custom'; name: string; owner?: PlayerRef };

/** Reference to cards */
export type CardRef =
  | { type: 'card'; id: 'top' | 'bottom' | 'random'; from: ZoneRef; count?: Expression }
  | { type: 'card'; id: 'all'; from: ZoneRef; filter?: Expression }
  | { type: 'card'; id: 'chosen'; by: PlayerRef; from: ZoneRef; count: Expression; filter?: Expression }
  | { type: 'card'; id: 'specific'; cardId: EntityId };

// =============================================================================
// EXPRESSIONS - The Computation Language
// =============================================================================

/**
 * Expressions are pure computations that don't mutate state.
 * They can reference game state and compute values.
 *
 * This is essentially a mini functional language embedded in the DSL.
 */
export type Expression =
  // Literals
  | { type: 'literal'; value: number | string | boolean | null }
  | { type: 'list'; items: Expression[] }

  // References
  | VariableRef
  | IteratorRef
  | { type: 'property'; of: Expression; property: string }

  // Arithmetic
  | { type: 'add'; left: Expression; right: Expression }
  | { type: 'subtract'; left: Expression; right: Expression }
  | { type: 'multiply'; left: Expression; right: Expression }
  | { type: 'divide'; left: Expression; right: Expression }
  | { type: 'modulo'; left: Expression; right: Expression }

  // Comparison
  | { type: 'equals'; left: Expression; right: Expression }
  | { type: 'notEquals'; left: Expression; right: Expression }
  | { type: 'greaterThan'; left: Expression; right: Expression }
  | { type: 'lessThan'; left: Expression; right: Expression }
  | { type: 'greaterOrEqual'; left: Expression; right: Expression }
  | { type: 'lessOrEqual'; left: Expression; right: Expression }

  // Logical
  | { type: 'and'; conditions: Expression[] }
  | { type: 'or'; conditions: Expression[] }
  | { type: 'not'; condition: Expression }

  // Conditional
  | { type: 'if'; condition: Expression; then: Expression; else: Expression }

  // Collection operations
  | { type: 'count'; of: Expression }
  | { type: 'sum'; of: Expression; property?: string }
  | { type: 'min'; of: Expression; property?: string }
  | { type: 'max'; of: Expression; property?: string }
  | { type: 'first'; of: Expression }
  | { type: 'last'; of: Expression }
  | { type: 'nth'; of: Expression; index: Expression }
  | { type: 'filter'; collection: Expression; condition: Expression; as?: string }
  | { type: 'map'; collection: Expression; transform: Expression; as?: string }
  | { type: 'any'; collection: Expression; condition: Expression; as?: string }
  | { type: 'all'; collection: Expression; condition: Expression; as?: string }
  | { type: 'contains'; collection: Expression; item: Expression }
  | { type: 'isEmpty'; of: Expression }

  // Game-specific queries
  | { type: 'cards'; in: ZoneRef }
  | { type: 'players'; filter?: 'active' | 'all' | 'withCards' }
  | { type: 'currentPlayer' }
  | { type: 'turnOrder' }
  | { type: 'roundNumber' }
  | { type: 'turnNumber' }

  // String operations
  | { type: 'concat'; parts: Expression[] }
  | { type: 'template'; template: string; values: Record<string, Expression> }

  // Random
  | { type: 'random'; min: Expression; max: Expression }
  | { type: 'randomFrom'; collection: Expression; count?: Expression };

// =============================================================================
// ACTIONS - Atomic State Mutations
// =============================================================================

/**
 * Actions are atomic operations that mutate game state.
 * They are the "leaves" of the execution tree.
 *
 * Every action has:
 * - A clear precondition (validated before execution)
 * - A deterministic effect (what changes)
 * - Optional postcondition (validated after)
 */
export type Action =
  // Card Movement
  | {
      type: 'move';
      cards: CardRef;
      to: ZoneRef;
      position?: 'top' | 'bottom' | 'random' | 'sorted';
      reveal?: boolean;
    }
  | {
      type: 'shuffle';
      zone: ZoneRef;
    }
  | {
      type: 'reveal';
      cards: CardRef;
      to?: PlayerRef; // Who can see (default: all)
    }
  | {
      type: 'hide';
      cards: CardRef;
    }
  | {
      type: 'flip';
      cards: CardRef;
    }

  // Card Properties
  | {
      type: 'setCardProperty';
      cards: CardRef;
      property: string;
      value: Expression;
    }
  | {
      type: 'mark';
      cards: CardRef;
      marker: string;
      value?: Expression;
    }
  | {
      type: 'unmark';
      cards: CardRef;
      marker: string;
    }

  // Variables
  | {
      type: 'set';
      variable: string;
      value: Expression;
      scope?: 'local' | 'game' | 'round' | 'turn' | 'player';
      player?: PlayerRef; // For player-scoped variables
    }
  | {
      type: 'increment';
      variable: string;
      by?: Expression;
      scope?: 'local' | 'game' | 'round' | 'turn' | 'player';
      player?: PlayerRef;
    }
  | {
      type: 'decrement';
      variable: string;
      by?: Expression;
      scope?: 'local' | 'game' | 'round' | 'turn' | 'player';
      player?: PlayerRef;
    }

  // Turn Management
  | {
      type: 'nextPlayer';
    }
  | {
      type: 'skipPlayer';
      count?: Expression;
    }
  | {
      type: 'reverseTurnOrder';
    }
  | {
      type: 'setCurrentPlayer';
      player: PlayerRef;
    }

  // Player Interaction
  | {
      type: 'prompt';
      player: PlayerRef;
      message: Expression;
      choices: ChoiceDefinition[];
      timeout?: Expression; // Seconds
      default?: string; // Choice ID if timeout
      storeIn: string; // Variable to store result
    }
  | {
      type: 'chooseCards';
      player: PlayerRef;
      from: ZoneRef;
      count: Expression | { min: Expression; max: Expression };
      filter?: Expression;
      message?: Expression;
      storeIn: string;
    }
  | {
      type: 'announce';
      message: Expression;
      to?: PlayerRef; // Default: all
    }

  // Zone Management
  | {
      type: 'createZone';
      name: string;
      owner?: PlayerRef;
      visibility?: 'public' | 'private' | 'owner';
    }
  | {
      type: 'destroyZone';
      zone: ZoneRef;
      cardsTo?: ZoneRef;
    }

  // Control Flow (within actions)
  | {
      type: 'conditional';
      if: Expression;
      then: Action[];
      else?: Action[];
    }
  | {
      type: 'forEach';
      collection: Expression;
      as: string;
      do: Action[];
    }

  // Triggers
  | {
      type: 'emit';
      event: string;
      data?: Record<string, Expression>;
    }

  // Meta
  | {
      type: 'log';
      message: Expression;
      level?: 'debug' | 'info' | 'warn';
    }
  | {
      type: 'wait';
      seconds: Expression;
    };

/** A choice in a prompt */
export interface ChoiceDefinition {
  id: string;
  label: Expression;
  enabled?: Expression;
  data?: Record<string, Expression>;
}

// =============================================================================
// SCOPES - The Recursive Structure
// =============================================================================

/**
 * A Scope is the fundamental building block of game structure.
 *
 * Every scope follows the same pattern:
 * 1. Check entry condition
 * 2. Initialize local variables
 * 3. Execute setup actions
 * 4. Loop:
 *    a. Check loop condition (continue or exit?)
 *    b. Execute children in order
 *    c. Execute between-iteration actions
 *    d. Advance iterator (if applicable)
 * 5. Execute cleanup actions
 * 6. Check exit conditions (early termination)
 *
 * This uniform structure means:
 * - Games, Rounds, Turns, and Phases are ALL scopes
 * - They differ only in their iteration semantics
 * - Infinite nesting is natural and well-defined
 */
export interface Scope {
  /** Unique identifier for this scope */
  id: string;

  /** Human-readable name */
  name: string;

  /** What kind of scope this is (affects visual representation) */
  kind: 'game' | 'round' | 'turn' | 'phase' | 'action' | 'custom';

  /** Description for UI */
  description?: string;

  // ---------------------------------------------------------------------------
  // ITERATION SEMANTICS
  // ---------------------------------------------------------------------------

  /**
   * How this scope iterates.
   *
   * - 'once': Execute children once (like a function)
   * - 'while': Loop while condition is true
   * - 'until': Loop until condition becomes true
   * - 'forEach': Iterate over a collection
   * - 'forEachPlayer': Special case - iterate over players in turn order
   * - 'repeat': Execute a fixed number of times
   */
  iterate?:
    | { type: 'once' }
    | { type: 'while'; condition: Expression }
    | { type: 'until'; condition: Expression }
    | { type: 'forEach'; collection: Expression; as: string }
    | { type: 'forEachPlayer'; order?: 'turnOrder' | 'reverse' | 'random'; as?: string }
    | { type: 'repeat'; count: Expression; as?: string };

  /**
   * Maximum iterations (safety limit to prevent infinite loops)
   * Default: 1000 for while/until, collection.length for forEach
   */
  maxIterations?: number;

  // ---------------------------------------------------------------------------
  // CONDITIONS
  // ---------------------------------------------------------------------------

  /** Condition that must be true to enter this scope */
  entryCondition?: Expression;

  /** Conditions that cause immediate exit from this scope */
  exitConditions?: {
    condition: Expression;
    /** What happens when we exit */
    result?: 'win' | 'lose' | 'draw' | 'continue' | 'skip';
    /** Who wins/loses (if applicable) */
    player?: PlayerRef;
    /** Actions to run on exit */
    actions?: Action[];
  }[];

  // ---------------------------------------------------------------------------
  // VARIABLES
  // ---------------------------------------------------------------------------

  /** Variables local to this scope */
  variables?: {
    name: string;
    initialValue: Expression;
  }[];

  // ---------------------------------------------------------------------------
  // LIFECYCLE
  // ---------------------------------------------------------------------------

  /** Actions to run when entering this scope (before first iteration) */
  onEnter?: Action[];

  /** Actions to run after each iteration (before next iteration check) */
  onIteration?: Action[];

  /** Actions to run when exiting this scope (after last iteration or early exit) */
  onExit?: Action[];

  // ---------------------------------------------------------------------------
  // CHILDREN
  // ---------------------------------------------------------------------------

  /**
   * Children can be:
   * - More scopes (recursive nesting)
   * - Actions (leaf nodes)
   *
   * Children execute in order within each iteration.
   */
  children?: (Scope | Action)[];

  // ---------------------------------------------------------------------------
  // TRIGGERS
  // ---------------------------------------------------------------------------

  /**
   * Event handlers that can interrupt normal flow.
   * These are checked after every action.
   */
  triggers?: {
    event: string;
    condition?: Expression;
    actions: Action[];
    interrupt?: boolean; // If true, stops current execution
  }[];
}

// =============================================================================
// GAME DEFINITION
// =============================================================================

/**
 * A complete game definition.
 *
 * This is the root scope plus metadata.
 */
export interface GameDefinition {
  /** Unique identifier */
  id: string;

  /** Game name */
  name: string;

  /** Version for compatibility */
  version: string;

  /** Description */
  description?: string;

  /** Author */
  author?: string;

  // ---------------------------------------------------------------------------
  // PLAYER CONFIGURATION
  // ---------------------------------------------------------------------------

  players: {
    min: number;
    max: number;
    /** Starting resources for each player */
    initial?: {
      variable: string;
      value: Expression;
    }[];
  };

  // ---------------------------------------------------------------------------
  // CARD DEFINITIONS
  // ---------------------------------------------------------------------------

  cardTypes: CardTypeDefinition[];

  /** Default deck composition */
  decks?: {
    name: string;
    cards: {
      type: string;
      count: Expression;
      properties?: Record<string, Expression>;
    }[];
  }[];

  // ---------------------------------------------------------------------------
  // ZONE DEFINITIONS
  // ---------------------------------------------------------------------------

  zones?: {
    name: string;
    /** 'shared' = one for all, 'perPlayer' = one per player */
    scope: 'shared' | 'perPlayer';
    visibility: 'public' | 'private' | 'owner';
    /** Starting cards */
    initial?: CardRef;
  }[];

  // ---------------------------------------------------------------------------
  // GAME STRUCTURE
  // ---------------------------------------------------------------------------

  /** Setup phase (runs once at start) */
  setup: Scope;

  /** Main game loop (the root scope) */
  main: Scope;

  /** Win conditions checked after every action */
  winConditions?: {
    condition: Expression;
    player?: PlayerRef;
    message?: Expression;
  }[];

  // ---------------------------------------------------------------------------
  // GLOBAL TRIGGERS
  // ---------------------------------------------------------------------------

  /** Events that can be triggered anywhere */
  globalTriggers?: {
    event: string;
    condition?: Expression;
    actions: Action[];
  }[];
}

/**
 * Definition of a card type.
 */
export interface CardTypeDefinition {
  /** Unique type identifier */
  type: string;

  /** Display name */
  name: string;

  /** Visual properties */
  display: {
    color?: string;
    textColor?: string;
    template?: string; // For text interpolation
  };

  /** Properties this card type has */
  properties: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'stringList';
    default?: Expression;
    /** For visual editor */
    label?: string;
    placeholder?: string;
  }[];
}

// =============================================================================
// VISUAL EDITOR METADATA
// =============================================================================

/**
 * Metadata for the visual editor.
 * This doesn't affect runtime, only how the editor displays things.
 */
export interface EditorMetadata {
  /** Position in the visual canvas */
  position?: { x: number; y: number };

  /** Visual grouping color */
  color?: string;

  /** Collapsed in editor */
  collapsed?: boolean;

  /** User notes */
  notes?: string;

  /** Icon for this block */
  icon?: string;
}

/**
 * A scope or action with editor metadata attached.
 */
export type WithEditor<T> = T & { _editor?: EditorMetadata };

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isScope(item: Scope | Action): item is Scope {
  return 'kind' in item && 'children' in item;
}

export function isAction(item: Scope | Action): item is Action {
  return !isScope(item);
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/** Create a literal expression */
export const lit = (value: number | string | boolean | null): Expression =>
  ({ type: 'literal', value });

/** Create a variable reference */
export const ref = (name: string, scope?: VariableRef['scope']): Expression =>
  ({ type: 'variable', name, scope });

/** Create an iterator reference */
export const iter = (scopeId?: string): Expression =>
  ({ type: 'iterator', scopeId });

/** Create a property access */
export const prop = (of: Expression, property: string): Expression =>
  ({ type: 'property', of, property });

/** Create an AND condition */
export const and = (...conditions: Expression[]): Expression =>
  ({ type: 'and', conditions });

/** Create an OR condition */
export const or = (...conditions: Expression[]): Expression =>
  ({ type: 'or', conditions });

/** Create a NOT condition */
export const not = (condition: Expression): Expression =>
  ({ type: 'not', condition });

/** Create an equality check */
export const eq = (left: Expression, right: Expression): Expression =>
  ({ type: 'equals', left, right });

/** Create a greater-than check */
export const gt = (left: Expression, right: Expression): Expression =>
  ({ type: 'greaterThan', left, right });

/** Create a less-than check */
export const lt = (left: Expression, right: Expression): Expression =>
  ({ type: 'lessThan', left, right });

/** Create a count expression */
export const count = (of: Expression): Expression =>
  ({ type: 'count', of });

/** Create a cards-in-zone expression */
export const cardsIn = (zone: ZoneRef): Expression =>
  ({ type: 'cards', in: zone });

/** Current player reference */
export const currentPlayer: Expression = { type: 'currentPlayer' };

/** All players reference */
export const allPlayers: Expression = { type: 'players', filter: 'all' };
