/**
 * Cards Against Humanity Game Definition
 * This configures the CAH game using the generic game engine
 */

import type { GameDefinition, CardPack, Card } from '../types';
import { generateId } from '../utils';

// =============================================================================
// GAME DEFINITION
// =============================================================================

export const CAH_DEFINITION: GameDefinition = {
  id: 'cah',
  name: 'Cards Against Humanity',
  description: 'A party game for horrible people. Fill in the blank with the funniest response.',
  minPlayers: 3,
  maxPlayers: 20,

  // Deck configuration - two decks: black (prompts) and white (responses)
  decks: {
    black: {
      displayName: 'Black Cards',
      cardType: 'black',
    },
    white: {
      displayName: 'White Cards',
      cardType: 'white',
    },
  },

  // Slot definitions
  slots: [
    {
      id: 'hand',
      name: 'Hand',
      scope: 'player',
      capacity: 10, // Max hand size (with hoarding)
      ordered: false,
      visibility: 'owner',
      allowedCardTypes: ['white'],
    },
    {
      id: 'submission',
      name: 'Submission',
      scope: 'player',
      capacity: 3, // Max for pick-3 cards
      ordered: true, // Order matters for multi-pick
      visibility: 'hidden', // Hidden until reveal
      allowedCardTypes: ['white'],
    },
    {
      id: 'prompt',
      name: 'Current Prompt',
      scope: 'global',
      capacity: 1,
      ordered: false,
      visibility: 'public',
      allowedCardTypes: ['black'],
    },
    {
      id: 'scorePile',
      name: 'Awesome Points',
      scope: 'player',
      capacity: 100,
      ordered: false,
      visibility: 'public', // Count is public
      allowedCardTypes: ['black'],
    },
  ],

  // Default settings
  defaultSettings: {
    handSize: 7,
    endCondition: 'points',
    endValue: 10, // First to 10 points wins
    submitTimeout: undefined, // No timeout by default (voice chat friendly)
    judgeTimeout: undefined,
    packIds: ['base'], // Default to base pack
    activeVariants: ['judgeRotate'],
  },

  // Available variants
  variants: [
    {
      id: 'judgeRotate',
      name: 'Rotating Judge',
      description: 'Judge passes clockwise each round',
      default: true,
    },
    {
      id: 'judgeWinner',
      name: 'Winner Judges',
      description: 'Round winner becomes the next judge',
      default: false,
    },
    {
      id: 'judgeRandom',
      name: 'Random Judge',
      description: 'Random player is judge each round',
      default: false,
    },
    {
      id: 'rando',
      name: 'Rando Cardrissian',
      description: 'A random card plays each round as a fake player',
      default: false,
    },
    {
      id: 'gambling',
      name: 'Gambling',
      description: 'Players can bet an extra card for double points',
      default: false,
    },
    {
      id: 'happyEnding',
      name: 'Happy Ending',
      description: 'Play the Haiku card as the last black card',
      default: false,
    },
    {
      id: 'godIsDead',
      name: 'God is Dead',
      description: 'After everyone has played, everyone picks their favorite (no judge)',
      default: false,
    },
  ],

  // Phase definitions
  phases: [
    {
      id: 'LOBBY',
      name: 'Lobby',
      activeRoles: ['lead', 'all'],
      allowedActions: ['startGame', 'setPresence'],
      transitions: [
        {
          to: 'SETUP',
          condition: { type: 'action', action: 'startGame' },
          automatic: false,
        },
      ],
    },
    {
      id: 'SETUP',
      name: 'Setting Up',
      activeRoles: ['lead'],
      allowedActions: [],
      transitions: [
        {
          to: 'PROMPT',
          condition: { type: 'manual' },
          automatic: true, // Immediately transition after setup
        },
      ],
    },
    {
      id: 'PROMPT',
      name: 'Drawing Prompt',
      activeRoles: ['judge'],
      allowedActions: ['draw'],
      transitions: [
        {
          to: 'SUBMIT',
          condition: { type: 'manual' },
          automatic: true, // Auto-transition after prompt is drawn
        },
      ],
    },
    {
      id: 'SUBMIT',
      name: 'Submitting Cards',
      activeRoles: ['submitters'],
      allowedActions: ['submitCards', 'play', 'setPresence'],
      transitions: [
        {
          to: 'JUDGE', // Skip REVEAL, go directly to JUDGE
          condition: { type: 'allSubmitted' },
          automatic: true,
        },
      ],
      timeout: {
        seconds: 120, // 2 minutes
        action: 'skip-inactive',
      },
    },
    {
      id: 'JUDGE',
      name: 'Judging',
      activeRoles: ['judge'],
      allowedActions: ['selectWinner'],
      transitions: [
        {
          to: 'RESOLVE',
          condition: { type: 'judgeSelected' },
          automatic: true,
        },
      ],
      timeout: {
        seconds: 180, // 3 minutes
        action: 'pause',
      },
    },
    {
      id: 'RESOLVE',
      name: 'Resolving Round',
      activeRoles: ['all'],
      allowedActions: [],
      transitions: [
        {
          to: 'PROMPT',
          condition: { type: 'manual' },
          automatic: true, // Auto-transition to next round
        },
      ],
    },
    {
      id: 'END',
      name: 'Game Over',
      activeRoles: ['all'],
      allowedActions: ['endGame'],
      transitions: [],
    },
  ],

  initialPhase: 'LOBBY',
};

// =============================================================================
// PLACEHOLDER CARD PACKS
// =============================================================================

/**
 * Generate placeholder cards for testing
 * In production, these would be loaded from a database
 */
export function createPlaceholderPack(): CardPack {
  const blackCards: Card[] = [];
  const whiteCards: Card[] = [];

  // Generate 50 placeholder black cards
  const blackPrompts = [
    'What ended my last relationship?',
    '_ is the new _.',
    'What\'s the next Happy Meal toy?',
    'I never truly understood _ until I encountered _.',
    'What\'s making things awkward in the office?',
    'Behind every great man is _.',
    'What does your mom secretly love?',
    '_ + _ = _.',
    'The class field trip was ruined by _.',
    'What\'s the cure for hiccups?',
    'What\'s that smell?',
    'I drink to forget _.',
    'What\'s Grandma hiding?',
    'The movie was terrible, but _ saved it.',
    'What\'s the secret ingredient?',
    '_ would be a terrible band name.',
    'When I\'m feeling down, I like to think about _.',
    'What\'s in my pocket?',
    '_ is overrated.',
    'What keeps me up at night?',
  ];

  for (let i = 0; i < blackPrompts.length; i++) {
    const text = blackPrompts[i];
    const blanks = (text.match(/_/g) || []).length;
    blackCards.push({
      id: `black-${i}`,
      type: 'black',
      properties: {
        text,
        pick: blanks > 0 ? blanks : 1,
        blanks: blanks > 0 ? blanks : 1,
      },
    });
  }

  // Generate 100 placeholder white cards
  const whiteResponses = [
    'A disappointing birthday party.',
    'Passive-aggressive Post-it notes.',
    'An endless stream of tacos.',
    'The inevitable heat death of the universe.',
    'A sassy llama.',
    'Existential dread.',
    'A romantic candlelit dinner.',
    'Crippling debt.',
    'The American Dream.',
    'A balanced breakfast.',
    'Interpretive dance.',
    'Grandma\'s secret recipe.',
    'A moment of silence.',
    'Spontaneous combustion.',
    'Poor life choices.',
    'A very tiny horse.',
    'The sweet release of death.',
    'Aggressive negotiations.',
    'A participation trophy.',
    'Weaponized incompetence.',
    'The power of friendship.',
    'An uncomfortable silence.',
    'Questionable life decisions.',
    'The tears of a clown.',
    'A strongly-worded email.',
    'Regret.',
    'A surprise party nobody wanted.',
    'The void.',
    'Toxic positivity.',
    'An existential crisis.',
    'The last slice of pizza.',
    'A midlife crisis.',
    'Unexpected consequences.',
    'A series of unfortunate events.',
    'The elephant in the room.',
    'Competitive eating.',
    'A lukewarm response.',
    'The smell of desperation.',
    'Plausible deniability.',
    'A vague sense of unease.',
    'The crushing weight of expectations.',
    'An overly enthusiastic mascot.',
    'Buyer\'s remorse.',
    'The illusion of choice.',
    'A polite cough.',
    'Someone else\'s problem.',
    'The bare minimum.',
    'An unnecessary sequel.',
    'A cry for help.',
    'The audacity.',
  ];

  for (let i = 0; i < whiteResponses.length; i++) {
    whiteCards.push({
      id: `white-${i}`,
      type: 'white',
      properties: {
        text: whiteResponses[i],
      },
    });
  }

  return {
    id: 'base',
    name: 'Base Pack (Placeholder)',
    description: 'Placeholder cards for testing the game engine',
    official: false,
    cards: {
      black: blackCards,
      white: whiteCards,
    },
  };
}

// =============================================================================
// CAH-SPECIFIC HELPERS
// =============================================================================

/**
 * Interpolate white cards into black card text
 */
export function interpolatePrompt(blackCard: Card, whiteCards: Card[]): string {
  let result = blackCard.properties.text ?? '';
  const blanks = blackCard.properties.blanks ?? blackCard.properties.pick ?? 1;

  for (let i = 0; i < blanks && i < whiteCards.length; i++) {
    const whiteText = whiteCards[i].properties.text ?? '';
    // Remove trailing period from white card text when inserting
    const cleanText = whiteText.replace(/\.$/, '');
    result = result.replace('_', `**${cleanText}**`);
  }

  // If pick > blanks, append remaining cards
  if (whiteCards.length > blanks) {
    const extras = whiteCards.slice(blanks).map((c) => c.properties.text);
    result += ' ' + extras.join(' ');
  }

  return result;
}

/**
 * Get the required pick count for a black card
 */
export function getPickCount(blackCard: Card): number {
  return blackCard.properties.pick ?? 1;
}

/**
 * Check if a submission has the correct number of cards for the prompt
 */
export function isValidSubmission(blackCard: Card, whiteCards: Card[]): boolean {
  return whiteCards.length === getPickCount(blackCard);
}
