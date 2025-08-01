import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { revokeSession } from '@/lib/session';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    await revokeSession(id, user.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking session:', error);
    return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 });
  }
}