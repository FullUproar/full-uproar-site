/**
 * Haptic feedback utilities for Chaos Agent
 * Haptics are the primary notification channel on mobile
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'double';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10], // quick double tap
  warning: [25, 50, 25, 50, 25], // triple pulse
  error: [50, 100, 50], // long-short-long
  double: [15, 30, 15], // double tap
};

/**
 * Trigger haptic feedback if available
 */
export function haptic(pattern: HapticPattern = 'medium'): boolean {
  if (typeof navigator === 'undefined' || !navigator.vibrate) {
    return false;
  }

  try {
    const vibration = PATTERNS[pattern];
    return navigator.vibrate(vibration);
  } catch {
    return false;
  }
}

/**
 * Trigger haptic for specific Chaos Agent events
 */
export const chaosHaptics = {
  // Events
  eventStarted: () => haptic('heavy'),
  eventCompleted: () => haptic('success'),

  // Points
  pointsGained: () => haptic('success'),
  pointsLost: () => haptic('warning'),

  // Objectives
  objectiveClaimed: () => haptic('medium'),
  objectiveVerified: () => haptic('success'),
  objectiveFailed: () => haptic('error'),

  // Bets
  betPlaced: () => haptic('light'),
  betWon: () => haptic('success'),
  betLost: () => haptic('warning'),

  // Mini-games
  miniGameStart: () => haptic('double'),
  miniGameWin: () => haptic('success'),

  // UI interactions
  buttonTap: () => haptic('light'),
  tabSwitch: () => haptic('light'),
};

export default chaosHaptics;
