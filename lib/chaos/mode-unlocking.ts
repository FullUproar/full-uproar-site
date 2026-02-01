/**
 * Progressive Mode Unlocking for Chaos Agent
 *
 * Modes unlock based on completed sessions as host:
 * - PARTY: Available by default (always unlocked)
 * - PRIVATE_BINGO: Unlocks after 1 completed session
 * - COMPETITIVE: Unlocks after 2-3 completed sessions
 */

export type ScoringMode = 'PRIVATE_BINGO' | 'PARTY' | 'COMPETITIVE';

export interface UnlockedModes {
  PARTY: boolean;
  PRIVATE_BINGO: boolean;
  COMPETITIVE: boolean;
}

export interface ModeInfo {
  id: ScoringMode;
  label: string;
  description: string;
  icon: string;
  unlocked: boolean;
  sessionsRequired: number;
}

/**
 * Get which modes are unlocked based on sessions hosted
 */
export function getUnlockedModes(sessionsHosted: number): UnlockedModes {
  return {
    PARTY: true, // Always unlocked
    PRIVATE_BINGO: sessionsHosted >= 1,
    COMPETITIVE: sessionsHosted >= 2,
  };
}

/**
 * Get detailed mode information including unlock status
 */
export function getModeInfo(sessionsHosted: number): ModeInfo[] {
  const unlocked = getUnlockedModes(sessionsHosted);

  return [
    {
      id: 'PARTY',
      label: 'Party Mode',
      description: 'Scores visible to all, ties are welcome. Perfect for casual fun!',
      icon: '🎉',
      unlocked: unlocked.PARTY,
      sessionsRequired: 0,
    },
    {
      id: 'PRIVATE_BINGO',
      label: 'Private Bingo',
      description: 'Only you see your score. Like in-law bingo - quiet personal satisfaction.',
      icon: '🎯',
      unlocked: unlocked.PRIVATE_BINGO,
      sessionsRequired: 1,
    },
    {
      id: 'COMPETITIVE',
      label: 'Competitive',
      description: 'Clear leaderboard, winner declared, tie-breakers enforced.',
      icon: '🏆',
      unlocked: unlocked.COMPETITIVE,
      sessionsRequired: 2,
    },
  ];
}

/**
 * Check if a specific mode is available
 */
export function isModeUnlocked(mode: ScoringMode, sessionsHosted: number): boolean {
  const unlocked = getUnlockedModes(sessionsHosted);
  return unlocked[mode];
}

/**
 * Get next mode to unlock (for UI hints)
 */
export function getNextModeToUnlock(sessionsHosted: number): ModeInfo | null {
  const modes = getModeInfo(sessionsHosted);
  return modes.find(m => !m.unlocked) || null;
}

/**
 * Get sessions needed to unlock a specific mode
 */
export function getSessionsToUnlock(mode: ScoringMode): number {
  switch (mode) {
    case 'PARTY': return 0;
    case 'PRIVATE_BINGO': return 1;
    case 'COMPETITIVE': return 2;
  }
}
