import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { revokeAllSessions } from '@/lib/session';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current session token from headers (if available)
    const headersInstance = await headers();
    const currentToken = headersInstance.get('x-session-token');
    
    // Revoke all sessions except current
    await revokeAllSessions(user.id, currentToken || undefined);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking all sessions:', error);
    return NextResponse.json({ error: 'Failed to revoke sessions' }, { status: 500 });
  }
}