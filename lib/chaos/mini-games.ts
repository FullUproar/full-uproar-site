// Mini-Game Templates for Chaos Agent
// Quick 10-30 second games that award chaos points

export interface MiniGameTemplate {
  id: string;
  type: string;
  title: string;
  description: string;
  instructions: string;
  durationSeconds: number;
  minPlayers: number;
  maxPlayers?: number;
  rewardPoints: number;
  category: 'reaction' | 'voting' | 'trivia' | 'creative' | 'physical';
  requiresHost: boolean; // Does host need to manage this?
}

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  category: 'gaming' | 'movies' | 'music' | 'general' | 'food' | 'sports';
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface VotingPrompt {
  id: string;
  prompt: string;
  category: 'funny' | 'embarrassing' | 'wholesome' | 'competitive';
}

// ===================
// MINI-GAME TEMPLATES
// ===================

export const MINI_GAME_TEMPLATES: MiniGameTemplate[] = [
  // Reaction Games
  {
    id: 'quick-draw',
    type: 'QUICK_DRAW',
    title: 'Quick Draw!',
    description: 'First to tap wins!',
    instructions: 'When you see "TAP NOW!", be the first to tap the button.',
    durationSeconds: 10,
    minPlayers: 2,
    rewardPoints: 25,
    category: 'reaction',
    requiresHost: false,
  },
  {
    id: 'color-tap',
    type: 'COLOR_TAP',
    title: 'Color Match',
    description: 'Tap when you see the right color!',
    instructions: 'Tap only when you see GREEN. Tapping on RED loses!',
    durationSeconds: 15,
    minPlayers: 2,
    rewardPoints: 30,
    category: 'reaction',
    requiresHost: false,
  },
  {
    id: 'last-tap',
    type: 'LAST_TAP',
    title: 'Last One Standing',
    description: 'Be the last to tap before time runs out!',
    instructions: 'Tap to reset your timer. Last person to tap before time runs out wins!',
    durationSeconds: 20,
    minPlayers: 2,
    rewardPoints: 25,
    category: 'reaction',
    requiresHost: false,
  },

  // Voting Games
  {
    id: 'who-would',
    type: 'VOTING',
    title: 'Who Would...?',
    description: 'Vote on fun questions about each other!',
    instructions: 'Vote for who best fits the prompt. Most votes wins points!',
    durationSeconds: 30,
    minPlayers: 3,
    rewardPoints: 20,
    category: 'voting',
    requiresHost: false,
  },
  {
    id: 'best-excuse',
    type: 'EXCUSE',
    title: 'Best Excuse',
    description: 'Come up with the best excuse!',
    instructions: 'Everyone types an excuse for a given scenario. Vote for the best one!',
    durationSeconds: 45,
    minPlayers: 3,
    rewardPoints: 35,
    category: 'voting',
    requiresHost: true,
  },
  {
    id: 'caption-this',
    type: 'CAPTION',
    title: 'Caption This',
    description: 'Write the funniest caption!',
    instructions: 'Write a caption for the scenario. Funniest caption wins!',
    durationSeconds: 30,
    minPlayers: 3,
    rewardPoints: 30,
    category: 'voting',
    requiresHost: true,
  },

  // Trivia Games
  {
    id: 'trivia-time',
    type: 'TRIVIA',
    title: 'Trivia Time',
    description: 'Test your knowledge!',
    instructions: 'Answer the trivia question. Fastest correct answer wins!',
    durationSeconds: 15,
    minPlayers: 2,
    rewardPoints: 25,
    category: 'trivia',
    requiresHost: false,
  },
  {
    id: 'true-or-false',
    type: 'TRUE_FALSE',
    title: 'True or False?',
    description: 'Is this fact true or false?',
    instructions: 'Swipe right for TRUE, left for FALSE. Fast and correct wins!',
    durationSeconds: 10,
    minPlayers: 2,
    rewardPoints: 20,
    category: 'trivia',
    requiresHost: false,
  },

  // Creative Games
  {
    id: 'emoji-story',
    type: 'EMOJI_STORY',
    title: 'Emoji Story',
    description: 'Tell a story using only emojis!',
    instructions: 'Use emojis to describe a movie/event. Others guess what it is!',
    durationSeconds: 30,
    minPlayers: 3,
    rewardPoints: 30,
    category: 'creative',
    requiresHost: true,
  },
  {
    id: 'rhyme-time',
    type: 'RHYME',
    title: 'Rhyme Time',
    description: 'Keep the rhyme going!',
    instructions: 'Take turns saying words that rhyme. Break the chain and you\'re out!',
    durationSeconds: 30,
    minPlayers: 3,
    rewardPoints: 25,
    category: 'creative',
    requiresHost: true,
  },

  // Physical Games (host managed, phone-assisted)
  {
    id: 'pose-off',
    type: 'POSE',
    title: 'Strike a Pose',
    description: 'Best pose wins!',
    instructions: 'Everyone strike a pose matching the theme. Host picks the winner!',
    durationSeconds: 15,
    minPlayers: 2,
    rewardPoints: 25,
    category: 'physical',
    requiresHost: true,
  },
  {
    id: 'slow-clap',
    type: 'SLOW_CLAP',
    title: 'Slow Clap Challenge',
    description: 'Slowest clapper wins!',
    instructions: 'Clap slowly. First to clap too fast is out!',
    durationSeconds: 20,
    minPlayers: 2,
    rewardPoints: 20,
    category: 'physical',
    requiresHost: true,
  },
];

// ===================
// VOTING PROMPTS
// ===================

export const VOTING_PROMPTS: VotingPrompt[] = [
  // Funny
  { id: 'vp-1', prompt: 'Who would survive longest in a zombie apocalypse?', category: 'funny' },
  { id: 'vp-2', prompt: 'Who would most likely become a viral TikTok star?', category: 'funny' },
  { id: 'vp-3', prompt: 'Who would be the worst person to get dating advice from?', category: 'funny' },
  { id: 'vp-4', prompt: 'Who would accidentally start a cult?', category: 'funny' },
  { id: 'vp-5', prompt: 'Who would be the most dramatic in an action movie?', category: 'funny' },
  { id: 'vp-6', prompt: 'Who would be caught talking to their houseplants?', category: 'funny' },
  { id: 'vp-7', prompt: 'Who has the most chaotic search history?', category: 'funny' },
  { id: 'vp-8', prompt: 'Who would be the worst at keeping a secret?', category: 'funny' },

  // Embarrassing
  { id: 'vp-9', prompt: 'Who definitely cried during a Pixar movie recently?', category: 'embarrassing' },
  { id: 'vp-10', prompt: 'Who has the most embarrassing ringtone?', category: 'embarrassing' },
  { id: 'vp-11', prompt: 'Who secretly listens to guilty pleasure music?', category: 'embarrassing' },
  { id: 'vp-12', prompt: 'Who would be the first to accidentally send a text to the wrong person?', category: 'embarrassing' },

  // Wholesome
  { id: 'vp-13', prompt: 'Who gives the best hugs?', category: 'wholesome' },
  { id: 'vp-14', prompt: 'Who would you want on your team in a trivia contest?', category: 'wholesome' },
  { id: 'vp-15', prompt: 'Who would drop everything to help a friend move?', category: 'wholesome' },
  { id: 'vp-16', prompt: 'Who is the best listener?', category: 'wholesome' },
  { id: 'vp-17', prompt: 'Who would you trust to housesit for a month?', category: 'wholesome' },
  { id: 'vp-18', prompt: 'Who would be the best road trip companion?', category: 'wholesome' },

  // Competitive
  { id: 'vp-19', prompt: 'Who is the sorest loser?', category: 'competitive' },
  { id: 'vp-20', prompt: 'Who talks the most trash during games?', category: 'competitive' },
  { id: 'vp-21', prompt: 'Who would cheat at Monopoly?', category: 'competitive' },
  { id: 'vp-22', prompt: 'Who celebrates the hardest when they win?', category: 'competitive' },
  { id: 'vp-23', prompt: 'Who is secretly the most competitive?', category: 'competitive' },
  { id: 'vp-24', prompt: 'Who would flip the board if they were losing?', category: 'competitive' },
];

// ===================
// TRIVIA QUESTIONS
// ===================

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  // Gaming - Easy
  { id: 'tq-1', question: 'What color is Mario\'s hat?', options: ['Blue', 'Red', 'Green', 'Yellow'], correctIndex: 1, category: 'gaming', difficulty: 'easy' },
  { id: 'tq-2', question: 'In Minecraft, what do you need to sleep?', options: ['A pillow', 'A bed', 'A blanket', 'A chair'], correctIndex: 1, category: 'gaming', difficulty: 'easy' },
  { id: 'tq-3', question: 'What game has characters named Link and Zelda?', options: ['Mario', 'Pokemon', 'Zelda', 'Sonic'], correctIndex: 2, category: 'gaming', difficulty: 'easy' },

  // Gaming - Medium
  { id: 'tq-4', question: 'What year was the original PlayStation released?', options: ['1990', '1994', '1998', '2000'], correctIndex: 1, category: 'gaming', difficulty: 'medium' },
  { id: 'tq-5', question: 'In Among Us, what color is NOT a default crewmate option?', options: ['Pink', 'Brown', 'Orange', 'Gray'], correctIndex: 3, category: 'gaming', difficulty: 'medium' },

  // Movies - Easy
  { id: 'tq-6', question: 'What animal is Simba in The Lion King?', options: ['Tiger', 'Lion', 'Leopard', 'Cheetah'], correctIndex: 1, category: 'movies', difficulty: 'easy' },
  { id: 'tq-7', question: 'In Frozen, what is the name of the snowman?', options: ['Olaf', 'Frosty', 'Jack', 'Snowy'], correctIndex: 0, category: 'movies', difficulty: 'easy' },
  { id: 'tq-8', question: 'What superhero is known as the Dark Knight?', options: ['Superman', 'Spider-Man', 'Batman', 'Iron Man'], correctIndex: 2, category: 'movies', difficulty: 'easy' },

  // Movies - Medium
  { id: 'tq-9', question: 'What is the name of the robot in WALL-E?', options: ['EVE', 'WALL-E', 'AUTO', 'M-O'], correctIndex: 1, category: 'movies', difficulty: 'medium' },
  { id: 'tq-10', question: 'How many Infinity Stones are there in the MCU?', options: ['4', '5', '6', '7'], correctIndex: 2, category: 'movies', difficulty: 'medium' },

  // Music - Easy
  { id: 'tq-11', question: 'Who sang "Bad Guy"?', options: ['Ariana Grande', 'Billie Eilish', 'Taylor Swift', 'Dua Lipa'], correctIndex: 1, category: 'music', difficulty: 'easy' },
  { id: 'tq-12', question: 'What band sang "Bohemian Rhapsody"?', options: ['The Beatles', 'Led Zeppelin', 'Queen', 'Pink Floyd'], correctIndex: 2, category: 'music', difficulty: 'easy' },

  // General - Easy
  { id: 'tq-13', question: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], correctIndex: 1, category: 'general', difficulty: 'easy' },
  { id: 'tq-14', question: 'What is the largest planet in our solar system?', options: ['Saturn', 'Jupiter', 'Neptune', 'Uranus'], correctIndex: 1, category: 'general', difficulty: 'easy' },

  // Food - Easy
  { id: 'tq-15', question: 'What fruit is on top of a Hawaiian pizza?', options: ['Mango', 'Pineapple', 'Banana', 'Orange'], correctIndex: 1, category: 'food', difficulty: 'easy' },
  { id: 'tq-16', question: 'What country does sushi come from?', options: ['China', 'Korea', 'Japan', 'Thailand'], correctIndex: 2, category: 'food', difficulty: 'easy' },
];

// ===================
// HELPER FUNCTIONS
// ===================

export function getMiniGamesByCategory(category: MiniGameTemplate['category']): MiniGameTemplate[] {
  return MINI_GAME_TEMPLATES.filter(g => g.category === category);
}

export function getRandomVotingPrompt(category?: VotingPrompt['category']): VotingPrompt {
  const prompts = category
    ? VOTING_PROMPTS.filter(p => p.category === category)
    : VOTING_PROMPTS;
  return prompts[Math.floor(Math.random() * prompts.length)];
}

export function getRandomTriviaQuestion(
  category?: TriviaQuestion['category'],
  difficulty?: TriviaQuestion['difficulty']
): TriviaQuestion {
  let questions = TRIVIA_QUESTIONS;

  if (category) {
    questions = questions.filter(q => q.category === category);
  }
  if (difficulty) {
    questions = questions.filter(q => q.difficulty === difficulty);
  }

  return questions[Math.floor(Math.random() * questions.length)];
}

export function selectMiniGame(
  playerCount: number,
  excludeTypes: string[] = [],
  requiresHostOk: boolean = true
): MiniGameTemplate | null {
  let games = MINI_GAME_TEMPLATES.filter(g => {
    if (g.minPlayers > playerCount) return false;
    if (g.maxPlayers && g.maxPlayers < playerCount) return false;
    if (excludeTypes.includes(g.type)) return false;
    if (!requiresHostOk && g.requiresHost) return false;
    return true;
  });

  if (games.length === 0) return null;

  return games[Math.floor(Math.random() * games.length)];
}
