/**
 * Cards Against Humanity expressed in the Full Uproar Game DSL
 *
 * This demonstrates how a complete party game can be defined
 * using only the primitive operations and recursive scopes.
 */

import type { GameDefinition, Scope, Action, Expression } from '../types';
import { lit, ref, eq, gt, lt, count, cardsIn, and, currentPlayer } from '../types';

// Helper for zone references
const zone = (id: 'deck' | 'discard' | 'hand', owner?: any) =>
  ({ type: 'zone' as const, id, owner });

const playerZone = (id: 'hand', playerId: 'current' | 'all') =>
  ({ type: 'zone' as const, id, owner: { type: 'player' as const, id: playerId } });

// Helper for card references
const topCards = (from: any, count: Expression) =>
  ({ type: 'card' as const, id: 'top' as const, from, count });

const chosenCards = (by: any, from: any, count: Expression) =>
  ({ type: 'card' as const, id: 'chosen' as const, by, from, count });

export const cardsAgainstHumanity: GameDefinition = {
  id: 'cards-against-humanity',
  name: 'Cards Against Humanity',
  version: '1.0.0',
  description: 'A party game for horrible people. Fill in the blanks with the funniest answers.',

  // ---------------------------------------------------------------------------
  // PLAYERS
  // ---------------------------------------------------------------------------
  players: {
    min: 3,
    max: 10,
    initial: [
      { variable: 'score', value: lit(0) },
      { variable: 'isJudge', value: lit(false) },
    ],
  },

  // ---------------------------------------------------------------------------
  // CARD TYPES
  // ---------------------------------------------------------------------------
  cardTypes: [
    {
      type: 'black',
      name: 'Prompt Card',
      display: {
        color: '#1a1a1a',
        textColor: '#ffffff',
        template: '{{text}}',
      },
      properties: [
        { name: 'text', type: 'string', label: 'Prompt Text' },
        { name: 'pick', type: 'number', default: lit(1), label: 'Cards to Pick' },
        { name: 'draw', type: 'number', default: lit(0), label: 'Extra Cards to Draw' },
      ],
    },
    {
      type: 'white',
      name: 'Response Card',
      display: {
        color: '#ffffff',
        textColor: '#1a1a1a',
        template: '{{text}}',
      },
      properties: [
        { name: 'text', type: 'string', label: 'Response Text' },
      ],
    },
  ],

  // ---------------------------------------------------------------------------
  // DECKS
  // ---------------------------------------------------------------------------
  decks: [
    {
      name: 'blackDeck',
      cards: [
        // Cards would be defined here or loaded from pack
        { type: 'black', count: lit(0) }, // Placeholder - loaded from pack
      ],
    },
    {
      name: 'whiteDeck',
      cards: [
        { type: 'white', count: lit(0) }, // Placeholder - loaded from pack
      ],
    },
  ],

  // ---------------------------------------------------------------------------
  // ZONES
  // ---------------------------------------------------------------------------
  zones: [
    { name: 'blackDeck', scope: 'shared', visibility: 'private' },
    { name: 'whiteDeck', scope: 'shared', visibility: 'private' },
    { name: 'blackDiscard', scope: 'shared', visibility: 'public' },
    { name: 'whiteDiscard', scope: 'shared', visibility: 'public' },
    { name: 'submissions', scope: 'shared', visibility: 'private' },
    { name: 'hand', scope: 'perPlayer', visibility: 'owner' },
  ],

  // ---------------------------------------------------------------------------
  // SETUP
  // ---------------------------------------------------------------------------
  setup: {
    id: 'setup',
    name: 'Game Setup',
    kind: 'phase',
    children: [
      // Shuffle decks
      { type: 'shuffle', zone: zone('deck') }, // Would reference blackDeck
      { type: 'shuffle', zone: { type: 'zone', id: 'custom', name: 'whiteDeck' } },

      // Deal 10 white cards to each player
      {
        type: 'forEach',
        collection: { type: 'players', filter: 'all' },
        as: 'player',
        do: [
          {
            type: 'move',
            cards: topCards({ type: 'zone', id: 'custom', name: 'whiteDeck' }, lit(10)),
            to: { type: 'zone', id: 'hand', owner: { type: 'player', id: 'specific', playerId: '' } }, // Iterator ref
          },
        ],
      },

      // Set first player as judge
      {
        type: 'set',
        variable: 'judgeIndex',
        value: lit(0),
        scope: 'game',
      },
      {
        type: 'announce',
        message: { type: 'template', template: 'Let the horrible games begin!', values: {} },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // MAIN GAME LOOP
  // ---------------------------------------------------------------------------
  main: {
    id: 'game',
    name: 'Main Game',
    kind: 'game',
    description: 'Play rounds until someone reaches the winning score',

    // Game continues until win condition
    iterate: {
      type: 'until',
      condition: {
        type: 'any',
        collection: { type: 'players', filter: 'all' },
        condition: gt(
          { type: 'property', of: { type: 'iterator' }, property: 'score' },
          ref('winningScore', 'game')
        ),
        as: 'p',
      },
    },

    variables: [
      { name: 'winningScore', initialValue: lit(10) },
      { name: 'roundNumber', initialValue: lit(0) },
    ],

    children: [
      // ---------------------------------------------------------------------------
      // ROUND SCOPE
      // ---------------------------------------------------------------------------
      {
        id: 'round',
        name: 'Round',
        kind: 'round',
        description: 'One complete round of play',

        iterate: { type: 'once' },

        onEnter: [
          // Increment round number
          { type: 'increment', variable: 'roundNumber', scope: 'game' },

          // Rotate judge
          {
            type: 'set',
            variable: 'currentJudge',
            value: {
              type: 'nth',
              of: { type: 'players', filter: 'all' },
              index: {
                type: 'modulo',
                left: ref('roundNumber', 'game'),
                right: count({ type: 'players', filter: 'all' }),
              },
            },
            scope: 'round',
          },

          // Draw black card
          {
            type: 'move',
            cards: topCards({ type: 'zone', id: 'custom', name: 'blackDeck' }, lit(1)),
            to: { type: 'zone', id: 'table' },
            reveal: true,
          },

          // Store pick count
          {
            type: 'set',
            variable: 'pickCount',
            value: {
              type: 'property',
              of: { type: 'first', of: cardsIn({ type: 'zone', id: 'table' }) },
              property: 'pick',
            },
            scope: 'round',
          },
        ],

        children: [
          // -----------------------------------------------------------------
          // SUBMISSION PHASE
          // -----------------------------------------------------------------
          {
            id: 'submission',
            name: 'Card Submission',
            kind: 'phase',
            description: 'Non-judge players submit their cards',

            // Each non-judge player submits
            iterate: {
              type: 'forEach',
              collection: {
                type: 'filter',
                collection: { type: 'players', filter: 'all' },
                condition: {
                  type: 'notEquals',
                  left: { type: 'iterator' },
                  right: ref('currentJudge', 'round'),
                },
                as: 'p',
              },
              as: 'submitter',
            },

            children: [
              // Player chooses cards
              {
                type: 'chooseCards',
                player: { type: 'player', id: 'specific', playerId: '' }, // Iterator ref
                from: { type: 'zone', id: 'hand', owner: { type: 'player', id: 'current' } },
                count: ref('pickCount', 'round'),
                message: { type: 'template', template: 'Choose {{count}} card(s) to submit', values: { count: ref('pickCount', 'round') } },
                storeIn: 'selectedCards',
              },

              // Move to submissions (face down)
              {
                type: 'move',
                cards: { type: 'card', id: 'specific', cardId: '' }, // Reference selectedCards
                to: { type: 'zone', id: 'custom', name: 'submissions' },
                reveal: false,
              },
            ],

            onExit: [
              // Shuffle submissions so judge doesn't know who submitted what
              { type: 'shuffle', zone: { type: 'zone', id: 'custom', name: 'submissions' } },
            ],
          },

          // -----------------------------------------------------------------
          // JUDGING PHASE
          // -----------------------------------------------------------------
          {
            id: 'judging',
            name: 'Judging',
            kind: 'phase',
            description: 'Judge reveals and picks the winner',

            iterate: { type: 'once' },

            onEnter: [
              // Reveal all submissions
              {
                type: 'reveal',
                cards: { type: 'card', id: 'all', from: { type: 'zone', id: 'custom', name: 'submissions' } },
              },
            ],

            children: [
              // Judge picks winner
              {
                type: 'chooseCards',
                player: ref('currentJudge', 'round') as any,
                from: { type: 'zone', id: 'custom', name: 'submissions' },
                count: lit(1),
                message: lit('Pick the winning submission'),
                storeIn: 'winningSubmission',
              },

              // Find and reward winner
              {
                type: 'increment',
                variable: 'score',
                player: { type: 'player', id: 'specific', playerId: '' }, // Owner of winning card
                scope: 'player',
              },

              // Announce winner
              {
                type: 'announce',
                message: {
                  type: 'template',
                  template: '🏆 {{winner}} wins the round!',
                  values: { winner: lit('Player') }, // Would resolve owner
                },
              },
            ],

            onExit: [
              // Clear submissions to discard
              {
                type: 'move',
                cards: { type: 'card', id: 'all', from: { type: 'zone', id: 'custom', name: 'submissions' } },
                to: { type: 'zone', id: 'custom', name: 'whiteDiscard' },
              },

              // Move black card to discard
              {
                type: 'move',
                cards: { type: 'card', id: 'all', from: { type: 'zone', id: 'table' } },
                to: { type: 'zone', id: 'custom', name: 'blackDiscard' },
              },
            ],
          },

          // -----------------------------------------------------------------
          // DRAW PHASE
          // -----------------------------------------------------------------
          {
            id: 'draw',
            name: 'Draw Cards',
            kind: 'phase',
            description: 'Players draw back up to 10 cards',

            iterate: {
              type: 'forEach',
              collection: {
                type: 'filter',
                collection: { type: 'players', filter: 'all' },
                condition: {
                  type: 'notEquals',
                  left: { type: 'iterator' },
                  right: ref('currentJudge', 'round'),
                },
                as: 'p',
              },
              as: 'drawer',
            },

            children: [
              // Draw until hand has 10 cards
              {
                type: 'conditional',
                if: lt(
                  count(cardsIn({ type: 'zone', id: 'hand', owner: { type: 'player', id: 'current' } })),
                  lit(10)
                ),
                then: [
                  {
                    type: 'move',
                    cards: topCards(
                      { type: 'zone', id: 'custom', name: 'whiteDeck' },
                      {
                        type: 'subtract',
                        left: lit(10),
                        right: count(cardsIn({ type: 'zone', id: 'hand', owner: { type: 'player', id: 'current' } })),
                      }
                    ),
                    to: { type: 'zone', id: 'hand', owner: { type: 'player', id: 'current' } },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // WIN CONDITIONS
  // ---------------------------------------------------------------------------
  winConditions: [
    {
      condition: {
        type: 'any',
        collection: { type: 'players', filter: 'all' },
        condition: gt(
          { type: 'property', of: { type: 'iterator' }, property: 'score' },
          lit(9), // 10+ points wins
        ),
        as: 'p',
      },
      message: {
        type: 'template',
        template: '🎉 {{winner}} wins with {{score}} points!',
        values: {
          winner: lit('Winner'),
          score: lit(10),
        },
      },
    },
  ],
};

export default cardsAgainstHumanity;
