// Secret Objective Templates for Chaos Agent
// Each objective has different difficulty levels and point rewards

export interface ObjectiveTemplate {
  id: string;
  title: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5; // 1 = easy, 5 = legendary
  chaosPoints: number;
  category: 'social' | 'performance' | 'sabotage' | 'alliance' | 'endurance' | 'meta';
  requiresVote: boolean; // Does completion need group verification?
  tags: string[]; // For filtering based on setup answers
}

export const OBJECTIVE_TEMPLATES: ObjectiveTemplate[] = [
  // ===================
  // SOCIAL OBJECTIVES
  // ===================
  {
    id: 'word-dropper',
    title: 'The Word Dropper',
    description: 'Get someone to say the word "definitely" three times during the game.',
    difficulty: 2,
    chaosPoints: 15,
    category: 'social',
    requiresVote: true,
    tags: ['verbal', 'subtle'],
  },
  {
    id: 'compliment-king',
    title: 'Compliment King',
    description: 'Give genuine compliments to every player at the table before the night ends.',
    difficulty: 1,
    chaosPoints: 10,
    category: 'social',
    requiresVote: false,
    tags: ['positive', 'easy'],
  },
  {
    id: 'storyteller',
    title: 'The Storyteller',
    description: 'Tell an obviously fake "childhood story" and get at least one person to believe it.',
    difficulty: 3,
    chaosPoints: 25,
    category: 'social',
    requiresVote: true,
    tags: ['deception', 'verbal'],
  },
  {
    id: 'nickname-master',
    title: 'Nickname Master',
    description: 'Give everyone a nickname and have them use each other\'s nicknames at least once.',
    difficulty: 2,
    chaosPoints: 20,
    category: 'social',
    requiresVote: true,
    tags: ['verbal', 'fun'],
  },
  {
    id: 'debate-starter',
    title: 'Debate Starter',
    description: 'Start a friendly debate about something ridiculous (pineapple on pizza, etc.) that lasts at least 2 minutes.',
    difficulty: 2,
    chaosPoints: 15,
    category: 'social',
    requiresVote: true,
    tags: ['verbal', 'chaos'],
  },

  // ===================
  // PERFORMANCE OBJECTIVES
  // ===================
  {
    id: 'victory-dance',
    title: 'Victory Dance',
    description: 'Do a victory dance or celebration every time you win something (even small wins).',
    difficulty: 1,
    chaosPoints: 10,
    category: 'performance',
    requiresVote: false,
    tags: ['physical', 'fun', 'easy'],
  },
  {
    id: 'accent-actor',
    title: 'Accent Actor',
    description: 'Speak in a fake accent for an entire round without anyone calling you out.',
    difficulty: 3,
    chaosPoints: 25,
    category: 'performance',
    requiresVote: true,
    tags: ['verbal', 'performance'],
  },
  {
    id: 'dramatic-reader',
    title: 'Dramatic Reader',
    description: 'Read any game text/cards with maximum theatrical drama.',
    difficulty: 1,
    chaosPoints: 10,
    category: 'performance',
    requiresVote: false,
    tags: ['verbal', 'fun', 'easy'],
  },
  {
    id: 'slow-motion',
    title: 'Slow-Mo Champion',
    description: 'Make at least one play/move in slow motion while everyone watches.',
    difficulty: 2,
    chaosPoints: 15,
    category: 'performance',
    requiresVote: true,
    tags: ['physical', 'fun'],
  },
  {
    id: 'catchphrase-creator',
    title: 'Catchphrase Creator',
    description: 'Create and use a catchphrase at least 5 times that others start using too.',
    difficulty: 3,
    chaosPoints: 25,
    category: 'performance',
    requiresVote: true,
    tags: ['verbal', 'influence'],
  },

  // ===================
  // SABOTAGE OBJECTIVES
  // ===================
  {
    id: 'the-distractor',
    title: 'The Distractor',
    description: 'Cause another player to make a bad move by distracting them at the right moment.',
    difficulty: 3,
    chaosPoints: 25,
    category: 'sabotage',
    requiresVote: true,
    tags: ['competitive', 'sabotage'],
  },
  {
    id: 'doubt-planter',
    title: 'Doubt Planter',
    description: 'Convince someone to change their strategy by "helpfully" suggesting a worse option.',
    difficulty: 4,
    chaosPoints: 35,
    category: 'sabotage',
    requiresVote: true,
    tags: ['deception', 'competitive'],
  },
  {
    id: 'blame-shifter',
    title: 'Blame Shifter',
    description: 'When something goes wrong for you, successfully blame it on bad luck or the game itself.',
    difficulty: 2,
    chaosPoints: 15,
    category: 'sabotage',
    requiresVote: false,
    tags: ['verbal', 'easy'],
  },
  {
    id: 'false-prophet',
    title: 'False Prophet',
    description: 'Give confident but completely wrong advice about strategy that someone follows.',
    difficulty: 4,
    chaosPoints: 35,
    category: 'sabotage',
    requiresVote: true,
    tags: ['deception', 'competitive'],
  },

  // ===================
  // ALLIANCE OBJECTIVES
  // ===================
  {
    id: 'secret-ally',
    title: 'Secret Ally',
    description: 'Form a secret alliance with another player without anyone else noticing.',
    difficulty: 3,
    chaosPoints: 30,
    category: 'alliance',
    requiresVote: false, // Self-reported with ally confirmation
    tags: ['teamwork', 'secret'],
  },
  {
    id: 'peacemaker',
    title: 'The Peacemaker',
    description: 'Defuse a tense moment between players with humor or diplomacy.',
    difficulty: 2,
    chaosPoints: 20,
    category: 'alliance',
    requiresVote: true,
    tags: ['positive', 'social'],
  },
  {
    id: 'wingman',
    title: 'The Wingman',
    description: 'Help another player win a round even if it means you lose.',
    difficulty: 3,
    chaosPoints: 25,
    category: 'alliance',
    requiresVote: true,
    tags: ['teamwork', 'sacrifice'],
  },
  {
    id: 'double-agent',
    title: 'Double Agent',
    description: 'Pretend to help one player while secretly helping another.',
    difficulty: 5,
    chaosPoints: 50,
    category: 'alliance',
    requiresVote: true,
    tags: ['deception', 'advanced'],
  },

  // ===================
  // ENDURANCE OBJECTIVES
  // ===================
  {
    id: 'poker-face',
    title: 'Poker Face',
    description: 'Don\'t react to anything surprising for an entire round - maintain a neutral expression.',
    difficulty: 3,
    chaosPoints: 25,
    category: 'endurance',
    requiresVote: true,
    tags: ['self-control', 'difficult'],
  },
  {
    id: 'no-complaints',
    title: 'No Complaints Zone',
    description: 'Go the entire game night without complaining about anything (luck, rules, etc.).',
    difficulty: 4,
    chaosPoints: 40,
    category: 'endurance',
    requiresVote: true,
    tags: ['positive', 'difficult'],
  },
  {
    id: 'standing-ovation',
    title: 'Standing Ovation',
    description: 'Stand up and applaud whenever anyone wins anything.',
    difficulty: 2,
    chaosPoints: 15,
    category: 'endurance',
    requiresVote: false,
    tags: ['physical', 'fun'],
  },
  {
    id: 'last-one-standing',
    title: 'Last One Standing',
    description: 'Be the last person to check your phone during the game night.',
    difficulty: 3,
    chaosPoints: 30,
    category: 'endurance',
    requiresVote: true,
    tags: ['self-control', 'modern'],
  },

  // ===================
  // META OBJECTIVES
  // ===================
  {
    id: 'rule-lawyer',
    title: 'Rule Lawyer',
    description: 'Correctly cite a rule that benefits you at least once.',
    difficulty: 2,
    chaosPoints: 15,
    category: 'meta',
    requiresVote: true,
    tags: ['strategy', 'knowledge'],
  },
  {
    id: 'house-rule-hero',
    title: 'House Rule Hero',
    description: 'Successfully propose a house rule that everyone agrees to try.',
    difficulty: 3,
    chaosPoints: 25,
    category: 'meta',
    requiresVote: true,
    tags: ['creative', 'influence'],
  },
  {
    id: 'snack-master',
    title: 'Snack Master',
    description: 'Be the person who refreshes or shares snacks/drinks with the group.',
    difficulty: 1,
    chaosPoints: 10,
    category: 'meta',
    requiresVote: false,
    tags: ['helpful', 'easy'],
  },
  {
    id: 'photographer',
    title: 'The Photographer',
    description: 'Take at least 3 candid photos of great moments during the night.',
    difficulty: 1,
    chaosPoints: 10,
    category: 'meta',
    requiresVote: false,
    tags: ['modern', 'memories'],
  },
  {
    id: 'quote-collector',
    title: 'Quote Collector',
    description: 'Remember and repeat back the funniest quote of the night.',
    difficulty: 2,
    chaosPoints: 15,
    category: 'meta',
    requiresVote: true,
    tags: ['social', 'memories'],
  },
];

// Get objectives filtered by tags and difficulty
export function getFilteredObjectives(
  excludeTags: string[] = [],
  maxDifficulty: number = 5,
  minDifficulty: number = 1
): ObjectiveTemplate[] {
  return OBJECTIVE_TEMPLATES.filter(obj => {
    // Check difficulty range
    if (obj.difficulty > maxDifficulty || obj.difficulty < minDifficulty) {
      return false;
    }
    // Check excluded tags
    if (excludeTags.some(tag => obj.tags.includes(tag))) {
      return false;
    }
    return true;
  });
}

// Get random objectives for a session based on setup answers
export function selectObjectivesForSession(
  participantCount: number,
  setupAnswers: {
    comfortLevel?: 'chill' | 'moderate' | 'maximum';
    socialStyle?: 'observer' | 'participant' | 'instigator';
    physicalChallenges?: boolean;
    competitiveOk?: boolean;
  }
): ObjectiveTemplate[] {
  let excludeTags: string[] = [];
  let maxDifficulty = 5;

  // Adjust based on comfort level
  if (setupAnswers.comfortLevel === 'chill') {
    maxDifficulty = 2;
    excludeTags.push('sabotage', 'deception', 'difficult');
  } else if (setupAnswers.comfortLevel === 'moderate') {
    maxDifficulty = 4;
    excludeTags.push('advanced');
  }

  // Adjust based on social style
  if (setupAnswers.socialStyle === 'observer') {
    excludeTags.push('performance', 'verbal');
  }

  // Adjust based on physical challenges preference
  if (!setupAnswers.physicalChallenges) {
    excludeTags.push('physical');
  }

  // Adjust based on competitive preference
  if (!setupAnswers.competitiveOk) {
    excludeTags.push('competitive', 'sabotage');
  }

  const filtered = getFilteredObjectives(excludeTags, maxDifficulty);

  // Shuffle and pick enough for all participants
  const shuffled = filtered.sort(() => Math.random() - 0.5);

  // Give each participant 1-2 objectives depending on available pool
  const objectivesPerPlayer = Math.min(2, Math.floor(shuffled.length / participantCount));
  const totalNeeded = participantCount * objectivesPerPlayer;

  return shuffled.slice(0, totalNeeded);
}

// Helper to get objectives by category
export function getObjectivesByCategory(category: ObjectiveTemplate['category']): ObjectiveTemplate[] {
  return OBJECTIVE_TEMPLATES.filter(obj => obj.category === category);
}
