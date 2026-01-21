/**
 * Seed script for Game Kit templates
 * Run with: npx tsx prisma/seed-game-templates.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Base CAH-style game config (without cards - those are added by users)
const cahBaseConfig = {
  id: 'fill-in-the-blank',
  name: 'Fill in the Blank',
  description: 'A party game where players fill in blanks with funny answers.',
  minPlayers: 3,
  maxPlayers: 20,

  decks: {
    black: {
      displayName: 'Prompt Cards',
      cardType: 'black',
    },
    white: {
      displayName: 'Response Cards',
      cardType: 'white',
    },
  },

  slots: [
    {
      id: 'hand',
      name: 'Hand',
      scope: 'player',
      capacity: 10,
      ordered: false,
      visibility: 'owner',
      allowedCardTypes: ['white'],
    },
    {
      id: 'submission',
      name: 'Submission',
      scope: 'player',
      capacity: 3,
      ordered: true,
      visibility: 'hidden',
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
      name: 'Points',
      scope: 'player',
      capacity: 100,
      ordered: false,
      visibility: 'public',
      allowedCardTypes: ['black'],
    },
  ],

  defaultSettings: {
    handSize: 7,
    endCondition: 'points',
    endValue: 10,
    submitTimeout: undefined,
    judgeTimeout: undefined,
    packIds: ['core'],
    activeVariants: ['judgeRotate'],
  },

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
  ],

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
          automatic: true,
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
          automatic: true,
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
          to: 'JUDGE',
          condition: { type: 'allSubmitted' },
          automatic: true,
        },
      ],
      timeout: {
        seconds: 120,
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
        seconds: 180,
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
          automatic: true,
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

// Editor hints for the UI
const cahEditorHints = {
  cardTypes: [
    {
      id: 'black',
      name: 'Prompt Cards',
      description: 'Cards with blanks that players fill in',
      color: '#1a1a1a',
      textColor: '#ffffff',
      fields: [
        { name: 'text', type: 'text', label: 'Card Text', placeholder: 'What ended my last relationship? (use _ for blanks)' },
        { name: 'pick', type: 'number', label: 'Pick', default: 1, min: 1, max: 3, auto: true, autoFrom: 'blanks' },
      ],
    },
    {
      id: 'white',
      name: 'Response Cards',
      description: 'Cards with funny answers',
      color: '#ffffff',
      textColor: '#000000',
      fields: [
        { name: 'text', type: 'text', label: 'Card Text', placeholder: 'A disappointing birthday party.' },
      ],
    },
  ],
  minCards: {
    black: 20,
    white: 50,
  },
  recommendedCards: {
    black: 50,
    white: 200,
  },
};

async function main() {
  console.log('Seeding game templates...');

  // Upsert the Fill in the Blank template
  const template = await prisma.gameTemplate.upsert({
    where: { slug: 'fill-in-the-blank' },
    update: {
      name: 'Fill in the Blank',
      description: 'A party game where one player reads a prompt card with blanks, and everyone else submits funny response cards. The reader picks their favorite answer. Perfect for game nights, parties, and getting to know your friends\' sense of humor.',
      category: 'party',
      iconEmoji: '📝',
      baseConfig: cahBaseConfig,
      cardTypes: ['black', 'white'],
      editorHints: cahEditorHints,
      isOfficial: true,
      sortOrder: 1,
    },
    create: {
      slug: 'fill-in-the-blank',
      name: 'Fill in the Blank',
      description: 'A party game where one player reads a prompt card with blanks, and everyone else submits funny response cards. The reader picks their favorite answer. Perfect for game nights, parties, and getting to know your friends\' sense of humor.',
      category: 'party',
      iconEmoji: '📝',
      baseConfig: cahBaseConfig,
      cardTypes: ['black', 'white'],
      editorHints: cahEditorHints,
      isOfficial: true,
      sortOrder: 1,
    },
  });

  console.log(`Created/updated template: ${template.name} (${template.id})`);

  // Future templates can be added here
  // const triviaTemplate = await prisma.gameTemplate.upsert({...});

  console.log('Done seeding game templates!');
}

main()
  .catch((e) => {
    console.error('Error seeding templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
