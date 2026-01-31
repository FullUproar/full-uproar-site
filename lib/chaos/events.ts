// Random Event Templates for Chaos Agent
// Events trigger periodically during game night to add chaos

export interface EventTemplate {
  id: string;
  type: string;
  title: string;
  description: string;
  intensity: 'LOW' | 'MEDIUM' | 'HIGH';
  durationMinutes?: number; // null = instant/one-time
  targetType: 'ALL' | 'RANDOM_ONE' | 'HOST_CHOICE' | 'LOWEST_SCORE' | 'HIGHEST_SCORE';
  category: 'speech' | 'physical' | 'social' | 'game' | 'challenge' | 'bonus';
  tags: string[];
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  // ===================
  // LOW INTENSITY
  // ===================

  // Speech Events
  {
    id: 'silence-golden',
    type: 'SILENCE',
    title: 'Silence is Golden',
    description: 'No talking for the next 2 minutes! Communicate only with gestures.',
    intensity: 'LOW',
    durationMinutes: 2,
    targetType: 'ALL',
    category: 'speech',
    tags: ['quiet', 'fun'],
  },
  {
    id: 'compliment-round',
    type: 'COMPLIMENT',
    title: 'Compliment Round',
    description: 'Everyone must give the person to their left a genuine compliment.',
    intensity: 'LOW',
    durationMinutes: 3,
    targetType: 'ALL',
    category: 'social',
    tags: ['positive', 'wholesome'],
  },
  {
    id: 'accent-time',
    type: 'ACCENT',
    title: 'Accent Time',
    description: 'Everyone must speak in a silly accent for the next 5 minutes.',
    intensity: 'LOW',
    durationMinutes: 5,
    targetType: 'ALL',
    category: 'speech',
    tags: ['fun', 'verbal'],
  },
  {
    id: 'whisper-mode',
    type: 'WHISPER',
    title: 'Whisper Mode',
    description: 'Everyone can only whisper for the next 3 minutes.',
    intensity: 'LOW',
    durationMinutes: 3,
    targetType: 'ALL',
    category: 'speech',
    tags: ['quiet', 'silly'],
  },
  {
    id: 'royal-decree',
    type: 'ROYAL',
    title: 'Royal Decree',
    description: 'Everyone must address each other as "Your Majesty" for 5 minutes.',
    intensity: 'LOW',
    durationMinutes: 5,
    targetType: 'ALL',
    category: 'speech',
    tags: ['fun', 'silly'],
  },
  {
    id: 'question-only',
    type: 'QUESTIONS',
    title: 'Question Time',
    description: 'You can only speak in questions for the next 3 minutes.',
    intensity: 'LOW',
    durationMinutes: 3,
    targetType: 'ALL',
    category: 'speech',
    tags: ['challenge', 'verbal'],
  },
  {
    id: 'sing-it',
    type: 'SINGING',
    title: 'Sing Your Words',
    description: 'The next person to speak must sing what they want to say.',
    intensity: 'LOW',
    durationMinutes: 1,
    targetType: 'RANDOM_ONE',
    category: 'speech',
    tags: ['fun', 'performance'],
  },

  // Social Events
  {
    id: 'high-five',
    type: 'HIGH_FIVE',
    title: 'High Five Chain',
    description: 'Everyone high-five the person next to them!',
    intensity: 'LOW',
    targetType: 'ALL',
    category: 'social',
    tags: ['physical', 'fun'],
  },
  {
    id: 'story-time',
    type: 'STORY',
    title: 'Quick Story',
    description: 'Someone tell a 30-second story about their worst gaming moment.',
    intensity: 'LOW',
    durationMinutes: 1,
    targetType: 'RANDOM_ONE',
    category: 'social',
    tags: ['verbal', 'sharing'],
  },
  {
    id: 'toast',
    type: 'TOAST',
    title: 'Toast Time!',
    description: 'Everyone raise your drinks (or imaginary drinks) for a silly toast!',
    intensity: 'LOW',
    targetType: 'ALL',
    category: 'social',
    tags: ['fun', 'celebration'],
  },

  // ===================
  // MEDIUM INTENSITY
  // ===================

  // Physical Events
  {
    id: 'swap-seats',
    type: 'SWAP_SEATS',
    title: 'Musical Chairs',
    description: 'Everyone swap seats with the person across from you!',
    intensity: 'MEDIUM',
    durationMinutes: 1,
    targetType: 'ALL',
    category: 'physical',
    tags: ['movement', 'chaos'],
  },
  {
    id: 'opposite-hand',
    type: 'OPPOSITE_HAND',
    title: 'Opposite Hand',
    description: 'Play with your non-dominant hand for the next 10 minutes.',
    intensity: 'MEDIUM',
    durationMinutes: 10,
    targetType: 'ALL',
    category: 'physical',
    tags: ['challenge', 'skill'],
  },
  {
    id: 'stand-up',
    type: 'STAND',
    title: 'Stand Up!',
    description: 'Everyone must stand for the next 5 minutes.',
    intensity: 'MEDIUM',
    durationMinutes: 5,
    targetType: 'ALL',
    category: 'physical',
    tags: ['movement', 'endurance'],
  },
  {
    id: 'eyes-closed',
    type: 'EYES_CLOSED',
    title: 'Eyes Wide Shut',
    description: 'Keep your eyes closed for the next 30 seconds while playing.',
    intensity: 'MEDIUM',
    durationMinutes: 1,
    targetType: 'RANDOM_ONE',
    category: 'physical',
    tags: ['challenge', 'silly'],
  },
  {
    id: 'stretch-break',
    type: 'STRETCH',
    title: 'Stretch Break',
    description: 'Everyone do a quick 1-minute stretch together!',
    intensity: 'MEDIUM',
    durationMinutes: 1,
    targetType: 'ALL',
    category: 'physical',
    tags: ['health', 'break'],
  },

  // Speech Events
  {
    id: 'narrator',
    type: 'NARRATOR',
    title: 'The Narrator',
    description: 'One player must narrate everyone\'s actions in third person.',
    intensity: 'MEDIUM',
    durationMinutes: 5,
    targetType: 'RANDOM_ONE',
    category: 'speech',
    tags: ['performance', 'fun'],
  },
  {
    id: 'no-names',
    type: 'NO_NAMES',
    title: 'No Names',
    description: 'Cannot use anyone\'s name! Use funny descriptors instead.',
    intensity: 'MEDIUM',
    durationMinutes: 10,
    targetType: 'ALL',
    category: 'speech',
    tags: ['challenge', 'creative'],
  },
  {
    id: 'third-person',
    type: 'THIRD_PERSON',
    title: 'Third Person Only',
    description: 'Everyone must refer to themselves in third person.',
    intensity: 'MEDIUM',
    durationMinutes: 5,
    targetType: 'ALL',
    category: 'speech',
    tags: ['silly', 'challenge'],
  },
  {
    id: 'movie-quotes',
    type: 'MOVIE_QUOTES',
    title: 'Movie Quote Mode',
    description: 'Only communicate using famous movie quotes for 3 minutes.',
    intensity: 'MEDIUM',
    durationMinutes: 3,
    targetType: 'ALL',
    category: 'speech',
    tags: ['creative', 'fun'],
  },

  // Game Events
  {
    id: 'role-swap',
    type: 'ROLE_SWAP',
    title: 'Role Reversal',
    description: 'The player in first place swaps positions/roles with last place.',
    intensity: 'MEDIUM',
    targetType: 'ALL',
    category: 'game',
    tags: ['competitive', 'chaos'],
  },
  {
    id: 'speed-round',
    type: 'SPEED_ROUND',
    title: 'Speed Round!',
    description: 'Next round must be played at double speed - 10 second turns max!',
    intensity: 'MEDIUM',
    durationMinutes: 5,
    targetType: 'ALL',
    category: 'game',
    tags: ['fast', 'chaos'],
  },
  {
    id: 'advisor',
    type: 'ADVISOR',
    title: 'Backseat Driver',
    description: 'One player must take advice from everyone else for their next turn.',
    intensity: 'MEDIUM',
    targetType: 'RANDOM_ONE',
    category: 'game',
    tags: ['collaborative', 'fun'],
  },

  // Challenge Events
  {
    id: 'impression',
    type: 'IMPRESSION',
    title: 'Quick Impression',
    description: 'Do a 10-second impression of a celebrity or character.',
    intensity: 'MEDIUM',
    durationMinutes: 1,
    targetType: 'RANDOM_ONE',
    category: 'challenge',
    tags: ['performance', 'fun'],
  },
  {
    id: 'dance-break',
    type: 'DANCE',
    title: 'Dance Break!',
    description: 'Everyone do their signature dance move!',
    intensity: 'MEDIUM',
    durationMinutes: 1,
    targetType: 'ALL',
    category: 'challenge',
    tags: ['physical', 'fun'],
  },

  // ===================
  // HIGH INTENSITY
  // ===================

  // Physical Events
  {
    id: 'phone-stack',
    type: 'PHONE_STACK',
    title: 'Phone Stack',
    description: 'Everyone stack phones in the middle. First to grab theirs loses 50 points!',
    intensity: 'HIGH',
    durationMinutes: 15,
    targetType: 'ALL',
    category: 'physical',
    tags: ['challenge', 'modern'],
  },
  {
    id: 'one-hand',
    type: 'ONE_HAND',
    title: 'One Hand Only',
    description: 'Keep one hand behind your back for the next 10 minutes.',
    intensity: 'HIGH',
    durationMinutes: 10,
    targetType: 'ALL',
    category: 'physical',
    tags: ['challenge', 'difficult'],
  },
  {
    id: 'freeze',
    type: 'FREEZE',
    title: 'Freeze!',
    description: 'When someone says "freeze" everyone must stop moving for 5 seconds.',
    intensity: 'HIGH',
    durationMinutes: 10,
    targetType: 'ALL',
    category: 'physical',
    tags: ['reactive', 'fun'],
  },

  // Speech Events
  {
    id: 'reverse-talk',
    type: 'REVERSE',
    title: 'Reverse Psychology',
    description: 'Say the opposite of what you mean for 5 minutes.',
    intensity: 'HIGH',
    durationMinutes: 5,
    targetType: 'ALL',
    category: 'speech',
    tags: ['challenge', 'confusing'],
  },
  {
    id: 'emoji-speak',
    type: 'EMOJI_SPEAK',
    title: 'Emoji Language',
    description: 'Can only communicate by describing emojis verbally.',
    intensity: 'HIGH',
    durationMinutes: 3,
    targetType: 'ALL',
    category: 'speech',
    tags: ['creative', 'modern'],
  },
  {
    id: 'compliment-battle',
    type: 'COMPLIMENT_BATTLE',
    title: 'Compliment Battle',
    description: 'Two players must have a compliment battle - most genuine wins!',
    intensity: 'HIGH',
    durationMinutes: 2,
    targetType: 'HOST_CHOICE',
    category: 'speech',
    tags: ['competitive', 'wholesome'],
  },

  // Challenge Events
  {
    id: 'truth-bomb',
    type: 'TRUTH',
    title: 'Truth Bomb',
    description: 'Everyone share one surprising fact about themselves.',
    intensity: 'HIGH',
    durationMinutes: 5,
    targetType: 'ALL',
    category: 'challenge',
    tags: ['personal', 'bonding'],
  },
  {
    id: 'hot-seat',
    type: 'HOT_SEAT',
    title: 'Hot Seat',
    description: 'One player answers 3 rapid-fire questions from the group.',
    intensity: 'HIGH',
    durationMinutes: 2,
    targetType: 'RANDOM_ONE',
    category: 'challenge',
    tags: ['personal', 'fun'],
  },
  {
    id: 'prediction',
    type: 'PREDICTION',
    title: 'Bold Prediction',
    description: 'Everyone predict who will win the next round. Correct guesses get bonus points!',
    intensity: 'HIGH',
    targetType: 'ALL',
    category: 'challenge',
    tags: ['competitive', 'betting'],
  },

  // Bonus Events
  {
    id: 'bonus-round',
    type: 'BONUS',
    title: 'Bonus Points!',
    description: 'The underdog (lowest score) gets 25 bonus chaos points!',
    intensity: 'HIGH',
    targetType: 'LOWEST_SCORE',
    category: 'bonus',
    tags: ['comeback', 'points'],
  },
  {
    id: 'double-points',
    type: 'DOUBLE',
    title: 'Double or Nothing',
    description: 'Next mini-game awards double points to the winner!',
    intensity: 'HIGH',
    targetType: 'ALL',
    category: 'bonus',
    tags: ['competitive', 'stakes'],
  },
  {
    id: 'point-swap',
    type: 'POINT_SWAP',
    title: 'Point Swap',
    description: 'First and last place swap their chaos points!',
    intensity: 'HIGH',
    targetType: 'ALL',
    category: 'bonus',
    tags: ['chaos', 'dramatic'],
  },
];

// Get events by intensity
export function getEventsByIntensity(intensity: EventTemplate['intensity']): EventTemplate[] {
  return EVENT_TEMPLATES.filter(e => e.intensity === intensity);
}

// Get all events up to a certain intensity level
export function getEventsUpToIntensity(maxIntensity: 'LOW' | 'MEDIUM' | 'HIGH'): EventTemplate[] {
  const levels: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
  const maxLevel = levels[maxIntensity];

  return EVENT_TEMPLATES.filter(e => levels[e.intensity] <= maxLevel);
}

// Get filtered events based on tags and settings
export function getFilteredEvents(
  intensity: 'LOW' | 'MEDIUM' | 'HIGH',
  excludeTags: string[] = []
): EventTemplate[] {
  const events = getEventsUpToIntensity(intensity);

  return events.filter(e => {
    if (excludeTags.some(tag => e.tags.includes(tag))) {
      return false;
    }
    return true;
  });
}

// Select a random event appropriate for current settings
export function selectRandomEvent(
  intensity: 'LOW' | 'MEDIUM' | 'HIGH',
  excludeTags: string[] = [],
  recentEventTypes: string[] = [] // Avoid repeating recent events
): EventTemplate | null {
  let events = getFilteredEvents(intensity, excludeTags);

  // Filter out recently used event types
  if (recentEventTypes.length > 0) {
    const filtered = events.filter(e => !recentEventTypes.includes(e.type));
    // Only use filtered if we have options left
    if (filtered.length > 0) {
      events = filtered;
    }
  }

  if (events.length === 0) {
    return null;
  }

  // Weighted random selection - favor events from the target intensity
  const weightedEvents = events.flatMap(e => {
    const weight = e.intensity === intensity ? 3 : 1;
    return Array(weight).fill(e);
  });

  return weightedEvents[Math.floor(Math.random() * weightedEvents.length)];
}

// Get events by category
export function getEventsByCategory(category: EventTemplate['category']): EventTemplate[] {
  return EVENT_TEMPLATES.filter(e => e.category === category);
}
