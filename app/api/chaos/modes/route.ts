import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUnlockedModes, getModeInfo, getNextModeToUnlock } from '@/lib/chaos/mode-unlocking';

// GET /api/chaos/modes - Get user's unlocked scoring modes
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const sessionsHosted = user.chaosSessionsHosted || 0;
    const unlockedModes = getUnlockedModes(sessionsHosted);
    const modeInfo = getModeInfo(sessionsHosted);
    const nextToUnlock = getNextModeToUnlock(sessionsHosted);

    return NextResponse.json({
      sessionsHosted,
      unlockedModes,
      modes: modeInfo,
      nextToUnlock,
    });
  } catch (error) {
    console.error('Error getting chaos modes:', error);
    return NextResponse.json({ error: 'Failed to get modes' }, { status: 500 });
  }
}
