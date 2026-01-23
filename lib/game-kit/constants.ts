/**
 * Game Kit Constants
 * Centralized strings for consistent UX messaging across game-kit pages
 */

// =============================================================================
// LOADING MESSAGES
// =============================================================================

export const LOADING_MESSAGES = {
  // Generic
  DEFAULT: 'Loading...',

  // Specific contexts
  GAME: 'Loading game...',
  GAMES: 'Loading your games...',
  TEMPLATES: 'Loading templates...',
  ROOM: 'Connecting to room...',
  INVITE: 'Loading invite...',
  SESSION: 'Setting up game session...',
} as const;

// =============================================================================
// ERROR MESSAGES
// =============================================================================

export const ERROR_MESSAGES = {
  // Network/connection errors
  CONNECTION_FAILED: 'Failed to connect. Please check your internet and try again.',
  SERVER_ERROR: 'Something went wrong on our end. Please try again.',

  // Room/session errors
  ROOM_NOT_FOUND: 'Room not found. Check the code and try again.',
  ROOM_FULL: 'This room is full.',
  ROOM_CLOSED: 'This game session has ended.',

  // Game errors
  GAME_NOT_FOUND: 'Game not found. It may have been deleted.',
  GAME_LOAD_FAILED: 'Failed to load game. Please try again.',
  GAME_SAVE_FAILED: 'Failed to save. Please try again.',
  GAME_CREATE_FAILED: 'Failed to create game. Please try again.',
  GAME_DELETE_FAILED: 'Failed to delete game. Please try again.',
  GAME_START_FAILED: 'Failed to start game. Please try again.',

  // Validation errors
  NICKNAME_REQUIRED: 'Please enter a nickname.',
  CODE_INCOMPLETE: 'Please enter the complete 6-character code.',
  NAME_REQUIRED: 'Please enter a name for your game.',

  // Auth errors
  INVITE_INVALID: 'This invite link is invalid or has expired.',
  INVITE_LOAD_FAILED: 'Failed to load invite.',
  PASSWORD_INCORRECT: 'Incorrect password.',

  // Generic fallbacks
  GENERIC: 'Something went wrong. Please try again.',
} as const;

// =============================================================================
// SUCCESS MESSAGES
// =============================================================================

export const SUCCESS_MESSAGES = {
  // Save/create
  GAME_SAVED: 'Game saved!',
  GAME_CREATED: 'Game created!',
  GAME_DELETED: 'Game deleted.',
  CARDS_SAVED: 'Cards saved!',

  // Copy/share
  LINK_COPIED: 'Link copied to clipboard!',
  CODE_COPIED: 'Room code copied!',

  // Room actions
  PLAYER_JOINED: 'Player joined!',
  GAME_STARTED: 'Game started!',
} as const;

// =============================================================================
// BUTTON LABELS
// =============================================================================

export const BUTTON_LABELS = {
  // Actions
  CREATE: 'Create',
  SAVE: 'Save',
  CANCEL: 'Cancel',
  DELETE: 'Delete',
  EDIT: 'Edit',
  PLAY: 'Play',
  START: 'Start Game',
  JOIN: 'Join Game',
  LEAVE: 'Leave',
  EXIT: 'Exit',
  BACK: 'Back',

  // States
  SAVING: 'Saving...',
  CREATING: 'Creating...',
  JOINING: 'Joining...',
  STARTING: 'Starting...',
  LOADING: 'Loading...',

  // Completed states
  SAVED: 'Saved!',
  COPIED: 'Copied!',
  CREATED: 'Created!',
} as const;

// =============================================================================
// EMPTY STATES
// =============================================================================

export const EMPTY_STATES = {
  NO_GAMES: {
    title: 'No games yet',
    description: 'Create your first custom card game in minutes!',
    action: 'Create Your First Game',
  },
  NO_CARDS: {
    title: 'No cards yet',
    description: 'Add some cards to get started!',
    action: 'Add Card',
  },
  NO_PLAYERS: {
    title: 'Waiting for players',
    description: 'Share the room code to invite friends!',
  },
} as const;

// =============================================================================
// PAGE TITLES & DESCRIPTIONS
// =============================================================================

export const PAGE_META = {
  DASHBOARD: {
    title: 'Game Kit',
    subtitle: 'Create and share your own card games',
  },
  NEW_GAME: {
    title: 'Choose a Template',
    subtitle: 'Pick a game type to get started',
  },
  BUILDER: {
    title: 'Game Builder',
    subtitle: 'Design your game flow',
  },
  EDITOR: {
    subtitle: (templateName: string) => `Create your own ${templateName} cards`,
  },
  JOIN: {
    title: 'Join Game',
    subtitle: 'Enter the room code shown on the host\'s screen',
  },
  LOBBY: {
    title: 'Game Lobby',
    subtitle: 'Waiting for players to join...',
  },
} as const;

// =============================================================================
// HELPER FUNCTION
// =============================================================================

/**
 * Get a user-friendly error message from an API error response
 */
export function getErrorMessage(error: unknown, fallback: string = ERROR_MESSAGES.GENERIC): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'error' in error) {
    return (error as { error: string }).error;
  }
  return fallback;
}
