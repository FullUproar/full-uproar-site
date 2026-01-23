/**
 * Room Code Utilities
 * Generates and validates Jackbox-style room codes
 */

// Characters that are easy to read and type (no 0/O, 1/I/L confusion)
const ROOM_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 6;

/**
 * Generate a random room code
 * Format: 6 characters, alphanumeric, easy to read
 */
export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

/**
 * Validate a room code format
 */
export function isValidRoomCode(code: string): boolean {
  if (!code || code.length !== ROOM_CODE_LENGTH) return false;
  const upperCode = code.toUpperCase();
  return [...upperCode].every(char => ROOM_CODE_CHARS.includes(char));
}

/**
 * Normalize a room code (uppercase, trim whitespace)
 */
export function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Generate a unique room code that doesn't exist in the database
 */
export async function generateUniqueRoomCode(
  checkExists: (code: string) => Promise<boolean>,
  maxAttempts = 10
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateRoomCode();
    const exists = await checkExists(code);
    if (!exists) return code;
  }
  throw new Error('Failed to generate unique room code after maximum attempts');
}
