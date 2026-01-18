/**
 * Utility functions for the game platform
 * All functions are pure - no side effects
 */

import type { Card, Deck, Player, GameState, CardPack, Timestamp } from './types';

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

/**
 * Fisher-Yates shuffle - returns a new shuffled array
 */
export function shuffle<T>(array: T[], seed?: number): T[] {
  const result = [...array];
  let random = seed !== undefined ? seededRandom(seed) : Math.random;

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Simple seeded random number generator for reproducible shuffles
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * Remove an item from an array by predicate, returning new array and removed item
 */
export function removeWhere<T>(
  array: T[],
  predicate: (item: T) => boolean
): { array: T[]; removed: T | undefined } {
  const index = array.findIndex(predicate);
  if (index === -1) {
    return { array, removed: undefined };
  }
  const removed = array[index];
  const newArray = [...array.slice(0, index), ...array.slice(index + 1)];
  return { array: newArray, removed };
}

/**
 * Remove an item from an array by ID
 */
export function removeById<T extends { id: string }>(
  array: T[],
  id: string
): { array: T[]; removed: T | undefined } {
  return removeWhere(array, (item) => item.id === id);
}

// =============================================================================
// DECK OPERATIONS
// =============================================================================

/**
 * Draw cards from the top of a deck
 */
export function drawCards(
  deck: Deck,
  count: number
): { deck: Deck; cards: Card[] } {
  if (count <= 0) {
    return { deck, cards: [] };
  }

  let currentDeck = deck;

  // If we need more cards than available in draw pile, shuffle discard back in
  if (currentDeck.cards.length < count && currentDeck.discardPile.length > 0) {
    currentDeck = reshuffleDiscardIntoDeck(currentDeck);
  }

  // Draw what we can
  const actualCount = Math.min(count, currentDeck.cards.length);
  const drawnCards = currentDeck.cards.slice(0, actualCount);
  const remainingCards = currentDeck.cards.slice(actualCount);

  return {
    deck: {
      ...currentDeck,
      cards: remainingCards,
    },
    cards: drawnCards,
  };
}

/**
 * Shuffle discard pile back into deck
 */
export function reshuffleDiscardIntoDeck(deck: Deck): Deck {
  const allCards = [...deck.cards, ...shuffle(deck.discardPile)];
  return {
    ...deck,
    cards: allCards,
    discardPile: [],
  };
}

/**
 * Add cards to discard pile
 */
export function discardCards(deck: Deck, cards: Card[]): Deck {
  return {
    ...deck,
    discardPile: [...deck.discardPile, ...cards],
  };
}

/**
 * Shuffle a deck's draw pile
 */
export function shuffleDeck(deck: Deck, seed?: number): Deck {
  return {
    ...deck,
    cards: shuffle(deck.cards, seed),
  };
}

// =============================================================================
// PLAYER OPERATIONS
// =============================================================================

/**
 * Find a player by ID
 */
export function findPlayer(state: GameState, playerId: string): Player | undefined {
  return state.players.find((p) => p.id === playerId);
}

/**
 * Update a player in the state
 */
export function updatePlayer(state: GameState, playerId: string, update: Partial<Player>): GameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, ...update } : p
    ),
  };
}

/**
 * Get active players (not left)
 */
export function getActivePlayers(state: GameState): Player[] {
  return state.players.filter((p) => p.presence !== 'left');
}

/**
 * Get players who can submit (active and not judge)
 */
export function getSubmitters(state: GameState): Player[] {
  return state.players.filter(
    (p) => p.presence === 'active' && p.id !== state.roles.judge
  );
}

/**
 * Get next player in rotation after the given player
 */
export function getNextInRotation(
  turnOrder: string[],
  currentId: string,
  activePlayers: Player[]
): string | null {
  const activeIds = new Set(activePlayers.filter((p) => p.presence === 'active').map((p) => p.id));
  const currentIndex = turnOrder.indexOf(currentId);

  if (currentIndex === -1) {
    // Current player not in rotation, return first active
    return turnOrder.find((id) => activeIds.has(id)) ?? null;
  }

  // Find next active player in rotation
  for (let i = 1; i <= turnOrder.length; i++) {
    const nextIndex = (currentIndex + i) % turnOrder.length;
    const nextId = turnOrder[nextIndex];
    if (activeIds.has(nextId)) {
      return nextId;
    }
  }

  return null;
}

/**
 * Assign new lead to longest-tenured active player
 */
export function assignNewLead(players: Player[]): string | null {
  return (
    players
      .filter((p) => p.presence === 'active')
      .sort((a, b) => a.joinedAt - b.joinedAt)[0]?.id ?? null
  );
}

// =============================================================================
// CARD OPERATIONS
// =============================================================================

/**
 * Find a card in a player's hand
 */
export function findCardInHand(player: Player, cardId: string): Card | undefined {
  return player.hand.find((c) => c.id === cardId);
}

/**
 * Remove a card from a player's hand
 */
export function removeCardFromHand(player: Player, cardId: string): { player: Player; card: Card | undefined } {
  const { array: hand, removed: card } = removeById(player.hand, cardId);
  return {
    player: { ...player, hand },
    card,
  };
}

/**
 * Add cards to a player's hand
 */
export function addCardsToHand(player: Player, cards: Card[]): Player {
  return {
    ...player,
    hand: [...player.hand, ...cards],
  };
}

// =============================================================================
// PACK OPERATIONS
// =============================================================================

/**
 * Merge multiple card packs into unified decks
 */
export function mergePacksIntoDecks(
  packs: CardPack[],
  deckDefinitions: Record<string, { cardType: string }>
): Record<string, Deck> {
  const decks: Record<string, Deck> = {};

  // Initialize empty decks
  for (const [deckId, def] of Object.entries(deckDefinitions)) {
    decks[deckId] = {
      id: deckId,
      cards: [],
      discardPile: [],
    };
  }

  // Add cards from each pack
  for (const pack of packs) {
    for (const [deckType, cards] of Object.entries(pack.cards)) {
      // Find which deck this card type goes to
      const deckEntry = Object.entries(deckDefinitions).find(
        ([, def]) => def.cardType === deckType
      );

      if (deckEntry) {
        const [deckId] = deckEntry;
        decks[deckId].cards.push(...cards);
      }
    }
  }

  return decks;
}

// =============================================================================
// ID GENERATION
// =============================================================================

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

// =============================================================================
// TIMESTAMP
// =============================================================================

/**
 * Get current timestamp
 */
export function now(): Timestamp {
  return Date.now();
}

// =============================================================================
// IMMUTABLE UPDATES
// =============================================================================

/**
 * Deep clone an object (for immutable updates)
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
