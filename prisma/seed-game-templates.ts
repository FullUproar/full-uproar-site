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

  console.log(`  ✓ ${template.iconEmoji} ${template.name}`);

  // -------------------------------------------------------------------------
  // 2. Trivia Template
  // -------------------------------------------------------------------------
  const triviaBaseConfig = {
    id: 'trivia',
    name: 'Trivia',
    description: 'Test your knowledge with questions across multiple categories.',
    minPlayers: 2,
    maxPlayers: 20,

    decks: {
      questions: {
        displayName: 'Question Cards',
        cardType: 'question',
      },
    },

    slots: [
      {
        id: 'currentQuestion',
        name: 'Current Question',
        scope: 'global',
        capacity: 1,
        visibility: 'public',
        allowedCardTypes: ['question'],
      },
      {
        id: 'usedQuestions',
        name: 'Used Questions',
        scope: 'global',
        capacity: 1000,
        visibility: 'hidden',
        allowedCardTypes: ['question'],
      },
    ],

    defaultSettings: {
      questionsPerRound: 10,
      timePerQuestion: 30,
      speedBonus: true,
      showLeaderboard: true,
    },

    phases: [
      {
        id: 'LOBBY',
        name: 'Lobby',
        activeRoles: ['host', 'all'],
        allowedActions: ['startGame', 'setPresence'],
        transitions: [{ to: 'QUESTION', condition: { type: 'action', action: 'startGame' } }],
      },
      {
        id: 'QUESTION',
        name: 'Show Question',
        activeRoles: ['all'],
        allowedActions: [],
        transitions: [{ to: 'ANSWER', condition: { type: 'timer', seconds: 3 }, automatic: true }],
      },
      {
        id: 'ANSWER',
        name: 'Answer Time',
        activeRoles: ['all'],
        allowedActions: ['submitAnswer'],
        transitions: [
          { to: 'REVEAL', condition: { type: 'allAnswered' }, automatic: true },
          { to: 'REVEAL', condition: { type: 'timer', seconds: 30 }, automatic: true },
        ],
      },
      {
        id: 'REVEAL',
        name: 'Reveal Answer',
        activeRoles: ['all'],
        allowedActions: [],
        transitions: [
          { to: 'QUESTION', condition: { type: 'timer', seconds: 5 }, automatic: true },
          { to: 'END', condition: { type: 'noMoreQuestions' }, automatic: true },
        ],
      },
      {
        id: 'END',
        name: 'Game Over',
        activeRoles: ['all'],
        allowedActions: ['playAgain', 'endGame'],
        transitions: [],
      },
    ],

    initialPhase: 'LOBBY',
  };

  const triviaEditorHints = {
    cardTypes: [
      {
        id: 'question',
        name: 'Question Cards',
        description: 'Trivia questions with answers',
        color: '#3b82f6',
        textColor: '#ffffff',
        fields: [
          { name: 'question', type: 'text', label: 'Question', placeholder: 'What is the capital of France?' },
          { name: 'answer', type: 'text', label: 'Correct Answer', placeholder: 'Paris' },
          { name: 'choices', type: 'array', label: 'Multiple Choice Options (optional)', placeholder: 'London, Paris, Berlin, Madrid' },
          { name: 'category', type: 'text', label: 'Category', placeholder: 'Geography' },
          { name: 'difficulty', type: 'select', label: 'Difficulty', options: ['easy', 'medium', 'hard'], default: 'medium' },
        ],
      },
    ],
    minCards: { question: 10 },
    recommendedCards: { question: 50 },
  };

  const triviaTemplate = await prisma.gameTemplate.upsert({
    where: { slug: 'trivia' },
    update: {
      name: 'Trivia',
      description: 'Test your knowledge! Players race to answer questions across categories. Earn points for correct answers, and bonus points for speed. Great for competitive groups and learning new facts.',
      category: 'trivia',
      iconEmoji: '❓',
      baseConfig: triviaBaseConfig,
      cardTypes: ['question'],
      editorHints: triviaEditorHints,
      isOfficial: true,
      sortOrder: 2,
    },
    create: {
      slug: 'trivia',
      name: 'Trivia',
      description: 'Test your knowledge! Players race to answer questions across categories. Earn points for correct answers, and bonus points for speed. Great for competitive groups and learning new facts.',
      category: 'trivia',
      iconEmoji: '❓',
      baseConfig: triviaBaseConfig,
      cardTypes: ['question'],
      editorHints: triviaEditorHints,
      isOfficial: true,
      sortOrder: 2,
    },
  });
  console.log(`  ✓ ${triviaTemplate.iconEmoji} ${triviaTemplate.name}`);

  // -------------------------------------------------------------------------
  // 3. Card Match (Uno-style) - INTERNAL TESTING ONLY
  // -------------------------------------------------------------------------
  const cardMatchBaseConfig = {
    id: 'card-match',
    name: 'Card Match',
    description: 'Match cards by color or number to empty your hand first!',
    minPlayers: 2,
    maxPlayers: 8,

    decks: {
      main: {
        displayName: 'Card Deck',
        cardType: 'card',
      },
    },

    slots: [
      {
        id: 'hand',
        name: 'Hand',
        scope: 'player',
        capacity: 20,
        visibility: 'owner',
        allowedCardTypes: ['number', 'action', 'wild'],
      },
      {
        id: 'drawPile',
        name: 'Draw Pile',
        scope: 'global',
        capacity: 200,
        visibility: 'hidden',
        allowedCardTypes: ['number', 'action', 'wild'],
      },
      {
        id: 'discardPile',
        name: 'Discard Pile',
        scope: 'global',
        capacity: 200,
        visibility: 'topOnly',
        allowedCardTypes: ['number', 'action', 'wild'],
      },
    ],

    defaultSettings: {
      handSize: 7,
      mustCallOnOneCard: true,
      penaltyCards: 2,
      stackDrawCards: false,
    },

    phases: [
      {
        id: 'LOBBY',
        name: 'Lobby',
        activeRoles: ['host', 'all'],
        allowedActions: ['startGame', 'setPresence'],
        transitions: [{ to: 'DEAL', condition: { type: 'action', action: 'startGame' } }],
      },
      {
        id: 'DEAL',
        name: 'Dealing Cards',
        activeRoles: [],
        allowedActions: [],
        transitions: [{ to: 'PLAY', condition: { type: 'manual' }, automatic: true }],
      },
      {
        id: 'PLAY',
        name: 'Play Card',
        activeRoles: ['currentPlayer'],
        allowedActions: ['playCard', 'drawCard', 'callOut'],
        transitions: [
          { to: 'RESOLVE', condition: { type: 'cardPlayed' }, automatic: true },
          { to: 'PLAY', condition: { type: 'cardDrawn' }, automatic: true },
        ],
        timeout: { seconds: 30, action: 'auto-draw' },
      },
      {
        id: 'RESOLVE',
        name: 'Resolve Effect',
        activeRoles: [],
        allowedActions: [],
        transitions: [
          { to: 'END', condition: { type: 'playerEmptyHand' }, automatic: true },
          { to: 'PLAY', condition: { type: 'manual' }, automatic: true },
        ],
      },
      {
        id: 'END',
        name: 'Game Over',
        activeRoles: ['all'],
        allowedActions: ['playAgain', 'endGame'],
        transitions: [],
      },
    ],

    initialPhase: 'LOBBY',
  };

  const cardMatchEditorHints = {
    cardTypes: [
      {
        id: 'number',
        name: 'Number Cards',
        description: 'Colored cards with numbers 0-9',
        colorOptions: ['red', 'blue', 'green', 'yellow'],
        fields: [
          { name: 'color', type: 'select', label: 'Color', options: ['red', 'blue', 'green', 'yellow'] },
          { name: 'value', type: 'number', label: 'Number', min: 0, max: 9 },
        ],
      },
      {
        id: 'action',
        name: 'Action Cards',
        description: 'Skip, Reverse, and Draw Two cards',
        colorOptions: ['red', 'blue', 'green', 'yellow'],
        fields: [
          { name: 'color', type: 'select', label: 'Color', options: ['red', 'blue', 'green', 'yellow'] },
          { name: 'action', type: 'select', label: 'Action', options: ['skip', 'reverse', 'draw2'] },
        ],
      },
      {
        id: 'wild',
        name: 'Wild Cards',
        description: 'Wild and Wild Draw Four cards',
        color: '#1a1a1a',
        fields: [
          { name: 'action', type: 'select', label: 'Type', options: ['wild', 'wildDraw4'] },
        ],
      },
    ],
    prebuiltDeck: true,
    deckContents: '108 cards: Numbers 0-9 in 4 colors (×2 each except 0), Skip/Reverse/Draw2 in 4 colors (×2 each), 4 Wild, 4 Wild Draw Four',
  };

  const cardMatchTemplate = await prisma.gameTemplate.upsert({
    where: { slug: 'card-match' },
    update: {
      name: 'Card Match',
      description: '[INTERNAL - Licensing Required] Match cards by color or number to be the first to empty your hand! Special action cards add twists: Skip, Reverse, Draw Two, and Wild cards keep everyone on their toes.',
      category: 'strategy',
      iconEmoji: '🎴',
      baseConfig: cardMatchBaseConfig,
      cardTypes: ['number', 'action', 'wild'],
      editorHints: cardMatchEditorHints,
      isOfficial: true,
      sortOrder: 3,
    },
    create: {
      slug: 'card-match',
      name: 'Card Match',
      description: '[INTERNAL - Licensing Required] Match cards by color or number to be the first to empty your hand! Special action cards add twists: Skip, Reverse, Draw Two, and Wild cards keep everyone on their toes.',
      category: 'strategy',
      iconEmoji: '🎴',
      baseConfig: cardMatchBaseConfig,
      cardTypes: ['number', 'action', 'wild'],
      editorHints: cardMatchEditorHints,
      isOfficial: true,
      sortOrder: 3,
    },
  });
  console.log(`  ✓ ${cardMatchTemplate.iconEmoji} ${cardMatchTemplate.name} [Internal]`);

  // -------------------------------------------------------------------------
  // 4. Poker Night - INTERNAL TESTING ONLY
  // -------------------------------------------------------------------------
  const pokerBaseConfig = {
    id: 'poker',
    name: 'Poker Night',
    description: 'Classic Texas Hold\'em poker with chips and betting.',
    minPlayers: 2,
    maxPlayers: 9,

    decks: {
      main: {
        displayName: 'Standard 52-Card Deck',
        cardType: 'playing',
      },
    },

    slots: [
      {
        id: 'hand',
        name: 'Hole Cards',
        scope: 'player',
        capacity: 2,
        visibility: 'owner',
        allowedCardTypes: ['playing'],
      },
      {
        id: 'community',
        name: 'Community Cards',
        scope: 'global',
        capacity: 5,
        visibility: 'public',
        allowedCardTypes: ['playing'],
      },
      {
        id: 'deck',
        name: 'Deck',
        scope: 'global',
        capacity: 52,
        visibility: 'hidden',
        allowedCardTypes: ['playing'],
      },
      {
        id: 'chips',
        name: 'Chip Stack',
        scope: 'player',
        capacity: null,
        visibility: 'public',
        type: 'chips',
      },
      {
        id: 'pot',
        name: 'Pot',
        scope: 'global',
        capacity: null,
        visibility: 'public',
        type: 'chips',
      },
    ],

    defaultSettings: {
      startingChips: 1000,
      smallBlind: 10,
      bigBlind: 20,
      blindIncrease: true,
      blindIncreaseInterval: 10,
      blindMultiplier: 1.5,
    },

    phases: [
      {
        id: 'LOBBY',
        name: 'Lobby',
        activeRoles: ['host', 'all'],
        allowedActions: ['startGame', 'setPresence', 'buyIn'],
        transitions: [{ to: 'BLINDS', condition: { type: 'action', action: 'startGame' } }],
      },
      {
        id: 'BLINDS',
        name: 'Post Blinds',
        activeRoles: [],
        allowedActions: [],
        transitions: [{ to: 'DEAL', condition: { type: 'manual' }, automatic: true }],
      },
      {
        id: 'DEAL',
        name: 'Deal Hole Cards',
        activeRoles: [],
        allowedActions: [],
        transitions: [{ to: 'PREFLOP', condition: { type: 'manual' }, automatic: true }],
      },
      {
        id: 'PREFLOP',
        name: 'Pre-Flop',
        activeRoles: ['currentPlayer'],
        allowedActions: ['fold', 'call', 'raise', 'allIn'],
        transitions: [{ to: 'FLOP', condition: { type: 'bettingComplete' }, automatic: true }],
      },
      {
        id: 'FLOP',
        name: 'The Flop',
        activeRoles: ['currentPlayer'],
        allowedActions: ['check', 'bet', 'fold', 'call', 'raise', 'allIn'],
        transitions: [{ to: 'TURN', condition: { type: 'bettingComplete' }, automatic: true }],
      },
      {
        id: 'TURN',
        name: 'The Turn',
        activeRoles: ['currentPlayer'],
        allowedActions: ['check', 'bet', 'fold', 'call', 'raise', 'allIn'],
        transitions: [{ to: 'RIVER', condition: { type: 'bettingComplete' }, automatic: true }],
      },
      {
        id: 'RIVER',
        name: 'The River',
        activeRoles: ['currentPlayer'],
        allowedActions: ['check', 'bet', 'fold', 'call', 'raise', 'allIn'],
        transitions: [{ to: 'SHOWDOWN', condition: { type: 'bettingComplete' }, automatic: true }],
      },
      {
        id: 'SHOWDOWN',
        name: 'Showdown',
        activeRoles: ['all'],
        allowedActions: ['show', 'muck'],
        transitions: [
          { to: 'END', condition: { type: 'onePlayerRemains' }, automatic: true },
          { to: 'BLINDS', condition: { type: 'manual' }, automatic: true },
        ],
      },
      {
        id: 'END',
        name: 'Game Over',
        activeRoles: ['all'],
        allowedActions: ['playAgain', 'endGame'],
        transitions: [],
      },
    ],

    initialPhase: 'LOBBY',
  };

  const pokerEditorHints = {
    cardTypes: [
      {
        id: 'playing',
        name: 'Playing Cards',
        description: 'Standard 52-card deck',
        fields: [
          { name: 'suit', type: 'select', label: 'Suit', options: ['hearts', 'diamonds', 'clubs', 'spades'] },
          { name: 'rank', type: 'select', label: 'Rank', options: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] },
        ],
      },
    ],
    prebuiltDeck: true,
    deckContents: 'Standard 52-card deck with 4 suits × 13 ranks',
    chipDenominations: [1, 5, 10, 25, 100, 500],
  };

  const pokerTemplate = await prisma.gameTemplate.upsert({
    where: { slug: 'poker' },
    update: {
      name: 'Poker Night',
      description: '[INTERNAL - Licensing Considerations] Classic Texas Hold\'em poker with chips and betting. Bluff, bet, and go all-in! Perfect for casual poker nights with friends.',
      category: 'gambling',
      iconEmoji: '🃏',
      baseConfig: pokerBaseConfig,
      cardTypes: ['playing'],
      editorHints: pokerEditorHints,
      isOfficial: true,
      sortOrder: 4,
    },
    create: {
      slug: 'poker',
      name: 'Poker Night',
      description: '[INTERNAL - Licensing Considerations] Classic Texas Hold\'em poker with chips and betting. Bluff, bet, and go all-in! Perfect for casual poker nights with friends.',
      category: 'gambling',
      iconEmoji: '🃏',
      baseConfig: pokerBaseConfig,
      cardTypes: ['playing'],
      editorHints: pokerEditorHints,
      isOfficial: true,
      sortOrder: 4,
    },
  });
  console.log(`  ✓ ${pokerTemplate.iconEmoji} ${pokerTemplate.name} [Internal]`);

  // -------------------------------------------------------------------------
  // 5. Custom Game (Blank Template)
  // -------------------------------------------------------------------------
  const customBaseConfig = {
    id: 'custom',
    name: 'Custom Game',
    description: 'Build your own unique card game from scratch.',
    minPlayers: 2,
    maxPlayers: 10,

    decks: {},
    slots: [
      {
        id: 'hand',
        name: 'Hand',
        scope: 'player',
        capacity: 10,
        visibility: 'owner',
        allowedCardTypes: [],
      },
      {
        id: 'deck',
        name: 'Draw Deck',
        scope: 'global',
        capacity: 200,
        visibility: 'hidden',
        allowedCardTypes: [],
      },
      {
        id: 'discard',
        name: 'Discard Pile',
        scope: 'global',
        capacity: 200,
        visibility: 'public',
        allowedCardTypes: [],
      },
    ],

    defaultSettings: {
      handSize: 5,
    },

    phases: [
      {
        id: 'LOBBY',
        name: 'Lobby',
        activeRoles: ['host', 'all'],
        allowedActions: ['startGame', 'setPresence'],
        transitions: [{ to: 'PLAY', condition: { type: 'action', action: 'startGame' } }],
      },
      {
        id: 'PLAY',
        name: 'Play',
        activeRoles: ['currentPlayer'],
        allowedActions: ['playCard', 'drawCard', 'endTurn'],
        transitions: [
          { to: 'END', condition: { type: 'gameEnd' }, automatic: true },
          { to: 'PLAY', condition: { type: 'endTurn' }, automatic: true },
        ],
      },
      {
        id: 'END',
        name: 'Game Over',
        activeRoles: ['all'],
        allowedActions: ['playAgain', 'endGame'],
        transitions: [],
      },
    ],

    initialPhase: 'LOBBY',
  };

  const customEditorHints = {
    cardTypes: [],
    showAdvancedOptions: true,
    allowPhaseEditor: true,
    allowRuleCustomization: true,
    tutorialMode: true,
    helpText: 'Start by creating your card types, then add cards to your deck. You can customize the game phases and rules as needed.',
  };

  const customTemplate = await prisma.gameTemplate.upsert({
    where: { slug: 'custom' },
    update: {
      name: 'Custom Game',
      description: 'Start from scratch and build your own unique card game. Define custom card types, create your deck, and set up the game flow however you like. Perfect for inventing new games or recreating classics.',
      category: 'custom',
      iconEmoji: '✨',
      baseConfig: customBaseConfig,
      cardTypes: [],
      editorHints: customEditorHints,
      isOfficial: true,
      sortOrder: 5,
    },
    create: {
      slug: 'custom',
      name: 'Custom Game',
      description: 'Start from scratch and build your own unique card game. Define custom card types, create your deck, and set up the game flow however you like. Perfect for inventing new games or recreating classics.',
      category: 'custom',
      iconEmoji: '✨',
      baseConfig: customBaseConfig,
      cardTypes: [],
      editorHints: customEditorHints,
      isOfficial: true,
      sortOrder: 5,
    },
  });
  console.log(`  ✓ ${customTemplate.iconEmoji} ${customTemplate.name}`);

  console.log('\n✅ Done seeding game templates! (5 total)');
}

main()
  .catch((e) => {
    console.error('Error seeding templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
