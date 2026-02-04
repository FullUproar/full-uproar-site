/**
 * Fugly's Mayhem Machine - Game Series Data
 *
 * This data is used for QR code landing pages on packaging and instructions.
 * Update this file to change content on both pre-purchase and how-to-play pages.
 */

export interface FMMGame {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  color: string;
  icon: string;
  playerCount: string;
  playTime: string;
  ageRating: string;
  features: string[];
  howItWorks: string;
  perfectFor: string[];
  // Content for pre-purchase page
  previewContent: {
    hook: string;
    bullets: string[];
    callToAction: string;
  };
  // Content for how-to-play page
  howToPlay: {
    setup: string[];
    gameplay: string[];
    winning: string;
    tips: string[];
    variations?: string[];
  };
  // Links
  purchaseSlug?: string; // Slug to link to product page if available
}

export const FMM_SERIES = {
  name: "Fugly's Mayhem Machine",
  tagline: "4 Game Mods. Infinite Chaos.",
  description: "Transform any game you own into pure mayhem with our collection of universal game mods. Each mod works with ANY game - board games, card games, video games, even sports!",
  color: '#FF8200',
};

export const FMM_GAMES: FMMGame[] = [
  {
    slug: 'hack-your-deck',
    name: 'Hack Your Deck',
    tagline: 'Rewrite the rules mid-game',
    description: 'A deck of chaos cards that let players modify rules, swap positions, and completely derail any game. Draw a card, unleash havoc.',
    color: '#ef4444',
    icon: '🃏',
    playerCount: '2-8 players',
    playTime: '+10-20 min to any game',
    ageRating: '10+',
    features: [
      '54 Chaos Cards',
      'Works with ANY game',
      'Rule-bending mechanics',
      'Instant game changer',
    ],
    howItWorks: 'Shuffle the Hack Your Deck cards and deal 3 to each player at the start of any game. On your turn, you may play one card to bend or break the rules - swap scores, reverse turn order, or steal abilities.',
    perfectFor: [
      'Making family game night unpredictable',
      'Reviving games that have gotten stale',
      'Adding chaos to competitive games',
      'Creating memorable gaming moments',
    ],
    previewContent: {
      hook: "Your games are about to get a lot more interesting.",
      bullets: [
        'Play a card to swap places with the leader',
        'Force opponents to play with their eyes closed',
        'Reverse the entire game direction',
        'Steal another player\'s special ability',
      ],
      callToAction: 'Ready to hack your game nights?',
    },
    howToPlay: {
      setup: [
        'Shuffle all 54 Hack Your Deck cards',
        'Deal 3 cards face-down to each player',
        'Place the remaining deck in the center',
        'Start your regular game as normal',
      ],
      gameplay: [
        'On your turn (in any game), you may play ONE Hack card before, during, or after your regular turn',
        'Read the card aloud and follow its instructions immediately',
        'Discard the played card to a discard pile',
        'Draw a new card from the deck at the end of your turn',
        'If the deck runs out, shuffle the discard pile',
      ],
      winning: 'Win conditions remain the same as your base game. The Hack cards just make getting there a lot more chaotic!',
      tips: [
        'Save powerful cards for crucial moments',
        'Some cards are better used defensively',
        'Combine cards with your base game strategy',
        'Don\'t forget - chaos affects everyone, including you!',
      ],
      variations: [
        'Speed Mode: Each player starts with 5 cards instead of 3',
        'Chaos Mode: Play up to 2 cards per turn',
        'Draft Mode: Deal 5 cards, keep 3, pass the rest left',
      ],
    },
  },
  {
    slug: 'dumbest-ways-to-win',
    name: 'Dumbest Ways To Win',
    tagline: 'Stupid challenges, serious bragging rights',
    description: 'A collection of absurd victory conditions and challenges that force players to win in the most ridiculous ways possible. It\'s not about IF you win, it\'s about HOW dumb you look doing it.',
    color: '#eab308',
    icon: '🏆',
    playerCount: '2-10 players',
    playTime: '+15-30 min to any game',
    ageRating: '8+',
    features: [
      '60 Challenge Cards',
      'Works with ANY game',
      'Hilarious party moments',
      'Skill meets absurdity',
    ],
    howItWorks: 'Before starting any game, each player draws a secret challenge card. To truly win, you must complete your game\'s victory condition WHILE fulfilling your ridiculous challenge - like winning while only using your non-dominant hand or speaking in questions.',
    perfectFor: [
      'Adding laughs to serious games',
      'Leveling the playing field',
      'Party game nights',
      'Creating hilarious stories',
    ],
    previewContent: {
      hook: "Winning is easy. Winning like an idiot? That's an art.",
      bullets: [
        'Win while speaking only in rhymes',
        'Keep a straight face the entire game',
        'Play with your phone on your head',
        'Narrate everything in third person',
      ],
      callToAction: 'Think you can win looking this stupid?',
    },
    howToPlay: {
      setup: [
        'Shuffle all 60 Dumbest Ways cards',
        'Each player draws ONE secret challenge card',
        'Keep your challenge hidden from other players',
        'Begin your regular game',
      ],
      gameplay: [
        'You must complete your challenge throughout the entire game',
        'If someone catches you breaking your challenge, you must reveal it and draw a new one',
        'Three reveals = you cannot win, only play for second place',
        'You can bluff and pretend to have a different challenge',
        'To win: Meet your game\'s win condition AND your secret challenge',
      ],
      winning: 'At the end of the game, all players reveal their challenges. Only players who completed their challenges AND met the original win condition can claim victory. If no one completed their challenge, closest to winning + most of challenge completed wins!',
      tips: [
        'Choose challenges you can actually maintain',
        'Watch others for clues about their challenges',
        'Strategic rule-breaking can throw off opponents',
        'Some challenges are harder with certain games',
      ],
    },
  },
  {
    slug: 'crime-and-funishment',
    name: 'Crime And Funishment',
    tagline: 'Break the rules. Face the consequences.',
    description: 'A punishment system that turns every rule violation into a hilarious penalty. Forgot to say "Uno"? That\'s 10 jumping jacks. Peeked at someone\'s cards? Compliment each player sincerely.',
    color: '#7D55C7',
    icon: '⚖️',
    playerCount: '2-8 players',
    playTime: '+5-15 min to any game',
    ageRating: '8+',
    features: [
      '40 Crime Cards',
      '40 Punishment Cards',
      'Works with ANY game',
      'Physical & social penalties',
    ],
    howItWorks: 'When any player breaks a rule in your game (even accidentally), another player calls out the crime. The offender draws a Punishment card and must complete it immediately or face double punishment.',
    perfectFor: [
      'Enforcing rules in chaotic games',
      'Adding physical comedy',
      'Getting people active during game night',
      'Making rule violations entertaining',
    ],
    previewContent: {
      hook: "Finally, actual consequences for cheating at Monopoly.",
      bullets: [
        'Sing your next move as an opera',
        'Let another player control your hand for a turn',
        'Compliment every player genuinely',
        'Play the next round standing on one foot',
      ],
      callToAction: 'Ready to face justice?',
    },
    howToPlay: {
      setup: [
        'Separate Crime cards and Punishment cards into two decks',
        'Shuffle each deck separately',
        'Place both decks where all players can reach',
        'Designate one player as the Judge for the first round',
      ],
      gameplay: [
        'When someone breaks ANY rule of your base game, any player can call "CRIME!"',
        'The Judge confirms if a crime occurred',
        'If guilty, the criminal draws a Punishment card',
        'They must complete the punishment IMMEDIATELY',
        'Refusing a punishment = draw 2 more and do all three',
        'The Judge role rotates clockwise each time a crime is called',
      ],
      winning: 'Same as your base game. Punishments are just consequences, not game-changers.',
      tips: [
        'Be a fair Judge - don\'t abuse the power',
        'Know your base game\'s rules well',
        'Some punishments can be strategic advantages',
        'Physical punishments should be safe for all players',
      ],
    },
  },
  {
    slug: 'dice-not-included',
    name: 'Dice Not Included',
    tagline: 'Add randomness to anything',
    description: 'A set of wild dice and event cards that inject random chaos into any game. Roll to add sudden events, modify outcomes, or completely change the game state.',
    color: '#10b981',
    icon: '🎲',
    playerCount: '2-6 players',
    playTime: '+10-25 min to any game',
    ageRating: '10+',
    features: [
      '6 Custom Chaos Dice',
      '30 Event Cards',
      'Works with ANY game',
      'Controlled randomness',
    ],
    howItWorks: 'At key moments in any game (start of round, after big moves, or when triggered by events), roll the Chaos Dice. The combination determines what random event affects the game - from minor tweaks to major upheavals.',
    perfectFor: [
      'Spicing up deterministic games',
      'Adding unpredictability to strategy games',
      'Creating dramatic moments',
      'Balancing skill gaps between players',
    ],
    previewContent: {
      hook: "Because your games need more 'wait, WHAT?!' moments.",
      bullets: [
        'Sudden role/position swaps',
        'Temporary rule changes',
        'Resource redistributions',
        'Wild bonus rounds',
      ],
      callToAction: 'Roll the dice. Accept your fate.',
    },
    howToPlay: {
      setup: [
        'Set out all 6 Chaos Dice',
        'Shuffle the Event Cards and place face-down',
        'Decide when to roll: every round, every 3rd turn, or on specific triggers',
        'Start your regular game',
      ],
      gameplay: [
        'When it\'s time, one player rolls all 6 dice',
        'Check the result against the Event Chart (included)',
        'Some results trigger an Event Card draw',
        'Apply the event to all players immediately',
        'Some events last one round, others are permanent',
        'If dice show all the same symbol = MEGA EVENT (draw 3 cards, pick one)',
      ],
      winning: 'Same as your base game, but the journey will be much more chaotic!',
      tips: [
        'Roll frequency affects chaos level - adjust to taste',
        'Read events fully before applying',
        'Some events can be strategically timed',
        'Keep the Event Chart handy for quick reference',
      ],
      variations: [
        'Light Chaos: Roll only 3 dice, events are suggestions',
        'Full Chaos: Roll every turn, all events mandatory',
        'Player\'s Choice: Roller picks which dice to keep, rerolls rest',
      ],
    },
  },
];

export function getGameBySlug(slug: string): FMMGame | undefined {
  return FMM_GAMES.find(game => game.slug === slug);
}

export function getAllGameSlugs(): string[] {
  return FMM_GAMES.map(game => game.slug);
}
