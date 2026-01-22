'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Play, Save, Plus, Trash2, ChevronRight, ChevronDown,
  Copy, Settings, Zap, RotateCcw, Users, Layers, Target, Clock,
  Shuffle, Eye, EyeOff, ArrowRightLeft, MessageSquare, Award,
  GitBranch, Repeat, Filter, Box, Sparkles, GripVertical,
  HelpCircle, Code, Palette, Loader2, Check
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type BlockKind = 'game' | 'round' | 'turn' | 'phase' | 'action' | 'condition' | 'trigger';

interface Block {
  id: string;
  kind: BlockKind;
  type: string;
  name: string;
  description?: string;
  children?: Block[];
  properties?: Record<string, any>;
  collapsed?: boolean;
}

interface BlockTemplate {
  type: string;
  kind: BlockKind;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  defaultProperties?: Record<string, any>;
  canHaveChildren?: boolean;
  category: string;
}

// Game Component Types
interface CardProperty {
  name: string;
  type: 'string' | 'number' | 'boolean';
  label: string;
  default?: any;
}

interface CardTypeDefinition {
  id: string;
  type: string;
  name: string;
  color: string;
  textColor: string;
  properties: CardProperty[];
}

interface ZoneDefinition {
  id: string;
  name: string;
  scope: 'shared' | 'perPlayer';
  visibility: 'public' | 'private' | 'owner';
}

interface DeckDefinition {
  id: string;
  name: string;
  cardType: string;
  cards: Array<{ id: string; properties: Record<string, any> }>;
}

interface ResourceDefinition {
  id: string;
  name: string;
  initialValue: number;
  min?: number;
  max?: number;
}

type BuilderTab = 'flow' | 'components';

// =============================================================================
// COMPONENT PRESETS - Quick-add templates for common game components
// =============================================================================

interface ComponentPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'cards' | 'zones' | 'resources' | 'decks';
  cardTypes?: CardTypeDefinition[];
  zones?: ZoneDefinition[];
  resources?: ResourceDefinition[];
  decks?: DeckDefinition[];
}

// Helper to generate standard 52-card deck
const generateStandardDeck = (): DeckDefinition => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const cards: Array<{ id: string; properties: Record<string, any> }> = [];

  suits.forEach(suit => {
    ranks.forEach((rank, idx) => {
      cards.push({
        id: `${rank}-${suit}`,
        properties: {
          suit,
          rank,
          value: idx + 1, // A=1, 2=2, ... K=13
        },
      });
    });
  });

  return {
    id: 'standard-deck',
    name: 'deck',
    cardType: 'playing_card',
    cards,
  };
};

// Helper to generate standard deck with jokers
const generateDeckWithJokers = (): DeckDefinition[] => {
  const standardDeck = generateStandardDeck();
  const jokerDeck: DeckDefinition = {
    id: 'jokers',
    name: 'jokers',
    cardType: 'joker',
    cards: [
      { id: 'joker-red', properties: { color: 'red' } },
      { id: 'joker-black', properties: { color: 'black' } },
    ],
  };
  return [standardDeck, jokerDeck];
};

const componentPresets: ComponentPreset[] = [
  // Card Type Presets
  {
    id: 'standard-deck',
    name: 'Standard Playing Cards',
    icon: '🃏',
    description: '52-card deck with suits and ranks',
    category: 'cards',
    cardTypes: [
      {
        id: 'playing-card',
        type: 'playing_card',
        name: 'Playing Card',
        color: '#ffffff',
        textColor: '#1a1a1a',
        properties: [
          { name: 'suit', type: 'string', label: 'Suit' },
          { name: 'rank', type: 'string', label: 'Rank' },
          { name: 'value', type: 'number', label: 'Value' },
        ],
      },
    ],
  },
  {
    id: 'standard-deck-jokers',
    name: 'Playing Cards + Jokers',
    icon: '🎭',
    description: '54-card deck with 2 jokers',
    category: 'cards',
    cardTypes: [
      {
        id: 'playing-card',
        type: 'playing_card',
        name: 'Playing Card',
        color: '#ffffff',
        textColor: '#1a1a1a',
        properties: [
          { name: 'suit', type: 'string', label: 'Suit' },
          { name: 'rank', type: 'string', label: 'Rank' },
          { name: 'value', type: 'number', label: 'Value' },
        ],
      },
      {
        id: 'joker',
        type: 'joker',
        name: 'Joker',
        color: '#ef4444',
        textColor: '#ffffff',
        properties: [
          { name: 'color', type: 'string', label: 'Color' },
        ],
      },
    ],
  },
  {
    id: 'uno-cards',
    name: 'Uno-style Cards',
    icon: '🔴',
    description: 'Colored number and action cards',
    category: 'cards',
    cardTypes: [
      {
        id: 'number-card',
        type: 'number',
        name: 'Number Card',
        color: '#3b82f6',
        textColor: '#ffffff',
        properties: [
          { name: 'color', type: 'string', label: 'Card Color' },
          { name: 'number', type: 'number', label: 'Number' },
        ],
      },
      {
        id: 'action-card',
        type: 'action',
        name: 'Action Card',
        color: '#f97316',
        textColor: '#ffffff',
        properties: [
          { name: 'color', type: 'string', label: 'Card Color' },
          { name: 'action', type: 'string', label: 'Action Type' },
        ],
      },
      {
        id: 'wild-card',
        type: 'wild',
        name: 'Wild Card',
        color: '#1a1a1a',
        textColor: '#ffffff',
        properties: [
          { name: 'action', type: 'string', label: 'Action Type' },
        ],
      },
    ],
  },
  {
    id: 'cah-cards',
    name: 'Prompt & Response',
    icon: '⬛',
    description: 'Black prompts, white responses (CAH-style)',
    category: 'cards',
    cardTypes: [
      {
        id: 'prompt',
        type: 'prompt',
        name: 'Prompt Card',
        color: '#1a1a1a',
        textColor: '#ffffff',
        properties: [
          { name: 'text', type: 'string', label: 'Prompt Text' },
          { name: 'pick', type: 'number', label: 'Cards to Pick', default: 1 },
        ],
      },
      {
        id: 'response',
        type: 'response',
        name: 'Response Card',
        color: '#ffffff',
        textColor: '#1a1a1a',
        properties: [
          { name: 'text', type: 'string', label: 'Response Text' },
        ],
      },
    ],
  },
  {
    id: 'trivia-cards',
    name: 'Trivia Cards',
    icon: '❓',
    description: 'Questions with multiple choice answers',
    category: 'cards',
    cardTypes: [
      {
        id: 'question',
        type: 'question',
        name: 'Question Card',
        color: '#8b5cf6',
        textColor: '#ffffff',
        properties: [
          { name: 'question', type: 'string', label: 'Question' },
          { name: 'answer', type: 'string', label: 'Correct Answer' },
          { name: 'category', type: 'string', label: 'Category' },
          { name: 'difficulty', type: 'number', label: 'Difficulty (1-5)' },
        ],
      },
    ],
  },
  {
    id: 'role-cards',
    name: 'Role Cards',
    icon: '🎭',
    description: 'Secret role/identity cards (Mafia, Werewolf)',
    category: 'cards',
    cardTypes: [
      {
        id: 'role',
        type: 'role',
        name: 'Role Card',
        color: '#6366f1',
        textColor: '#ffffff',
        properties: [
          { name: 'role', type: 'string', label: 'Role Name' },
          { name: 'team', type: 'string', label: 'Team' },
          { name: 'ability', type: 'string', label: 'Special Ability' },
        ],
      },
    ],
  },

  // Zone Presets
  {
    id: 'basic-zones',
    name: 'Basic Card Zones',
    icon: '📂',
    description: 'Deck, hand, discard pile',
    category: 'zones',
    zones: [
      { id: 'deck', name: 'deck', scope: 'shared', visibility: 'private' },
      { id: 'hand', name: 'hand', scope: 'perPlayer', visibility: 'owner' },
      { id: 'discard', name: 'discard', scope: 'shared', visibility: 'public' },
    ],
  },
  {
    id: 'table-zones',
    name: 'Table + Draw Pile',
    icon: '🎯',
    description: 'With central play area',
    category: 'zones',
    zones: [
      { id: 'deck', name: 'deck', scope: 'shared', visibility: 'private' },
      { id: 'hand', name: 'hand', scope: 'perPlayer', visibility: 'owner' },
      { id: 'discard', name: 'discard', scope: 'shared', visibility: 'public' },
      { id: 'table', name: 'table', scope: 'shared', visibility: 'public' },
    ],
  },
  {
    id: 'submission-zones',
    name: 'Submission Zones',
    icon: '📥',
    description: 'For judged games (CAH-style)',
    category: 'zones',
    zones: [
      { id: 'prompt-deck', name: 'promptDeck', scope: 'shared', visibility: 'private' },
      { id: 'response-deck', name: 'responseDeck', scope: 'shared', visibility: 'private' },
      { id: 'hand', name: 'hand', scope: 'perPlayer', visibility: 'owner' },
      { id: 'submissions', name: 'submissions', scope: 'shared', visibility: 'private' },
      { id: 'current-prompt', name: 'currentPrompt', scope: 'shared', visibility: 'public' },
      { id: 'discard', name: 'discard', scope: 'shared', visibility: 'public' },
    ],
  },
  {
    id: 'poker-zones',
    name: 'Poker Zones',
    icon: '🎰',
    description: 'Community cards, hole cards, muck',
    category: 'zones',
    zones: [
      { id: 'deck', name: 'deck', scope: 'shared', visibility: 'private' },
      { id: 'hand', name: 'hand', scope: 'perPlayer', visibility: 'owner' },
      { id: 'community', name: 'community', scope: 'shared', visibility: 'public' },
      { id: 'muck', name: 'muck', scope: 'shared', visibility: 'private' },
    ],
  },

  // Resource Presets
  {
    id: 'simple-score',
    name: 'Score Counter',
    icon: '🏆',
    description: 'Basic points tracking',
    category: 'resources',
    resources: [
      { id: 'score', name: 'score', initialValue: 0, min: 0 },
    ],
  },
  {
    id: 'poker-chips',
    name: 'Poker Chips',
    icon: '💰',
    description: 'Chips for betting games',
    category: 'resources',
    resources: [
      { id: 'chips', name: 'chips', initialValue: 1000, min: 0 },
    ],
  },
  {
    id: 'health-points',
    name: 'Health Points',
    icon: '❤️',
    description: 'HP with max limit',
    category: 'resources',
    resources: [
      { id: 'health', name: 'health', initialValue: 100, min: 0, max: 100 },
    ],
  },
  {
    id: 'lives-system',
    name: 'Lives System',
    icon: '💖',
    description: '3 lives, lose them all = eliminated',
    category: 'resources',
    resources: [
      { id: 'lives', name: 'lives', initialValue: 3, min: 0, max: 5 },
    ],
  },
  {
    id: 'full-rpg',
    name: 'RPG Stats',
    icon: '⚔️',
    description: 'Health, mana, gold',
    category: 'resources',
    resources: [
      { id: 'health', name: 'health', initialValue: 100, min: 0, max: 100 },
      { id: 'mana', name: 'mana', initialValue: 50, min: 0, max: 50 },
      { id: 'gold', name: 'gold', initialValue: 100, min: 0 },
    ],
  },

  // Deck Presets (with actual cards!)
  {
    id: 'deck-standard-52',
    name: 'Standard 52-Card Deck',
    icon: '🃏',
    description: 'Full deck: A-K in 4 suits',
    category: 'decks',
    cardTypes: [
      {
        id: 'playing-card',
        type: 'playing_card',
        name: 'Playing Card',
        color: '#ffffff',
        textColor: '#1a1a1a',
        properties: [
          { name: 'suit', type: 'string', label: 'Suit' },
          { name: 'rank', type: 'string', label: 'Rank' },
          { name: 'value', type: 'number', label: 'Value' },
        ],
      },
    ],
    decks: [generateStandardDeck()],
  },
  {
    id: 'deck-with-jokers',
    name: '54-Card Deck + Jokers',
    icon: '🎭',
    description: 'Standard deck + 2 jokers',
    category: 'decks',
    cardTypes: [
      {
        id: 'playing-card',
        type: 'playing_card',
        name: 'Playing Card',
        color: '#ffffff',
        textColor: '#1a1a1a',
        properties: [
          { name: 'suit', type: 'string', label: 'Suit' },
          { name: 'rank', type: 'string', label: 'Rank' },
          { name: 'value', type: 'number', label: 'Value' },
        ],
      },
      {
        id: 'joker',
        type: 'joker',
        name: 'Joker',
        color: '#ef4444',
        textColor: '#ffffff',
        properties: [
          { name: 'color', type: 'string', label: 'Color' },
        ],
      },
    ],
    decks: generateDeckWithJokers(),
  },
];

// =============================================================================
// BLOCK TEMPLATES
// =============================================================================

const blockTemplates: BlockTemplate[] = [
  // ==========================================================================
  // STRUCTURE - Scopes that contain other blocks
  // ==========================================================================
  {
    type: 'round',
    kind: 'round',
    name: 'Round',
    icon: <Repeat size={16} />,
    color: '#8b5cf6',
    description: 'A repeating round of play',
    canHaveChildren: true,
    category: 'Structure',
    defaultProperties: { iterate: 'until', maxIterations: 100 },
  },
  {
    type: 'turn',
    kind: 'turn',
    name: 'Player Turn',
    icon: <Users size={16} />,
    color: '#06b6d4',
    description: 'Each player takes a turn',
    canHaveChildren: true,
    category: 'Structure',
    defaultProperties: { iterate: 'forEachPlayer', order: 'turnOrder' },
  },
  {
    type: 'phase',
    kind: 'phase',
    name: 'Phase',
    icon: <Layers size={16} />,
    color: '#10b981',
    description: 'A distinct phase within a turn',
    canHaveChildren: true,
    category: 'Structure',
    defaultProperties: { iterate: 'once' },
  },
  {
    type: 'simultaneously',
    kind: 'phase',
    name: 'Simultaneous',
    icon: <Users size={16} />,
    color: '#0ea5e9',
    description: 'All players act at once',
    canHaveChildren: true,
    category: 'Structure',
    defaultProperties: { players: 'all' },
  },

  // ==========================================================================
  // CARDS - Card movement and manipulation
  // ==========================================================================
  {
    type: 'draw',
    kind: 'action',
    name: 'Draw Cards',
    icon: <Plus size={16} />,
    color: '#f97316',
    description: 'Draw cards from a deck',
    category: 'Cards',
    defaultProperties: { count: 1, from: 'deck', to: 'hand' },
  },
  {
    type: 'play',
    kind: 'action',
    name: 'Play Card',
    icon: <ArrowRightLeft size={16} />,
    color: '#f97316',
    description: 'Play a card to the table',
    category: 'Cards',
    defaultProperties: { from: 'hand', to: 'table' },
  },
  {
    type: 'discard',
    kind: 'action',
    name: 'Discard',
    icon: <Trash2 size={16} />,
    color: '#f97316',
    description: 'Discard cards',
    category: 'Cards',
    defaultProperties: { to: 'discard' },
  },
  {
    type: 'shuffle',
    kind: 'action',
    name: 'Shuffle',
    icon: <Shuffle size={16} />,
    color: '#f97316',
    description: 'Shuffle a deck or zone',
    category: 'Cards',
    defaultProperties: { zone: 'deck' },
  },
  {
    type: 'reveal',
    kind: 'action',
    name: 'Reveal Cards',
    icon: <Eye size={16} />,
    color: '#f97316',
    description: 'Show cards to players',
    category: 'Cards',
    defaultProperties: { to: 'all' },
  },
  {
    type: 'hide',
    kind: 'action',
    name: 'Hide Cards',
    icon: <EyeOff size={16} />,
    color: '#f97316',
    description: 'Hide cards from view',
    category: 'Cards',
  },
  {
    type: 'flip',
    kind: 'action',
    name: 'Flip Cards',
    icon: <RotateCcw size={16} />,
    color: '#f97316',
    description: 'Flip cards over',
    category: 'Cards',
  },
  {
    type: 'move',
    kind: 'action',
    name: 'Move Cards',
    icon: <ArrowRightLeft size={16} />,
    color: '#f97316',
    description: 'Move cards between zones',
    category: 'Cards',
    defaultProperties: { from: 'hand', to: 'table' },
  },

  // ==========================================================================
  // TRANSFERS - Player to player card movement
  // ==========================================================================
  {
    type: 'give',
    kind: 'action',
    name: 'Give Cards',
    icon: <ArrowRightLeft size={16} />,
    color: '#a855f7',
    description: 'Give cards to another player',
    category: 'Transfer',
    defaultProperties: { count: 1 },
  },
  {
    type: 'take',
    kind: 'action',
    name: 'Take Cards',
    icon: <ArrowRightLeft size={16} />,
    color: '#a855f7',
    description: 'Take cards from another player',
    category: 'Transfer',
    defaultProperties: { count: 1 },
  },
  {
    type: 'transfer',
    kind: 'action',
    name: 'Transfer Cards',
    icon: <ArrowRightLeft size={16} />,
    color: '#a855f7',
    description: 'Move cards between players',
    category: 'Transfer',
  },

  // ==========================================================================
  // SUBMISSIONS - For CAH-style games
  // ==========================================================================
  {
    type: 'submitCards',
    kind: 'action',
    name: 'Submit Cards',
    icon: <Target size={16} />,
    color: '#ec4899',
    description: 'Submit cards anonymously',
    category: 'Submissions',
    defaultProperties: { faceDown: true },
  },
  {
    type: 'revealSubmissions',
    kind: 'action',
    name: 'Reveal Submissions',
    icon: <Eye size={16} />,
    color: '#ec4899',
    description: 'Reveal all submissions',
    category: 'Submissions',
    defaultProperties: { shuffle: true },
  },
  {
    type: 'awardSubmission',
    kind: 'action',
    name: 'Award Winner',
    icon: <Award size={16} />,
    color: '#ec4899',
    description: 'Award points to submission owner',
    category: 'Submissions',
    defaultProperties: { points: 1 },
  },

  // ==========================================================================
  // PLAYER ACTIONS - Player interaction
  // ==========================================================================
  {
    type: 'chooseCards',
    kind: 'action',
    name: 'Choose Cards',
    icon: <Target size={16} />,
    color: '#ec4899',
    description: 'Player selects cards',
    category: 'Player',
    defaultProperties: { count: 1, from: 'hand' },
  },
  {
    type: 'prompt',
    kind: 'action',
    name: 'Prompt Choice',
    icon: <MessageSquare size={16} />,
    color: '#ec4899',
    description: 'Ask player to make a choice',
    category: 'Player',
    defaultProperties: { choices: [] },
  },
  {
    type: 'announce',
    kind: 'action',
    name: 'Announce',
    icon: <MessageSquare size={16} />,
    color: '#ec4899',
    description: 'Show a message to players',
    category: 'Player',
    defaultProperties: { to: 'all' },
  },
  {
    type: 'declare',
    kind: 'action',
    name: 'Declare',
    icon: <MessageSquare size={16} />,
    color: '#ec4899',
    description: 'Player declares something (e.g., "Uno!")',
    category: 'Player',
    defaultProperties: { declaration: '' },
  },
  {
    type: 'challenge',
    kind: 'action',
    name: 'Challenge',
    icon: <Zap size={16} />,
    color: '#ec4899',
    description: 'Challenge another player',
    category: 'Player',
  },

  // ==========================================================================
  // TURN FLOW - Turn management
  // ==========================================================================
  {
    type: 'nextPlayer',
    kind: 'action',
    name: 'Next Player',
    icon: <RotateCcw size={16} />,
    color: '#6366f1',
    description: 'Advance to next player',
    category: 'Turn',
  },
  {
    type: 'skipPlayer',
    kind: 'action',
    name: 'Skip Player',
    icon: <RotateCcw size={16} />,
    color: '#6366f1',
    description: 'Skip one or more players',
    category: 'Turn',
    defaultProperties: { count: 1 },
  },
  {
    type: 'reverseTurnOrder',
    kind: 'action',
    name: 'Reverse Order',
    icon: <RotateCcw size={16} />,
    color: '#6366f1',
    description: 'Reverse turn direction',
    category: 'Turn',
  },
  {
    type: 'grantExtraTurn',
    kind: 'action',
    name: 'Extra Turn',
    icon: <Plus size={16} />,
    color: '#6366f1',
    description: 'Grant an extra turn',
    category: 'Turn',
  },
  {
    type: 'setJudge',
    kind: 'action',
    name: 'Set Judge',
    icon: <Users size={16} />,
    color: '#6366f1',
    description: 'Set the current judge',
    category: 'Turn',
  },
  {
    type: 'rotateJudge',
    kind: 'action',
    name: 'Rotate Judge',
    icon: <RotateCcw size={16} />,
    color: '#6366f1',
    description: 'Rotate to next judge',
    category: 'Turn',
  },

  // ==========================================================================
  // SCORING - Points and scoring
  // ==========================================================================
  {
    type: 'increment',
    kind: 'action',
    name: 'Add Points',
    icon: <Award size={16} />,
    color: '#14b8a6',
    description: 'Add to a score or counter',
    category: 'Scoring',
    defaultProperties: { variable: 'score', by: 1 },
  },
  {
    type: 'decrement',
    kind: 'action',
    name: 'Remove Points',
    icon: <Award size={16} />,
    color: '#14b8a6',
    description: 'Subtract from score',
    category: 'Scoring',
    defaultProperties: { variable: 'score', by: 1 },
  },
  {
    type: 'setVariable',
    kind: 'action',
    name: 'Set Variable',
    icon: <Box size={16} />,
    color: '#14b8a6',
    description: 'Set a variable value',
    category: 'Scoring',
    defaultProperties: { name: '', value: 0 },
  },
  {
    type: 'formSet',
    kind: 'action',
    name: 'Form Set',
    icon: <Layers size={16} />,
    color: '#14b8a6',
    description: 'Group cards into a set',
    category: 'Scoring',
  },
  {
    type: 'scoreSet',
    kind: 'action',
    name: 'Score Set',
    icon: <Award size={16} />,
    color: '#14b8a6',
    description: 'Score points for a set',
    category: 'Scoring',
  },

  // ==========================================================================
  // BETTING - For poker-style games
  // ==========================================================================
  {
    type: 'bet',
    kind: 'action',
    name: 'Bet',
    icon: <Box size={16} />,
    color: '#eab308',
    description: 'Place a bet',
    category: 'Betting',
    defaultProperties: { amount: 10 },
  },
  {
    type: 'call',
    kind: 'action',
    name: 'Call',
    icon: <Box size={16} />,
    color: '#eab308',
    description: 'Match the current bet',
    category: 'Betting',
  },
  {
    type: 'raise',
    kind: 'action',
    name: 'Raise',
    icon: <Box size={16} />,
    color: '#eab308',
    description: 'Raise the bet',
    category: 'Betting',
    defaultProperties: { amount: 10 },
  },
  {
    type: 'fold',
    kind: 'action',
    name: 'Fold',
    icon: <Box size={16} />,
    color: '#eab308',
    description: 'Fold and exit the hand',
    category: 'Betting',
  },
  {
    type: 'check',
    kind: 'action',
    name: 'Check',
    icon: <Box size={16} />,
    color: '#eab308',
    description: 'Pass without betting',
    category: 'Betting',
  },
  {
    type: 'allIn',
    kind: 'action',
    name: 'All In',
    icon: <Box size={16} />,
    color: '#eab308',
    description: 'Bet all remaining chips',
    category: 'Betting',
  },
  {
    type: 'awardPot',
    kind: 'action',
    name: 'Award Pot',
    icon: <Award size={16} />,
    color: '#eab308',
    description: 'Award pot to winner',
    category: 'Betting',
  },

  // ==========================================================================
  // LOGIC - Conditionals and loops
  // ==========================================================================
  {
    type: 'if',
    kind: 'condition',
    name: 'If Condition',
    icon: <GitBranch size={16} />,
    color: '#eab308',
    description: 'Do something if condition is true',
    canHaveChildren: true,
    category: 'Logic',
    defaultProperties: { condition: '' },
  },
  {
    type: 'forEach',
    kind: 'condition',
    name: 'For Each',
    icon: <Repeat size={16} />,
    color: '#eab308',
    description: 'Repeat for each item',
    canHaveChildren: true,
    category: 'Logic',
    defaultProperties: { collection: 'players' },
  },
  {
    type: 'while',
    kind: 'condition',
    name: 'While',
    icon: <Repeat size={16} />,
    color: '#eab308',
    description: 'Repeat while condition is true',
    canHaveChildren: true,
    category: 'Logic',
  },
  {
    type: 'wait',
    kind: 'action',
    name: 'Wait',
    icon: <Clock size={16} />,
    color: '#eab308',
    description: 'Wait for a duration',
    category: 'Logic',
    defaultProperties: { seconds: 3 },
  },

  // ==========================================================================
  // TRIGGERS & WIN CONDITIONS
  // ==========================================================================
  {
    type: 'onEvent',
    kind: 'trigger',
    name: 'When Event',
    icon: <Zap size={16} />,
    color: '#ef4444',
    description: 'React to game events',
    canHaveChildren: true,
    category: 'Triggers',
    defaultProperties: { event: '' },
  },
  {
    type: 'winCondition',
    kind: 'trigger',
    name: 'Win Condition',
    icon: <Award size={16} />,
    color: '#ef4444',
    description: 'Define how to win',
    category: 'Triggers',
    defaultProperties: { condition: '' },
  },
  {
    type: 'loseCondition',
    kind: 'trigger',
    name: 'Lose Condition',
    icon: <Award size={16} />,
    color: '#ef4444',
    description: 'Define how to lose',
    category: 'Triggers',
    defaultProperties: { condition: '' },
  },
  {
    type: 'applyCardEffect',
    kind: 'action',
    name: 'Card Effect',
    icon: <Zap size={16} />,
    color: '#ef4444',
    description: 'Apply a card\'s effect',
    category: 'Triggers',
  },

  // ==========================================================================
  // COMPARISONS - For War, Poker, etc.
  // ==========================================================================
  {
    type: 'compareCards',
    kind: 'action',
    name: 'Compare Cards',
    icon: <GitBranch size={16} />,
    color: '#0ea5e9',
    description: 'Compare two cards',
    category: 'Compare',
    defaultProperties: { by: 'value' },
  },
  {
    type: 'highestCard',
    kind: 'action',
    name: 'Find Highest',
    icon: <Award size={16} />,
    color: '#0ea5e9',
    description: 'Find the highest card',
    category: 'Compare',
  },
  {
    type: 'lowestCard',
    kind: 'action',
    name: 'Find Lowest',
    icon: <Award size={16} />,
    color: '#0ea5e9',
    description: 'Find the lowest card',
    category: 'Compare',
  },
  {
    type: 'checkMatch',
    kind: 'action',
    name: 'Check Match',
    icon: <Target size={16} />,
    color: '#0ea5e9',
    description: 'Check if card matches condition',
    category: 'Compare',
  },
];

// Group templates by category
const templatesByCategory = blockTemplates.reduce((acc, template) => {
  if (!acc[template.category]) acc[template.category] = [];
  acc[template.category].push(template);
  return acc;
}, {} as Record<string, BlockTemplate[]>);

// =============================================================================
// STYLES
// =============================================================================

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
    background: 'rgba(30, 41, 59, 0.6)',
    backdropFilter: 'blur(10px)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#fdba74',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    color: '#000',
  },
  secondaryButton: {
    background: 'rgba(249, 115, 22, 0.1)',
    color: '#fdba74',
    border: '1px solid rgba(249, 115, 22, 0.3)',
  },
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  sidebar: {
    width: '280px',
    background: 'rgba(30, 41, 59, 0.4)',
    borderRight: '1px solid rgba(249, 115, 22, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '16px',
    borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    color: '#fdba74',
  },
  sidebarContent: {
    flex: 1,
    overflow: 'auto',
    padding: '12px',
  },
  category: {
    marginBottom: '16px',
  },
  categoryTitle: {
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: '#64748b',
    marginBottom: '8px',
    padding: '0 4px',
  },
  templateList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  templateBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'grab',
    transition: 'all 0.2s',
    border: '1px solid transparent',
  },
  templateIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateInfo: {
    flex: 1,
    minWidth: 0,
  },
  templateName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: '2px',
  },
  templateDesc: {
    fontSize: '11px',
    color: '#64748b',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  canvas: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  },
  canvasInner: {
    minWidth: '600px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  propertiesPanel: {
    width: '320px',
    background: 'rgba(30, 41, 59, 0.4)',
    borderLeft: '1px solid rgba(249, 115, 22, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  propertiesHeader: {
    padding: '16px',
    borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fdba74',
  },
  propertiesContent: {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
  },
  tabBar: {
    display: 'flex',
    gap: '4px',
    padding: '8px 24px',
    background: 'rgba(15, 23, 42, 0.4)',
    borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
  },
  tab: {
    padding: '10px 20px',
    borderRadius: '8px 8px 0 0',
    border: 'none',
    background: 'transparent',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  tabActive: {
    background: 'rgba(249, 115, 22, 0.15)',
    color: '#fdba74',
    borderBottom: '2px solid #f97316',
  },
  componentsContainer: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  },
  componentSection: {
    background: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(249, 115, 22, 0.2)',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  componentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
  },
  componentTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fdba74',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  componentList: {
    padding: '16px',
  },
  componentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(15, 23, 42, 0.4)',
    borderRadius: '8px',
    marginBottom: '8px',
    border: '1px solid rgba(249, 115, 22, 0.1)',
  },
  componentItemPreview: {
    width: '40px',
    height: '56px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 'bold',
  },
  componentItemInfo: {
    flex: 1,
  },
  componentItemName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#e2e8f0',
  },
  componentItemMeta: {
    fontSize: '12px',
    color: '#64748b',
  },
  componentItemActions: {
    display: 'flex',
    gap: '8px',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'rgba(249, 115, 22, 0.1)',
    border: '1px solid rgba(249, 115, 22, 0.3)',
    borderRadius: '8px',
    color: '#fdba74',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  smallInput: {
    padding: '6px 10px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(249, 115, 22, 0.2)',
    borderRadius: '6px',
    color: '#e2e8f0',
    fontSize: '13px',
    outline: 'none',
    width: '120px',
  },
  colorPicker: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '2px solid rgba(249, 115, 22, 0.3)',
    cursor: 'pointer',
    padding: 0,
    overflow: 'hidden',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: '#64748b',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5,
  },
  blockWrapper: {
    position: 'relative' as const,
    marginBottom: '8px',
  },
  block: {
    borderRadius: '12px',
    border: '2px solid',
    overflow: 'hidden',
    transition: 'all 0.2s',
  },
  blockHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    cursor: 'pointer',
  },
  blockIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockInfo: {
    flex: 1,
    minWidth: 0,
  },
  blockName: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '2px',
  },
  blockDesc: {
    fontSize: '12px',
    opacity: 0.7,
  },
  blockActions: {
    display: 'flex',
    gap: '4px',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  blockActionBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  blockChildren: {
    padding: '4px 12px 12px 24px',
    borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
  },
  dropZone: {
    border: '2px dashed rgba(249, 115, 22, 0.3)',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center' as const,
    color: '#64748b',
    fontSize: '13px',
    marginTop: '8px',
    transition: 'all 0.2s',
  },
  dropZoneActive: {
    borderColor: '#f97316',
    background: 'rgba(249, 115, 22, 0.1)',
    color: '#fdba74',
  },
  gameBlock: {
    background: 'rgba(30, 41, 59, 0.8)',
    border: '2px solid rgba(249, 115, 22, 0.4)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
  },
  gameBlockHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
  },
  gameBlockTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fdba74',
  },
  propertyGroup: {
    marginBottom: '20px',
  },
  propertyLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  propertyInput: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(249, 115, 22, 0.2)',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  propertySelect: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(249, 115, 22, 0.2)',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
  },
};

// =============================================================================
// BLOCK COMPONENT
// =============================================================================

interface BlockComponentProps {
  block: Block;
  depth: number;
  selected: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string, template: BlockTemplate) => void;
  onDrop: (targetId: string, template: BlockTemplate) => void;
}

function BlockComponent({
  block,
  depth,
  selected,
  onSelect,
  onUpdate,
  onDelete,
  onAddChild,
  onDrop,
}: BlockComponentProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const template = blockTemplates.find(t => t.type === block.type);
  const color = template?.color || '#64748b';
  const canHaveChildren = template?.canHaveChildren || block.kind !== 'action';
  const isSelected = selected === block.id;

  const handleDragOver = (e: React.DragEvent) => {
    if (!canHaveChildren) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const templateType = e.dataTransfer.getData('templateType');
    const droppedTemplate = blockTemplates.find(t => t.type === templateType);
    if (droppedTemplate) {
      onAddChild(block.id, droppedTemplate);
    }
  };

  return (
    <div style={styles.blockWrapper}>
      <div
        style={{
          ...styles.block,
          borderColor: isSelected ? color : `${color}40`,
          background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
          boxShadow: isSelected ? `0 0 20px ${color}30` : 'none',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div
          style={{
            ...styles.blockHeader,
            background: isDragOver ? `${color}20` : 'transparent',
          }}
          onClick={() => onSelect(block.id)}
        >
          {/* Collapse toggle */}
          {canHaveChildren && (
            <button
              style={{
                ...styles.blockActionBtn,
                background: 'transparent',
                opacity: 0.6,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(block.id, { collapsed: !block.collapsed });
              }}
            >
              {block.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          {/* Icon */}
          <div style={{ ...styles.blockIcon, background: color }}>
            {template?.icon || <Box size={16} />}
          </div>

          {/* Info */}
          <div style={styles.blockInfo}>
            <div style={{ ...styles.blockName, color }}>{block.name}</div>
            {block.description && (
              <div style={styles.blockDesc}>{block.description}</div>
            )}
          </div>

          {/* Actions */}
          <div style={{ ...styles.blockActions, opacity: isHovered ? 1 : 0 }}>
            <button
              style={styles.blockActionBtn}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(block.id);
              }}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Children */}
        {canHaveChildren && !block.collapsed && (
          <div style={styles.blockChildren}>
            {block.children?.map(child => (
              <BlockComponent
                key={child.id}
                block={child}
                depth={depth + 1}
                selected={selected}
                onSelect={onSelect}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onAddChild={onAddChild}
                onDrop={onDrop}
              />
            ))}

            {/* Drop zone */}
            <div
              style={{
                ...styles.dropZone,
                ...(isDragOver ? styles.dropZoneActive : {}),
              }}
            >
              <Plus size={16} style={{ marginBottom: '4px', opacity: 0.5 }} />
              <div>Drop blocks here or click to add</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// PROPERTY EDITOR
// =============================================================================

interface PropertyEditorProps {
  block: Block | null;
  onUpdate: (id: string, updates: Partial<Block>) => void;
}

function PropertyEditor({ block, onUpdate }: PropertyEditorProps) {
  if (!block) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>🎯</div>
        <div style={{ marginBottom: '8px', fontWeight: '600', color: '#94a3b8' }}>
          Select a Block
        </div>
        <div style={{ fontSize: '13px' }}>
          Click on any block to edit its properties
        </div>
      </div>
    );
  }

  const template = blockTemplates.find(t => t.type === block.type);

  return (
    <div>
      {/* Block Name */}
      <div style={styles.propertyGroup}>
        <label style={styles.propertyLabel}>Block Name</label>
        <input
          style={styles.propertyInput}
          value={block.name}
          onChange={(e) => onUpdate(block.id, { name: e.target.value })}
          placeholder="Block name..."
        />
      </div>

      {/* Block Description */}
      <div style={styles.propertyGroup}>
        <label style={styles.propertyLabel}>Description</label>
        <input
          style={styles.propertyInput}
          value={block.description || ''}
          onChange={(e) => onUpdate(block.id, { description: e.target.value })}
          placeholder="Optional description..."
        />
      </div>

      {/* Type-specific properties */}
      {block.type === 'draw' && (
        <>
          <div style={styles.propertyGroup}>
            <label style={styles.propertyLabel}>Number of Cards</label>
            <input
              type="number"
              style={styles.propertyInput}
              value={block.properties?.count || 1}
              onChange={(e) => onUpdate(block.id, {
                properties: { ...block.properties, count: parseInt(e.target.value) || 1 }
              })}
              min={1}
            />
          </div>
          <div style={styles.propertyGroup}>
            <label style={styles.propertyLabel}>Draw From</label>
            <select
              style={styles.propertySelect}
              value={block.properties?.from || 'deck'}
              onChange={(e) => onUpdate(block.id, {
                properties: { ...block.properties, from: e.target.value }
              })}
            >
              <option value="deck">Main Deck</option>
              <option value="discard">Discard Pile</option>
              <option value="whiteDeck">White Cards</option>
              <option value="blackDeck">Black Cards</option>
            </select>
          </div>
        </>
      )}

      {block.type === 'chooseCards' && (
        <>
          <div style={styles.propertyGroup}>
            <label style={styles.propertyLabel}>Number to Choose</label>
            <input
              type="number"
              style={styles.propertyInput}
              value={block.properties?.count || 1}
              onChange={(e) => onUpdate(block.id, {
                properties: { ...block.properties, count: parseInt(e.target.value) || 1 }
              })}
              min={1}
            />
          </div>
          <div style={styles.propertyGroup}>
            <label style={styles.propertyLabel}>Choose From</label>
            <select
              style={styles.propertySelect}
              value={block.properties?.from || 'hand'}
              onChange={(e) => onUpdate(block.id, {
                properties: { ...block.properties, from: e.target.value }
              })}
            >
              <option value="hand">Player's Hand</option>
              <option value="table">Table</option>
              <option value="submissions">Submissions</option>
            </select>
          </div>
        </>
      )}

      {block.type === 'increment' && (
        <>
          <div style={styles.propertyGroup}>
            <label style={styles.propertyLabel}>Variable Name</label>
            <input
              style={styles.propertyInput}
              value={block.properties?.variable || 'score'}
              onChange={(e) => onUpdate(block.id, {
                properties: { ...block.properties, variable: e.target.value }
              })}
              placeholder="e.g., score"
            />
          </div>
          <div style={styles.propertyGroup}>
            <label style={styles.propertyLabel}>Add Amount</label>
            <input
              type="number"
              style={styles.propertyInput}
              value={block.properties?.by || 1}
              onChange={(e) => onUpdate(block.id, {
                properties: { ...block.properties, by: parseInt(e.target.value) || 1 }
              })}
            />
          </div>
        </>
      )}

      {block.type === 'announce' && (
        <div style={styles.propertyGroup}>
          <label style={styles.propertyLabel}>Message</label>
          <textarea
            style={{ ...styles.propertyInput, minHeight: '80px', resize: 'vertical' as const }}
            value={block.properties?.message || ''}
            onChange={(e) => onUpdate(block.id, {
              properties: { ...block.properties, message: e.target.value }
            })}
            placeholder="Message to show players..."
          />
        </div>
      )}

      {(block.type === 'round' || block.type === 'turn' || block.type === 'phase') && (
        <div style={styles.propertyGroup}>
          <label style={styles.propertyLabel}>Loop Type</label>
          <select
            style={styles.propertySelect}
            value={block.properties?.iterate || 'once'}
            onChange={(e) => onUpdate(block.id, {
              properties: { ...block.properties, iterate: e.target.value }
            })}
          >
            <option value="once">Run Once</option>
            <option value="forEachPlayer">For Each Player</option>
            <option value="until">Until Condition</option>
            <option value="while">While Condition</option>
            <option value="repeat">Repeat N Times</option>
          </select>
        </div>
      )}

      {/* Help text */}
      <div style={{
        marginTop: '24px',
        padding: '12px',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#60a5fa',
      }}>
        <HelpCircle size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
        {template?.description || 'Configure this block\'s behavior'}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN BUILDER PAGE
// =============================================================================

export default function GameBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameIdParam = searchParams.get('id');

  const [gameName, setGameName] = useState('My Custom Game');
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(gameIdParam);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loading, setLoading] = useState(!!gameIdParam);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<BuilderTab>('flow');
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gamekit-recent-blocks');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Game Components State
  const [cardTypes, setCardTypes] = useState<CardTypeDefinition[]>([
    { id: 'white', type: 'white', name: 'Response Card', color: '#ffffff', textColor: '#1a1a1a', properties: [{ name: 'text', type: 'string', label: 'Card Text' }] },
    { id: 'black', type: 'black', name: 'Prompt Card', color: '#1a1a1a', textColor: '#ffffff', properties: [{ name: 'text', type: 'string', label: 'Prompt Text' }, { name: 'pick', type: 'number', label: 'Cards to Pick' }] },
  ]);
  const [zones, setZones] = useState<ZoneDefinition[]>([
    { id: 'deck', name: 'deck', scope: 'shared', visibility: 'private' },
    { id: 'discard', name: 'discard', scope: 'shared', visibility: 'public' },
    { id: 'hand', name: 'hand', scope: 'perPlayer', visibility: 'owner' },
    { id: 'table', name: 'table', scope: 'shared', visibility: 'public' },
  ]);
  const [resources, setResources] = useState<ResourceDefinition[]>([
    { id: 'score', name: 'score', initialValue: 0, min: 0 },
  ]);
  const [decks, setDecks] = useState<DeckDefinition[]>([]);

  // Track recently used blocks
  const trackBlockUsage = useCallback((templateType: string) => {
    setRecentlyUsed(prev => {
      const updated = [templateType, ...prev.filter(t => t !== templateType)].slice(0, 8);
      if (typeof window !== 'undefined') {
        localStorage.setItem('gamekit-recent-blocks', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  // Toggle category collapse
  const toggleCategory = useCallback((category: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);
  const [blocks, setBlocks] = useState<Block[]>([
    {
      id: 'setup',
      kind: 'phase',
      type: 'phase',
      name: 'Setup',
      description: 'Initial game setup',
      children: [
        { id: 'shuffle-deck', kind: 'action', type: 'shuffle', name: 'Shuffle Deck', properties: { zone: 'deck' } },
        { id: 'deal-cards', kind: 'action', type: 'draw', name: 'Deal Starting Cards', properties: { count: 7, from: 'deck' } },
      ],
    },
    {
      id: 'main-loop',
      kind: 'round',
      type: 'round',
      name: 'Game Round',
      description: 'Main game loop',
      properties: { iterate: 'until', condition: 'winner' },
      children: [
        {
          id: 'player-turn',
          kind: 'turn',
          type: 'turn',
          name: 'Player Turn',
          properties: { iterate: 'forEachPlayer' },
          children: [
            { id: 'draw-phase', kind: 'action', type: 'draw', name: 'Draw Card', properties: { count: 1 } },
            { id: 'play-phase', kind: 'action', type: 'chooseCards', name: 'Choose Card to Play', properties: { count: 1, from: 'hand' } },
          ],
        },
      ],
    },
  ]);

  const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const findBlockById = (blocks: Block[], id: string): Block | null => {
    for (const block of blocks) {
      if (block.id === id) return block;
      if (block.children) {
        const found = findBlockById(block.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const updateBlockById = (blocks: Block[], id: string, updates: Partial<Block>): Block[] => {
    return blocks.map(block => {
      if (block.id === id) {
        return { ...block, ...updates };
      }
      if (block.children) {
        return { ...block, children: updateBlockById(block.children, id, updates) };
      }
      return block;
    });
  };

  const deleteBlockById = (blocks: Block[], id: string): Block[] => {
    return blocks.filter(block => {
      if (block.id === id) return false;
      if (block.children) {
        block.children = deleteBlockById(block.children, id);
      }
      return true;
    });
  };

  const addChildToBlock = (blocks: Block[], parentId: string, newBlock: Block): Block[] => {
    return blocks.map(block => {
      if (block.id === parentId) {
        return {
          ...block,
          children: [...(block.children || []), newBlock],
        };
      }
      if (block.children) {
        return { ...block, children: addChildToBlock(block.children, parentId, newBlock) };
      }
      return block;
    });
  };

  const handleUpdate = (id: string, updates: Partial<Block>) => {
    setBlocks(prev => updateBlockById(prev, id, updates));
  };

  const handleDelete = (id: string) => {
    setBlocks(prev => deleteBlockById(prev, id));
    if (selectedBlock === id) setSelectedBlock(null);
  };

  const handleAddChild = (parentId: string, template: BlockTemplate) => {
    const newBlock: Block = {
      id: generateId(),
      kind: template.kind,
      type: template.type,
      name: template.name,
      description: template.description,
      properties: { ...template.defaultProperties },
      children: template.canHaveChildren ? [] : undefined,
    };
    setBlocks(prev => addChildToBlock(prev, parentId, newBlock));
    trackBlockUsage(template.type);
  };

  const handleDragStart = (e: React.DragEvent, template: BlockTemplate) => {
    e.dataTransfer.setData('templateType', template.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const templateType = e.dataTransfer.getData('templateType');
    const template = blockTemplates.find(t => t.type === templateType);
    if (template) {
      const newBlock: Block = {
        id: generateId(),
        kind: template.kind,
        type: template.type,
        name: template.name,
        description: template.description,
        properties: { ...template.defaultProperties },
        children: template.canHaveChildren ? [] : undefined,
      };
      setBlocks(prev => [...prev, newBlock]);
      trackBlockUsage(template.type);
    }
  };

  // Convert blocks to DSL format for saving
  const blocksToDSL = useCallback(() => {
    return {
      id: gameId || 'new-game',
      name: gameName,
      version: '1.0.0',
      description: 'A custom card game built with the visual editor',
      players: { min: 3, max: 10, initial: [] },
      cardTypes: cardTypes.map(ct => ({
        type: ct.type,
        name: ct.name,
        display: { color: ct.color, textColor: ct.textColor, template: '{{text}}' },
        properties: ct.properties.map(p => ({
          name: p.name,
          type: p.type,
          label: p.label,
          ...(p.default !== undefined ? { default: { type: 'literal', value: p.default } } : {}),
        })),
      })),
      zones: zones.map(z => ({
        name: z.name,
        scope: z.scope,
        visibility: z.visibility,
      })),
      resources: resources.map(r => ({
        name: r.name,
        initialValue: r.initialValue,
        min: r.min,
        max: r.max,
      })),
      decks: decks.map(d => ({
        name: d.name,
        cardType: d.cardType,
        cards: d.cards,
      })),
      setup: { id: 'setup', name: 'Setup', kind: 'phase', children: [] },
      main: { id: 'main', name: 'Main Game', kind: 'game', children: blocks },
      winConditions: [],
    };
  }, [gameId, gameName, blocks, cardTypes, zones, resources, decks]);

  // Load existing game
  useEffect(() => {
    if (!gameIdParam) {
      setLoading(false);
      return;
    }

    const loadGame = async () => {
      try {
        const res = await fetch(`/api/game-kit/dsl/${gameIdParam}`);
        if (!res.ok) throw new Error('Failed to load game');
        const game = await res.json();
        setGameName(game.name);
        setGameId(game.id);

        // Load blocks from gameConfig if it has a main scope with children
        if (game.gameConfig?.main?.children) {
          setBlocks(game.gameConfig.main.children);
        }

        // Load card types
        if (game.gameConfig?.cardTypes?.length) {
          setCardTypes(game.gameConfig.cardTypes.map((ct: any, idx: number) => ({
            id: ct.type || `card-${idx}`,
            type: ct.type,
            name: ct.name,
            color: ct.display?.color || '#3b82f6',
            textColor: ct.display?.textColor || '#ffffff',
            properties: ct.properties || [],
          })));
        }

        // Load zones
        if (game.gameConfig?.zones?.length) {
          setZones(game.gameConfig.zones.map((z: any, idx: number) => ({
            id: z.name || `zone-${idx}`,
            name: z.name,
            scope: z.scope || 'shared',
            visibility: z.visibility || 'public',
          })));
        }

        // Load resources
        if (game.gameConfig?.resources?.length) {
          setResources(game.gameConfig.resources.map((r: any, idx: number) => ({
            id: r.name || `resource-${idx}`,
            name: r.name,
            initialValue: r.initialValue || 0,
            min: r.min,
            max: r.max,
          })));
        }

        // Load decks
        if (game.gameConfig?.decks?.length) {
          setDecks(game.gameConfig.decks.map((d: any, idx: number) => ({
            id: d.name || `deck-${idx}`,
            name: d.name,
            cardType: d.cardType,
            cards: d.cards || [],
          })));
        }
      } catch (error) {
        console.error('Failed to load game:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [gameIdParam]);

  // Save game
  const saveGame = async (): Promise<string | null> => {
    setSaving(true);
    setSaveStatus('saving');
    try {
      const dslDefinition = blocksToDSL();

      if (gameId) {
        // Update existing
        const res = await fetch(`/api/game-kit/dsl/${gameId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: gameName, dslDefinition }),
        });
        if (!res.ok) throw new Error('Failed to save');
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        return gameId;
      } else {
        // Create new
        const res = await fetch('/api/game-kit/dsl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: gameName, dslDefinition }),
        });
        if (!res.ok) throw new Error('Failed to create');
        const game = await res.json();
        setGameId(game.id);
        // Update URL without full navigation
        window.history.replaceState({}, '', `/game-kit/builder?id=${game.id}`);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        return game.id;
      }
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Play game
  const handlePlay = async () => {
    const savedId = await saveGame();
    if (savedId) {
      // Generate a room code
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      router.push(`/play-online/${roomCode}?game=${savedId}`);
    }
  };

  const selectedBlockData = selectedBlock ? findBlockById(blocks, selectedBlock) : null;

  if (loading) {
    return (
      <div style={{ ...styles.container, justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 size={48} style={{ color: '#f97316', animation: 'spin 1s linear infinite' }} />
        <div style={{ marginTop: '16px', color: '#94a3b8' }}>Loading game...</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <Link
            href="/game-kit"
            style={styles.backButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
              e.currentTarget.style.color = '#fdba74';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <ArrowLeft size={18} />
            Back
          </Link>

          <div style={styles.title}>
            <Sparkles size={20} style={{ color: '#f97316' }} />
            <input
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fdba74',
                fontSize: '20px',
                fontWeight: 'bold',
                width: '200px',
              }}
            />
          </div>
        </div>

        <div style={styles.headerRight}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={() => {
              const dsl = blocksToDSL();
              console.log('DSL Definition:', JSON.stringify(dsl, null, 2));
              alert('DSL logged to console');
            }}
          >
            <Code size={16} />
            View Code
          </button>
          <button
            style={{
              ...styles.button,
              ...styles.secondaryButton,
              opacity: saving ? 0.7 : 1,
            }}
            onClick={saveGame}
            disabled={saving}
          >
            {saveStatus === 'saving' ? (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : saveStatus === 'saved' ? (
              <Check size={16} style={{ color: '#10b981' }} />
            ) : (
              <Save size={16} />
            )}
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save'}
          </button>
          <button
            style={{
              ...styles.button,
              ...styles.primaryButton,
              opacity: saving ? 0.7 : 1,
            }}
            onClick={handlePlay}
            disabled={saving}
          >
            <Play size={16} />
            Test Game
          </button>
        </div>
      </header>

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'flow' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('flow')}
        >
          <GitBranch size={16} />
          Game Flow
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'components' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('components')}
        >
          <Box size={16} />
          Components
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Components Tab */}
        {activeTab === 'components' && (
          <div style={styles.componentsContainer}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              {/* Quick Add Section */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Sparkles size={18} style={{ color: '#a78bfa' }} />
                  <span style={{ fontWeight: 'bold', color: '#c4b5fd', fontSize: '16px' }}>Quick Add Presets</span>
                </div>

                {/* Card Presets */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Card Types
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {componentPresets.filter(p => p.category === 'cards').map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          if (preset.cardTypes) {
                            setCardTypes(prev => [
                              ...prev,
                              ...preset.cardTypes!.map(ct => ({
                                ...ct,
                                id: `${ct.id}-${Date.now()}`,
                              })),
                            ]);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          background: 'rgba(30, 41, 59, 0.6)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '8px',
                          color: '#e2e8f0',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#8b5cf6';
                          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
                        }}
                        title={preset.description}
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zone Presets */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Zones
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {componentPresets.filter(p => p.category === 'zones').map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          if (preset.zones) {
                            setZones(prev => [
                              ...prev,
                              ...preset.zones!.map(z => ({
                                ...z,
                                id: `${z.id}-${Date.now()}`,
                              })),
                            ]);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          background: 'rgba(30, 41, 59, 0.6)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '8px',
                          color: '#e2e8f0',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#8b5cf6';
                          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
                        }}
                        title={preset.description}
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resource Presets */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Resources
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {componentPresets.filter(p => p.category === 'resources').map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          if (preset.resources) {
                            setResources(prev => [
                              ...prev,
                              ...preset.resources!.map(r => ({
                                ...r,
                                id: `${r.id}-${Date.now()}`,
                              })),
                            ]);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          background: 'rgba(30, 41, 59, 0.6)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '8px',
                          color: '#e2e8f0',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#8b5cf6';
                          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
                        }}
                        title={preset.description}
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deck Presets */}
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Pre-built Decks (with cards!)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {componentPresets.filter(p => p.category === 'decks').map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          // Add card types if provided
                          if (preset.cardTypes) {
                            setCardTypes(prev => [
                              ...prev,
                              ...preset.cardTypes!.map(ct => ({
                                ...ct,
                                id: `${ct.id}-${Date.now()}`,
                              })),
                            ]);
                          }
                          // Add decks if provided
                          if (preset.decks) {
                            setDecks(prev => [
                              ...prev,
                              ...preset.decks!.map(d => ({
                                ...d,
                                id: `${d.id}-${Date.now()}`,
                              })),
                            ]);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                          border: '1px solid rgba(59, 130, 246, 0.4)',
                          borderRadius: '8px',
                          color: '#e2e8f0',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)';
                        }}
                        title={preset.description}
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.name}</span>
                        <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: '4px' }}>
                          ({preset.decks?.reduce((sum, d) => sum + d.cards.length, 0) || 0} cards)
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Types Section */}
              <div style={styles.componentSection}>
                <div style={styles.componentHeader}>
                  <div style={styles.componentTitle}>
                    <Palette size={18} />
                    Card Types
                  </div>
                  <button
                    style={styles.addButton}
                    onClick={() => {
                      const id = `card-${Date.now()}`;
                      setCardTypes(prev => [...prev, {
                        id,
                        type: `card${prev.length + 1}`,
                        name: `Card Type ${prev.length + 1}`,
                        color: '#3b82f6',
                        textColor: '#ffffff',
                        properties: [{ name: 'text', type: 'string', label: 'Card Text' }],
                      }]);
                    }}
                  >
                    <Plus size={14} />
                    Add Card Type
                  </button>
                </div>
                <div style={styles.componentList}>
                  {cardTypes.map((ct, idx) => (
                    <div key={ct.id} style={styles.componentItem}>
                      <div
                        style={{
                          ...styles.componentItemPreview,
                          background: ct.color,
                          color: ct.textColor,
                          border: ct.color === '#ffffff' ? '1px solid #333' : 'none',
                        }}
                      >
                        Aa
                      </div>
                      <div style={styles.componentItemInfo}>
                        <input
                          style={{ ...styles.smallInput, fontWeight: '600' }}
                          value={ct.name}
                          onChange={(e) => {
                            const updated = [...cardTypes];
                            updated[idx].name = e.target.value;
                            setCardTypes(updated);
                          }}
                        />
                        <div style={styles.componentItemMeta}>
                          Type: <input
                            style={{ ...styles.smallInput, width: '80px', marginLeft: '4px' }}
                            value={ct.type}
                            onChange={(e) => {
                              const updated = [...cardTypes];
                              updated[idx].type = e.target.value.toLowerCase().replace(/\s+/g, '_');
                              setCardTypes(updated);
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                          Properties: {ct.properties.length > 0
                            ? ct.properties.map(p => p.name).join(', ')
                            : <span style={{ fontStyle: 'italic' }}>none</span>}
                        </div>
                      </div>
                      <div style={styles.componentItemActions}>
                        <input
                          type="color"
                          value={ct.color}
                          onChange={(e) => {
                            const updated = [...cardTypes];
                            updated[idx].color = e.target.value;
                            setCardTypes(updated);
                          }}
                          style={styles.colorPicker}
                          title="Card color"
                        />
                        <input
                          type="color"
                          value={ct.textColor}
                          onChange={(e) => {
                            const updated = [...cardTypes];
                            updated[idx].textColor = e.target.value;
                            setCardTypes(updated);
                          }}
                          style={styles.colorPicker}
                          title="Text color"
                        />
                        <button
                          style={{
                            ...styles.blockActionBtn,
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                          }}
                          onClick={() => setCardTypes(prev => prev.filter(c => c.id !== ct.id))}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zones Section */}
              <div style={styles.componentSection}>
                <div style={styles.componentHeader}>
                  <div style={styles.componentTitle}>
                    <Layers size={18} />
                    Zones
                  </div>
                  <button
                    style={styles.addButton}
                    onClick={() => {
                      const id = `zone-${Date.now()}`;
                      setZones(prev => [...prev, {
                        id,
                        name: `zone${prev.length + 1}`,
                        scope: 'shared',
                        visibility: 'public',
                      }]);
                    }}
                  >
                    <Plus size={14} />
                    Add Zone
                  </button>
                </div>
                <div style={styles.componentList}>
                  {zones.map((zone, idx) => (
                    <div key={zone.id} style={styles.componentItem}>
                      <div
                        style={{
                          ...styles.componentItemPreview,
                          background: 'rgba(139, 92, 246, 0.2)',
                          border: '2px dashed #8b5cf6',
                          fontSize: '18px',
                        }}
                      >
                        📂
                      </div>
                      <div style={styles.componentItemInfo}>
                        <input
                          style={{ ...styles.smallInput, fontWeight: '600' }}
                          value={zone.name}
                          onChange={(e) => {
                            const updated = [...zones];
                            updated[idx].name = e.target.value.toLowerCase().replace(/\s+/g, '_');
                            setZones(updated);
                          }}
                        />
                        <div style={styles.componentItemMeta}>
                          <select
                            style={{ ...styles.smallInput, width: '100px' }}
                            value={zone.scope}
                            onChange={(e) => {
                              const updated = [...zones];
                              updated[idx].scope = e.target.value as 'shared' | 'perPlayer';
                              setZones(updated);
                            }}
                          >
                            <option value="shared">Shared</option>
                            <option value="perPlayer">Per Player</option>
                          </select>
                          <select
                            style={{ ...styles.smallInput, width: '100px', marginLeft: '8px' }}
                            value={zone.visibility}
                            onChange={(e) => {
                              const updated = [...zones];
                              updated[idx].visibility = e.target.value as 'public' | 'private' | 'owner';
                              setZones(updated);
                            }}
                          >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                            <option value="owner">Owner Only</option>
                          </select>
                        </div>
                      </div>
                      <div style={styles.componentItemActions}>
                        <button
                          style={{
                            ...styles.blockActionBtn,
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                          }}
                          onClick={() => setZones(prev => prev.filter(z => z.id !== zone.id))}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resources Section */}
              <div style={styles.componentSection}>
                <div style={styles.componentHeader}>
                  <div style={styles.componentTitle}>
                    <Award size={18} />
                    Player Resources
                  </div>
                  <button
                    style={styles.addButton}
                    onClick={() => {
                      const id = `resource-${Date.now()}`;
                      setResources(prev => [...prev, {
                        id,
                        name: `resource${prev.length + 1}`,
                        initialValue: 0,
                        min: 0,
                      }]);
                    }}
                  >
                    <Plus size={14} />
                    Add Resource
                  </button>
                </div>
                <div style={styles.componentList}>
                  {resources.map((resource, idx) => (
                    <div key={resource.id} style={styles.componentItem}>
                      <div
                        style={{
                          ...styles.componentItemPreview,
                          background: 'linear-gradient(135deg, #eab308 0%, #f97316 100%)',
                          color: '#000',
                          fontSize: '14px',
                        }}
                      >
                        {resource.initialValue}
                      </div>
                      <div style={styles.componentItemInfo}>
                        <input
                          style={{ ...styles.smallInput, fontWeight: '600' }}
                          value={resource.name}
                          onChange={(e) => {
                            const updated = [...resources];
                            updated[idx].name = e.target.value.toLowerCase().replace(/\s+/g, '_');
                            setResources(updated);
                          }}
                        />
                        <div style={styles.componentItemMeta}>
                          Start:
                          <input
                            type="number"
                            style={{ ...styles.smallInput, width: '60px', marginLeft: '4px' }}
                            value={resource.initialValue}
                            onChange={(e) => {
                              const updated = [...resources];
                              updated[idx].initialValue = parseInt(e.target.value) || 0;
                              setResources(updated);
                            }}
                          />
                          Min:
                          <input
                            type="number"
                            style={{ ...styles.smallInput, width: '50px', marginLeft: '4px' }}
                            value={resource.min ?? ''}
                            placeholder="∞"
                            onChange={(e) => {
                              const updated = [...resources];
                              updated[idx].min = e.target.value ? parseInt(e.target.value) : undefined;
                              setResources(updated);
                            }}
                          />
                          Max:
                          <input
                            type="number"
                            style={{ ...styles.smallInput, width: '50px', marginLeft: '4px' }}
                            value={resource.max ?? ''}
                            placeholder="∞"
                            onChange={(e) => {
                              const updated = [...resources];
                              updated[idx].max = e.target.value ? parseInt(e.target.value) : undefined;
                              setResources(updated);
                            }}
                          />
                        </div>
                      </div>
                      <div style={styles.componentItemActions}>
                        <button
                          style={{
                            ...styles.blockActionBtn,
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                          }}
                          onClick={() => {
                            setResources(prev => prev.filter(r => r.id !== resource.id));
                          }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {resources.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                      No resources defined. Add one to track things like score, chips, or health.
                    </div>
                  )}
                </div>
              </div>

              {/* Decks Section */}
              <div style={styles.componentSection}>
                <div style={styles.componentHeader}>
                  <div style={styles.componentTitle}>
                    <Layers size={18} />
                    Decks ({decks.reduce((sum, d) => sum + d.cards.length, 0)} cards total)
                  </div>
                  <button
                    style={styles.addButton}
                    onClick={() => {
                      const id = `deck-${Date.now()}`;
                      setDecks(prev => [...prev, {
                        id,
                        name: `deck${prev.length + 1}`,
                        cardType: cardTypes[0]?.type || 'card',
                        cards: [],
                      }]);
                    }}
                  >
                    <Plus size={14} />
                    Add Deck
                  </button>
                </div>
                <div style={styles.componentList}>
                  {decks.map((deck, idx) => (
                    <div key={deck.id} style={styles.componentItem}>
                      <div
                        style={{
                          ...styles.componentItemPreview,
                          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        {deck.cards.length}
                      </div>
                      <div style={styles.componentItemInfo}>
                        <input
                          style={{ ...styles.smallInput, fontWeight: '600' }}
                          value={deck.name}
                          onChange={(e) => {
                            const updated = [...decks];
                            updated[idx].name = e.target.value.toLowerCase().replace(/\s+/g, '_');
                            setDecks(updated);
                          }}
                        />
                        <div style={styles.componentItemMeta}>
                          Card type:
                          <select
                            style={{ ...styles.smallInput, width: '120px', marginLeft: '4px' }}
                            value={deck.cardType}
                            onChange={(e) => {
                              const updated = [...decks];
                              updated[idx].cardType = e.target.value;
                              setDecks(updated);
                            }}
                          >
                            {cardTypes.map(ct => (
                              <option key={ct.type} value={ct.type}>{ct.name}</option>
                            ))}
                          </select>
                          • {deck.cards.length} cards
                        </div>
                      </div>
                      <div style={styles.componentItemActions}>
                        <button
                          style={{
                            ...styles.blockActionBtn,
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                          }}
                          onClick={() => setDecks(prev => prev.filter(d => d.id !== deck.id))}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {decks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                      No decks defined. Use Quick Add presets above to add a standard deck, or add one manually.
                    </div>
                  )}
                </div>
              </div>

              {/* Help Info */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <HelpCircle size={20} style={{ color: '#60a5fa', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: '600', color: '#60a5fa', marginBottom: '8px' }}>About Game Components</div>
                    <div style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6' }}>
                      <strong>Card Types</strong> define what kinds of cards exist in your game (e.g., Question cards, Answer cards, Action cards).<br />
                      <strong>Zones</strong> are where cards can be placed (e.g., deck, hand, discard pile, table).<br />
                      <strong>Resources</strong> track player values like score, chips, health, or money.<br />
                      <strong>Decks</strong> contain the actual cards in your game. Use presets for standard decks.<br /><br />
                      These components are used in your Game Flow to define how the game works.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Left Sidebar - Block Palette (only in Flow tab) */}
        {activeTab === 'flow' && <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <Palette size={14} style={{ marginRight: '8px' }} />
            Block Palette
          </div>
          <div style={styles.sidebarContent}>
            {/* Recently Used Section */}
            {recentlyUsed.length > 0 && (
              <div style={{ ...styles.category, marginBottom: '20px' }}>
                <div
                  style={{
                    ...styles.categoryTitle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    marginLeft: '-4px',
                    marginRight: '-4px',
                    borderRadius: '4px',
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
                    color: '#fdba74',
                  }}
                  onClick={() => toggleCategory('_recent')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={12} />
                    Recently Used
                  </span>
                  {collapsedCategories.has('_recent') ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </div>
                {!collapsedCategories.has('_recent') && (
                  <div style={{ ...styles.templateList, marginTop: '8px' }}>
                    {recentlyUsed.map(type => {
                      const template = blockTemplates.find(t => t.type === type);
                      if (!template) return null;
                      return (
                        <div
                          key={`recent-${template.type}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, template)}
                          style={{
                            ...styles.templateBlock,
                            background: `${template.color}10`,
                            padding: '8px 10px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${template.color}20`;
                            e.currentTarget.style.borderColor = `${template.color}40`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = `${template.color}10`;
                            e.currentTarget.style.borderColor = 'transparent';
                          }}
                        >
                          <div style={{ ...styles.templateIcon, background: template.color, width: '24px', height: '24px' }}>
                            {template.icon}
                          </div>
                          <div style={styles.templateInfo}>
                            <div style={{ ...styles.templateName, fontSize: '12px' }}>{template.name}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Category Sections */}
            {Object.entries(templatesByCategory).map(([category, templates]) => (
              <div key={category} style={styles.category}>
                <div
                  style={{
                    ...styles.categoryTitle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    marginLeft: '-4px',
                    marginRight: '-4px',
                    borderRadius: '4px',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => toggleCategory(category)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span>{category}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '10px', opacity: 0.6 }}>{templates.length}</span>
                    {collapsedCategories.has(category) ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  </span>
                </div>
                {!collapsedCategories.has(category) && (
                  <div style={styles.templateList}>
                    {templates.map(template => (
                      <div
                        key={template.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, template)}
                        style={{
                          ...styles.templateBlock,
                          background: `${template.color}10`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `${template.color}20`;
                          e.currentTarget.style.borderColor = `${template.color}40`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = `${template.color}10`;
                          e.currentTarget.style.borderColor = 'transparent';
                        }}
                      >
                        <div style={{ ...styles.templateIcon, background: template.color }}>
                          {template.icon}
                        </div>
                        <div style={styles.templateInfo}>
                          <div style={styles.templateName}>{template.name}</div>
                          <div style={styles.templateDesc}>{template.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>}

        {/* Center - Canvas (only in Flow tab) */}
        {activeTab === 'flow' && (
          <div
            style={styles.canvas}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleCanvasDrop}
          >
            <div style={styles.canvasInner}>
              {/* Game Info Block */}
              <div style={styles.gameBlock}>
                <div style={styles.gameBlockHeader}>
                  <Sparkles size={24} style={{ color: '#f97316' }} />
                  <div style={styles.gameBlockTitle}>{gameName}</div>
                </div>

                {/* Blocks */}
                {blocks.map(block => (
                  <BlockComponent
                    key={block.id}
                    block={block}
                    depth={0}
                    selected={selectedBlock}
                    onSelect={setSelectedBlock}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onAddChild={handleAddChild}
                    onDrop={(targetId, template) => handleAddChild(targetId, template)}
                  />
                ))}

                {/* Root drop zone */}
                {blocks.length === 0 && (
                  <div style={{ ...styles.dropZone, padding: '40px' }}>
                    <Plus size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <div style={{ fontSize: '15px', marginBottom: '4px' }}>
                      Drag blocks here to start building
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>
                      Add rounds, turns, and actions to define your game
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right Sidebar - Properties (only in Flow tab) */}
        {activeTab === 'flow' && (
          <div style={styles.propertiesPanel}>
            <div style={styles.propertiesHeader}>
              <Settings size={16} />
              Properties
            </div>
            <div style={styles.propertiesContent}>
              <PropertyEditor
                block={selectedBlockData}
                onUpdate={handleUpdate}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
