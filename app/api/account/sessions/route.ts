import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserSessions } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await getUserSessions(user.id);
    
    // Format sessions for client
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      browser: session.browser,
      os: session.os,
      device: session.device,
      ipAddress: session.ipAddress,
      city: session.city,
      country: session.country,
      lastActive: session.lastActive.toISOString(),
      createdAt: session.createdAt.toISOString(),
      isActive: session.isActive
    }));

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}