/**
 * DSL Interpreter
 *
 * Executes game definitions against game state.
 * This is the runtime engine that makes games actually playable.
 */

import type {
  GameDefinition,
  Scope,
  Action,
  Expression,
  CardTypeDefinition,
  ZoneRef,
  CardRef,
  PlayerRef,
} from './types';

// =============================================================================
// GAME STATE
// =============================================================================

export interface Card {
  id: string;
  type: string;
  properties: Record<string, any>;
  zone: string;
  owner?: string; // Player ID for per-player zones
  faceUp: boolean;
  markers: Record<string, any>;
}

export interface Zone {
  id: string;
  name: string;
  cards: string[]; // Card IDs in order
  owner?: string;
  visibility: 'public' | 'private' | 'owner';
}

export interface Player {
  id: string;
  name: string;
  connected: boolean;
  variables: Record<string, any>;
}

export interface GameState {
  // Core state
  phase: 'setup' | 'playing' | 'finished';
  cards: Record<string, Card>;
  zones: Record<string, Zone>;
  players: Player[];
  turnOrder: string[]; // Player IDs
  currentPlayerIndex: number;
  turnDirection: 1 | -1;

  // Variables at different scopes
  gameVariables: Record<string, any>;
  roundVariables: Record<string, any>;
  turnVariables: Record<string, any>;

  // Execution state
  roundNumber: number;
  turnNumber: number;

  // Pending player input
  pendingInput?: {
    type: 'chooseCards' | 'prompt';
    playerId: string;
    options: any;
    resolve: (value: any) => void;
  };

  // Event log
  events: GameEvent[];
}

export interface GameEvent {
  type: string;
  data: any;
  timestamp: number;
}

// =============================================================================
// EXECUTION CONTEXT
// =============================================================================

interface ExecutionContext {
  state: GameState;
  definition: GameDefinition;
  scopeStack: ScopeFrame[];
  onStateChange: (state: GameState) => void;
  onPlayerInput: (request: PlayerInputRequest) => Promise<any>;
  onEvent: (event: GameEvent) => void;
}

interface ScopeFrame {
  scopeId: string;
  variables: Record<string, any>;
  iterator?: any;
  iteratorName?: string;
  iterationIndex: number;
}

export interface PlayerInputRequest {
  type: 'chooseCards' | 'prompt';
  playerId: string;
  message?: string;
  options: any;
}

// =============================================================================
// EXPRESSION EVALUATOR
// =============================================================================

function evaluateExpression(expr: Expression, ctx: ExecutionContext): any {
  const { state, scopeStack } = ctx;

  switch (expr.type) {
    // Literals
    case 'literal':
      return expr.value;

    case 'list':
      return expr.items.map(item => evaluateExpression(item, ctx));

    // References
    case 'variable': {
      // Search scope stack from top to bottom
      if (expr.scope === 'game') return state.gameVariables[expr.name];
      if (expr.scope === 'round') return state.roundVariables[expr.name];
      if (expr.scope === 'turn') return state.turnVariables[expr.name];

      // Search scope stack
      for (let i = scopeStack.length - 1; i >= 0; i--) {
        if (expr.name in scopeStack[i].variables) {
          return scopeStack[i].variables[expr.name];
        }
      }
      return state.gameVariables[expr.name];
    }

    case 'iterator': {
      // Find the iterator in scope stack
      for (let i = scopeStack.length - 1; i >= 0; i--) {
        if (scopeStack[i].iterator !== undefined) {
          if (!expr.scopeId || scopeStack[i].scopeId === expr.scopeId) {
            return scopeStack[i].iterator;
          }
        }
      }
      return undefined;
    }

    case 'property': {
      const obj = evaluateExpression(expr.of, ctx);
      if (obj && typeof obj === 'object') {
        // Handle nested property access
        if ('properties' in obj && expr.property in obj.properties) {
          return obj.properties[expr.property];
        }
        return obj[expr.property];
      }
      return undefined;
    }

    // Arithmetic
    case 'add':
      return evaluateExpression(expr.left, ctx) + evaluateExpression(expr.right, ctx);
    case 'subtract':
      return evaluateExpression(expr.left, ctx) - evaluateExpression(expr.right, ctx);
    case 'multiply':
      return evaluateExpression(expr.left, ctx) * evaluateExpression(expr.right, ctx);
    case 'divide':
      return evaluateExpression(expr.left, ctx) / evaluateExpression(expr.right, ctx);
    case 'modulo':
      return evaluateExpression(expr.left, ctx) % evaluateExpression(expr.right, ctx);

    // Comparison
    case 'equals':
      return evaluateExpression(expr.left, ctx) === evaluateExpression(expr.right, ctx);
    case 'notEquals':
      return evaluateExpression(expr.left, ctx) !== evaluateExpression(expr.right, ctx);
    case 'greaterThan':
      return evaluateExpression(expr.left, ctx) > evaluateExpression(expr.right, ctx);
    case 'lessThan':
      return evaluateExpression(expr.left, ctx) < evaluateExpression(expr.right, ctx);
    case 'greaterOrEqual':
      return evaluateExpression(expr.left, ctx) >= evaluateExpression(expr.right, ctx);
    case 'lessOrEqual':
      return evaluateExpression(expr.left, ctx) <= evaluateExpression(expr.right, ctx);

    // Logical
    case 'and':
      return expr.conditions.every(c => evaluateExpression(c, ctx));
    case 'or':
      return expr.conditions.some(c => evaluateExpression(c, ctx));
    case 'not':
      return !evaluateExpression(expr.condition, ctx);

    // Conditional
    case 'if':
      return evaluateExpression(expr.condition, ctx)
        ? evaluateExpression(expr.then, ctx)
        : evaluateExpression(expr.else, ctx);

    // Collection operations
    case 'count': {
      const collection = evaluateExpression(expr.of, ctx);
      return Array.isArray(collection) ? collection.length : 0;
    }

    case 'sum': {
      const collection = evaluateExpression(expr.of, ctx);
      if (!Array.isArray(collection)) return 0;
      return collection.reduce((sum, item) => {
        const val = expr.property ? item[expr.property] : item;
        return sum + (typeof val === 'number' ? val : 0);
      }, 0);
    }

    case 'first': {
      const collection = evaluateExpression(expr.of, ctx);
      return Array.isArray(collection) ? collection[0] : undefined;
    }

    case 'last': {
      const collection = evaluateExpression(expr.of, ctx);
      return Array.isArray(collection) ? collection[collection.length - 1] : undefined;
    }

    case 'nth': {
      const collection = evaluateExpression(expr.of, ctx);
      const index = evaluateExpression(expr.index, ctx);
      return Array.isArray(collection) ? collection[index] : undefined;
    }

    case 'filter': {
      const collection = evaluateExpression(expr.collection, ctx);
      if (!Array.isArray(collection)) return [];

      const varName = expr.as || 'item';
      return collection.filter(item => {
        // Push temporary scope with iterator
        scopeStack.push({
          scopeId: 'filter',
          variables: { [varName]: item },
          iterator: item,
          iteratorName: varName,
          iterationIndex: 0,
        });
        const result = evaluateExpression(expr.condition, ctx);
        scopeStack.pop();
        return result;
      });
    }

    case 'map': {
      const collection = evaluateExpression(expr.collection, ctx);
      if (!Array.isArray(collection)) return [];

      const varName = expr.as || 'item';
      return collection.map(item => {
        scopeStack.push({
          scopeId: 'map',
          variables: { [varName]: item },
          iterator: item,
          iteratorName: varName,
          iterationIndex: 0,
        });
        const result = evaluateExpression(expr.transform, ctx);
        scopeStack.pop();
        return result;
      });
    }

    case 'any': {
      const collection = evaluateExpression(expr.collection, ctx);
      if (!Array.isArray(collection)) return false;

      const varName = expr.as || 'item';
      return collection.some(item => {
        scopeStack.push({
          scopeId: 'any',
          variables: { [varName]: item },
          iterator: item,
          iteratorName: varName,
          iterationIndex: 0,
        });
        const result = evaluateExpression(expr.condition, ctx);
        scopeStack.pop();
        return result;
      });
    }

    case 'all': {
      const collection = evaluateExpression(expr.collection, ctx);
      if (!Array.isArray(collection)) return true;

      const varName = expr.as || 'item';
      return collection.every(item => {
        scopeStack.push({
          scopeId: 'all',
          variables: { [varName]: item },
          iterator: item,
          iteratorName: varName,
          iterationIndex: 0,
        });
        const result = evaluateExpression(expr.condition, ctx);
        scopeStack.pop();
        return result;
      });
    }

    case 'contains': {
      const collection = evaluateExpression(expr.collection, ctx);
      const item = evaluateExpression(expr.item, ctx);
      return Array.isArray(collection) && collection.includes(item);
    }

    case 'isEmpty': {
      const collection = evaluateExpression(expr.of, ctx);
      return !collection || (Array.isArray(collection) && collection.length === 0);
    }

    // Game-specific queries
    case 'cards': {
      const zone = resolveZone(expr.in, ctx);
      if (!zone) return [];
      return zone.cards.map(id => state.cards[id]).filter(Boolean);
    }

    case 'players': {
      let players = [...state.players];
      if (expr.filter === 'active') {
        players = players.filter(p => p.connected);
      } else if (expr.filter === 'withCards') {
        players = players.filter(p => {
          const hand = state.zones[`hand-${p.id}`];
          return hand && hand.cards.length > 0;
        });
      }
      return players;
    }

    case 'currentPlayer':
      return state.players[state.currentPlayerIndex];

    case 'turnOrder':
      return state.turnOrder.map(id => state.players.find(p => p.id === id));

    case 'roundNumber':
      return state.roundNumber;

    case 'turnNumber':
      return state.turnNumber;

    // String operations
    case 'concat':
      return expr.parts.map(p => String(evaluateExpression(p, ctx))).join('');

    case 'template': {
      let result = expr.template;
      for (const [key, value] of Object.entries(expr.values)) {
        result = result.replace(`{{${key}}}`, String(evaluateExpression(value, ctx)));
      }
      return result;
    }

    // Random
    case 'random': {
      const min = evaluateExpression(expr.min, ctx);
      const max = evaluateExpression(expr.max, ctx);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    case 'randomFrom': {
      const collection = evaluateExpression(expr.collection, ctx);
      if (!Array.isArray(collection) || collection.length === 0) return undefined;
      const count = expr.count ? evaluateExpression(expr.count, ctx) : 1;
      if (count === 1) {
        return collection[Math.floor(Math.random() * collection.length)];
      }
      // Shuffle and take first n
      const shuffled = [...collection].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }

    default:
      console.warn('Unknown expression type:', (expr as any).type);
      return undefined;
  }
}

// =============================================================================
// ZONE & CARD RESOLUTION
// =============================================================================

function resolveZone(ref: ZoneRef, ctx: ExecutionContext): Zone | undefined {
  const { state } = ctx;

  let zoneId: string;

  if (ref.id === 'custom') {
    zoneId = ref.name;
  } else {
    zoneId = ref.id;
  }

  // Handle per-player zones
  if (ref.owner) {
    const player = resolvePlayer(ref.owner, ctx);
    if (player) {
      zoneId = `${zoneId}-${player.id}`;
    }
  }

  return state.zones[zoneId];
}

function resolvePlayer(ref: PlayerRef, ctx: ExecutionContext): Player | undefined {
  const { state } = ctx;

  if (ref.id === 'current') {
    return state.players[state.currentPlayerIndex];
  }
  if (ref.id === 'next') {
    const nextIndex = (state.currentPlayerIndex + state.turnDirection + state.players.length) % state.players.length;
    return state.players[nextIndex];
  }
  if (ref.id === 'previous') {
    const prevIndex = (state.currentPlayerIndex - state.turnDirection + state.players.length) % state.players.length;
    return state.players[prevIndex];
  }
  if (ref.id === 'all') {
    return undefined; // Handled specially
  }
  if (ref.id === 'others') {
    return undefined; // Handled specially
  }
  if (ref.id === 'specific') {
    return state.players.find(p => p.id === ref.playerId);
  }
  if (ref.id === 'byIndex') {
    const index = evaluateExpression(ref.index, ctx);
    return state.players[index];
  }

  return undefined;
}

function resolveCards(ref: CardRef, ctx: ExecutionContext): Card[] {
  const { state } = ctx;

  if (ref.id === 'specific') {
    const card = state.cards[ref.cardId];
    return card ? [card] : [];
  }

  const zone = resolveZone(ref.from, ctx);
  if (!zone) return [];

  const cards = zone.cards.map(id => state.cards[id]).filter(Boolean);

  if (ref.id === 'all') {
    if (ref.filter) {
      return cards.filter(card => {
        ctx.scopeStack.push({
          scopeId: 'cardFilter',
          variables: { card },
          iterator: card,
          iterationIndex: 0,
        });
        const result = evaluateExpression(ref.filter!, ctx);
        ctx.scopeStack.pop();
        return result;
      });
    }
    return cards;
  }

  const count = ref.count ? evaluateExpression(ref.count, ctx) : 1;

  if (ref.id === 'top') {
    return cards.slice(0, count);
  }
  if (ref.id === 'bottom') {
    return cards.slice(-count);
  }
  if (ref.id === 'random') {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  return [];
}

// =============================================================================
// ACTION EXECUTOR
// =============================================================================

async function executeAction(action: Action, ctx: ExecutionContext): Promise<void> {
  const { state, onStateChange, onPlayerInput, onEvent } = ctx;

  switch (action.type) {
    // Card Movement
    case 'move': {
      const cards = resolveCards(action.cards, ctx);
      const toZone = resolveZone(action.to, ctx);
      if (!toZone) break;

      for (const card of cards) {
        // Remove from current zone
        const fromZone = state.zones[card.zone];
        if (fromZone) {
          fromZone.cards = fromZone.cards.filter(id => id !== card.id);
        }

        // Add to new zone
        if (action.position === 'bottom') {
          toZone.cards.push(card.id);
        } else if (action.position === 'random') {
          const index = Math.floor(Math.random() * (toZone.cards.length + 1));
          toZone.cards.splice(index, 0, card.id);
        } else {
          // Top is default
          toZone.cards.unshift(card.id);
        }

        card.zone = toZone.id;
        if (action.reveal !== undefined) {
          card.faceUp = action.reveal;
        }
      }

      onEvent({ type: 'cardsMoved', data: { cards: cards.map(c => c.id), to: toZone.id }, timestamp: Date.now() });
      onStateChange(state);
      break;
    }

    case 'shuffle': {
      const zone = resolveZone(action.zone, ctx);
      if (zone) {
        zone.cards = zone.cards.sort(() => Math.random() - 0.5);
        onEvent({ type: 'zoneShuffled', data: { zone: zone.id }, timestamp: Date.now() });
        onStateChange(state);
      }
      break;
    }

    case 'reveal': {
      const cards = resolveCards(action.cards, ctx);
      for (const card of cards) {
        card.faceUp = true;
      }
      onEvent({ type: 'cardsRevealed', data: { cards: cards.map(c => c.id) }, timestamp: Date.now() });
      onStateChange(state);
      break;
    }

    case 'hide': {
      const cards = resolveCards(action.cards, ctx);
      for (const card of cards) {
        card.faceUp = false;
      }
      onStateChange(state);
      break;
    }

    // Variables
    case 'set': {
      const value = evaluateExpression(action.value, ctx);
      if (action.scope === 'game') {
        state.gameVariables[action.variable] = value;
      } else if (action.scope === 'round') {
        state.roundVariables[action.variable] = value;
      } else if (action.scope === 'turn') {
        state.turnVariables[action.variable] = value;
      } else if (action.scope === 'player' && action.player) {
        const player = resolvePlayer(action.player, ctx);
        if (player) player.variables[action.variable] = value;
      } else {
        // Default to current scope
        const frame = ctx.scopeStack[ctx.scopeStack.length - 1];
        if (frame) frame.variables[action.variable] = value;
      }
      onStateChange(state);
      break;
    }

    case 'increment': {
      const by = action.by ? evaluateExpression(action.by, ctx) : 1;
      if (action.scope === 'player' && action.player) {
        const player = resolvePlayer(action.player, ctx);
        if (player) {
          player.variables[action.variable] = (player.variables[action.variable] || 0) + by;
        }
      } else if (action.scope === 'game') {
        state.gameVariables[action.variable] = (state.gameVariables[action.variable] || 0) + by;
      } else if (action.scope === 'round') {
        state.roundVariables[action.variable] = (state.roundVariables[action.variable] || 0) + by;
      }
      onStateChange(state);
      break;
    }

    case 'decrement': {
      const by = action.by ? evaluateExpression(action.by, ctx) : 1;
      if (action.scope === 'player' && action.player) {
        const player = resolvePlayer(action.player, ctx);
        if (player) {
          player.variables[action.variable] = (player.variables[action.variable] || 0) - by;
        }
      } else if (action.scope === 'game') {
        state.gameVariables[action.variable] = (state.gameVariables[action.variable] || 0) - by;
      }
      onStateChange(state);
      break;
    }

    // Turn Management
    case 'nextPlayer': {
      state.currentPlayerIndex = (state.currentPlayerIndex + state.turnDirection + state.players.length) % state.players.length;
      onEvent({ type: 'turnChanged', data: { player: state.players[state.currentPlayerIndex].id }, timestamp: Date.now() });
      onStateChange(state);
      break;
    }

    case 'skipPlayer': {
      const count = action.count ? evaluateExpression(action.count, ctx) : 1;
      state.currentPlayerIndex = (state.currentPlayerIndex + state.turnDirection * (count + 1) + state.players.length) % state.players.length;
      onStateChange(state);
      break;
    }

    case 'reverseTurnOrder': {
      state.turnDirection *= -1;
      onEvent({ type: 'turnOrderReversed', data: {}, timestamp: Date.now() });
      onStateChange(state);
      break;
    }

    // Player Interaction
    case 'chooseCards': {
      const player = resolvePlayer(action.player, ctx);
      if (!player) break;

      const zone = resolveZone(action.from, ctx);
      if (!zone) break;

      const availableCards = zone.cards.map(id => state.cards[id]).filter(Boolean);
      // Check if count is a range (has min/max) or a single Expression
      const countValue = action.count;
      const isRange = countValue && typeof countValue === 'object' && 'min' in countValue && 'max' in countValue;
      const count = isRange
        ? { min: evaluateExpression((countValue as { min: Expression; max: Expression }).min, ctx), max: evaluateExpression((countValue as { min: Expression; max: Expression }).max, ctx) }
        : evaluateExpression(countValue as Expression, ctx);

      const message = action.message ? evaluateExpression(action.message, ctx) : 'Choose cards';

      // Request input from player
      const chosen = await onPlayerInput({
        type: 'chooseCards',
        playerId: player.id,
        message: String(message),
        options: {
          cards: availableCards,
          count,
          filter: action.filter,
        },
      });

      // Store result
      const frame = ctx.scopeStack[ctx.scopeStack.length - 1];
      if (frame) {
        frame.variables[action.storeIn] = chosen;
      }
      break;
    }

    case 'prompt': {
      const player = resolvePlayer(action.player, ctx);
      if (!player) break;

      const message = evaluateExpression(action.message, ctx);
      const choices = action.choices.map(c => ({
        id: c.id,
        label: evaluateExpression(c.label, ctx),
        enabled: c.enabled ? evaluateExpression(c.enabled, ctx) : true,
        data: c.data ? Object.fromEntries(
          Object.entries(c.data).map(([k, v]) => [k, evaluateExpression(v, ctx)])
        ) : undefined,
      }));

      const choice = await onPlayerInput({
        type: 'prompt',
        playerId: player.id,
        message: String(message),
        options: { choices },
      });

      const frame = ctx.scopeStack[ctx.scopeStack.length - 1];
      if (frame) {
        frame.variables[action.storeIn] = choice;
      }
      break;
    }

    case 'announce': {
      const message = evaluateExpression(action.message, ctx);
      onEvent({ type: 'announcement', data: { message: String(message) }, timestamp: Date.now() });
      break;
    }

    // Control Flow
    case 'conditional': {
      const condition = evaluateExpression(action.if, ctx);
      const actions = condition ? action.then : (action.else || []);
      for (const a of actions) {
        await executeAction(a, ctx);
      }
      break;
    }

    case 'forEach': {
      const collection = evaluateExpression(action.collection, ctx);
      if (!Array.isArray(collection)) break;

      for (let i = 0; i < collection.length; i++) {
        ctx.scopeStack.push({
          scopeId: 'forEach',
          variables: { [action.as]: collection[i] },
          iterator: collection[i],
          iteratorName: action.as,
          iterationIndex: i,
        });

        for (const a of action.do) {
          await executeAction(a, ctx);
        }

        ctx.scopeStack.pop();
      }
      break;
    }

    case 'emit': {
      const data = action.data ? Object.fromEntries(
        Object.entries(action.data).map(([k, v]) => [k, evaluateExpression(v, ctx)])
      ) : {};
      onEvent({ type: action.event, data, timestamp: Date.now() });
      break;
    }

    case 'log': {
      const message = evaluateExpression(action.message, ctx);
      console.log(`[Game ${action.level || 'info'}]`, message);
      break;
    }

    case 'wait': {
      const seconds = evaluateExpression(action.seconds, ctx);
      await new Promise(resolve => setTimeout(resolve, seconds * 1000));
      break;
    }

    default:
      console.warn('Unknown action type:', (action as any).type);
  }
}

// =============================================================================
// SCOPE EXECUTOR
// =============================================================================

async function executeScope(scope: Scope, ctx: ExecutionContext): Promise<'continue' | 'exit'> {
  const { state } = ctx;

  // Check entry condition
  if (scope.entryCondition) {
    const canEnter = evaluateExpression(scope.entryCondition, ctx);
    if (!canEnter) return 'continue';
  }

  // Create scope frame
  const frame: ScopeFrame = {
    scopeId: scope.id,
    variables: {},
    iterationIndex: 0,
  };

  // Initialize variables
  if (scope.variables) {
    for (const v of scope.variables) {
      frame.variables[v.name] = evaluateExpression(v.initialValue, ctx);
    }
  }

  ctx.scopeStack.push(frame);

  // Run onEnter actions
  if (scope.onEnter) {
    for (const action of scope.onEnter) {
      await executeAction(action, ctx);
    }
  }

  // Execute based on iteration type
  const iterate = scope.iterate || { type: 'once' };
  let result: 'continue' | 'exit' = 'continue';

  if (iterate.type === 'once') {
    result = await executeChildren(scope, ctx);
  }
  else if (iterate.type === 'while') {
    let iterations = 0;
    const maxIter = scope.maxIterations || 1000;

    while (iterations < maxIter) {
      const condition = evaluateExpression(iterate.condition, ctx);
      if (!condition) break;

      result = await executeChildren(scope, ctx);
      if (result === 'exit') break;

      if (scope.onIteration) {
        for (const action of scope.onIteration) {
          await executeAction(action, ctx);
        }
      }

      frame.iterationIndex++;
      iterations++;
    }
  }
  else if (iterate.type === 'until') {
    let iterations = 0;
    const maxIter = scope.maxIterations || 1000;

    while (iterations < maxIter) {
      result = await executeChildren(scope, ctx);
      if (result === 'exit') break;

      const condition = evaluateExpression(iterate.condition, ctx);
      if (condition) break;

      if (scope.onIteration) {
        for (const action of scope.onIteration) {
          await executeAction(action, ctx);
        }
      }

      frame.iterationIndex++;
      iterations++;
    }
  }
  else if (iterate.type === 'forEach') {
    const collection = evaluateExpression(iterate.collection, ctx);
    if (Array.isArray(collection)) {
      for (let i = 0; i < collection.length; i++) {
        frame.iterator = collection[i];
        frame.iteratorName = iterate.as;
        frame.variables[iterate.as] = collection[i];
        frame.iterationIndex = i;

        result = await executeChildren(scope, ctx);
        if (result === 'exit') break;

        if (scope.onIteration) {
          for (const action of scope.onIteration) {
            await executeAction(action, ctx);
          }
        }
      }
    }
  }
  else if (iterate.type === 'forEachPlayer') {
    let players = [...state.players];
    if (iterate.order === 'reverse') {
      players = players.reverse();
    } else if (iterate.order === 'random') {
      players = players.sort(() => Math.random() - 0.5);
    }
    // Default: turnOrder

    const varName = iterate.as || 'player';
    for (let i = 0; i < players.length; i++) {
      frame.iterator = players[i];
      frame.iteratorName = varName;
      frame.variables[varName] = players[i];
      frame.iterationIndex = i;
      state.currentPlayerIndex = state.players.findIndex(p => p.id === players[i].id);

      result = await executeChildren(scope, ctx);
      if (result === 'exit') break;

      if (scope.onIteration) {
        for (const action of scope.onIteration) {
          await executeAction(action, ctx);
        }
      }
    }
  }
  else if (iterate.type === 'repeat') {
    const count = evaluateExpression(iterate.count, ctx);
    const varName = iterate.as || 'i';

    for (let i = 0; i < count; i++) {
      frame.iterator = i;
      frame.iteratorName = varName;
      frame.variables[varName] = i;
      frame.iterationIndex = i;

      result = await executeChildren(scope, ctx);
      if (result === 'exit') break;

      if (scope.onIteration) {
        for (const action of scope.onIteration) {
          await executeAction(action, ctx);
        }
      }
    }
  }

  // Run onExit actions
  if (scope.onExit) {
    for (const action of scope.onExit) {
      await executeAction(action, ctx);
    }
  }

  ctx.scopeStack.pop();
  return result;
}

async function executeChildren(scope: Scope, ctx: ExecutionContext): Promise<'continue' | 'exit'> {
  if (!scope.children) return 'continue';

  for (const child of scope.children) {
    // Check exit conditions
    if (scope.exitConditions) {
      for (const exit of scope.exitConditions) {
        const shouldExit = evaluateExpression(exit.condition, ctx);
        if (shouldExit) {
          if (exit.actions) {
            for (const action of exit.actions) {
              await executeAction(action, ctx);
            }
          }
          return 'exit';
        }
      }
    }

    if ('kind' in child) {
      // It's a scope
      const result = await executeScope(child, ctx);
      if (result === 'exit') return 'exit';
    } else {
      // It's an action
      await executeAction(child, ctx);
    }
  }

  return 'continue';
}

// =============================================================================
// GAME RUNNER
// =============================================================================

export interface GameRunner {
  state: GameState;
  start: () => Promise<void>;
  handlePlayerInput: (playerId: string, input: any) => void;
}

export function createGameRunner(
  definition: GameDefinition,
  players: { id: string; name: string }[],
  onStateChange: (state: GameState) => void,
  onEvent: (event: GameEvent) => void,
  onPlayerInputRequest: (request: PlayerInputRequest) => void,
): GameRunner {
  // Initialize state
  const state: GameState = {
    phase: 'setup',
    cards: {},
    zones: {},
    players: players.map(p => ({
      id: p.id,
      name: p.name,
      connected: true,
      variables: {},
    })),
    turnOrder: players.map(p => p.id),
    currentPlayerIndex: 0,
    turnDirection: 1,
    gameVariables: {},
    roundVariables: {},
    turnVariables: {},
    roundNumber: 0,
    turnNumber: 0,
    events: [],
  };

  // Initialize player variables
  if (definition.players.initial) {
    for (const player of state.players) {
      for (const v of definition.players.initial) {
        player.variables[v.variable] = evaluateExpression(v.value, {
          state,
          definition,
          scopeStack: [],
          onStateChange,
          onPlayerInput: async () => {},
          onEvent,
        });
      }
    }
  }

  // Initialize zones
  if (definition.zones) {
    for (const zoneDef of definition.zones) {
      if (zoneDef.scope === 'perPlayer') {
        for (const player of state.players) {
          state.zones[`${zoneDef.name}-${player.id}`] = {
            id: `${zoneDef.name}-${player.id}`,
            name: zoneDef.name,
            cards: [],
            owner: player.id,
            visibility: zoneDef.visibility,
          };
        }
      } else {
        state.zones[zoneDef.name] = {
          id: zoneDef.name,
          name: zoneDef.name,
          cards: [],
          visibility: zoneDef.visibility,
        };
      }
    }
  }

  // Pending input handling
  let pendingInputResolve: ((value: any) => void) | null = null;

  const handlePlayerInput = (playerId: string, input: any) => {
    if (pendingInputResolve && state.pendingInput?.playerId === playerId) {
      const resolve = pendingInputResolve;
      pendingInputResolve = null;
      state.pendingInput = undefined;
      resolve(input);
    }
  };

  const onPlayerInput = async (request: PlayerInputRequest): Promise<any> => {
    return new Promise(resolve => {
      pendingInputResolve = resolve;
      state.pendingInput = {
        type: request.type,
        playerId: request.playerId,
        options: request.options,
        resolve,
      };
      onPlayerInputRequest(request);
    });
  };

  const ctx: ExecutionContext = {
    state,
    definition,
    scopeStack: [],
    onStateChange,
    onPlayerInput,
    onEvent,
  };

  const start = async () => {
    // Run setup
    state.phase = 'setup';
    await executeScope(definition.setup, ctx);

    // Run main game
    state.phase = 'playing';
    await executeScope(definition.main, ctx);

    // Game finished
    state.phase = 'finished';
    onStateChange(state);
  };

  return {
    state,
    start,
    handlePlayerInput,
  };
}

export { evaluateExpression, executeAction, executeScope };
