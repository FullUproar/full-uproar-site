import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserSecurityService } from '@/lib/services/user-security';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ 
        allowed: false,
        reason: 'Not authenticated' 
      }, { status: 401 });
    }

    const { action } = await request.json();
    
    if (!['post', 'comment', 'vote', 'message', 'create_thread'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action' 
      }, { status: 400 });
    }

    const result = await UserSecurityService.canPerformAction(user.id, action);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking user action permission:', error);
    return NextResponse.json({ 
      allowed: false,
      reason: 'An error occurred checking permissions' 
    }, { status: 500 });
  }
}