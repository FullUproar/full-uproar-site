import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, checkPermission } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('No user found in check-permission');
      return NextResponse.json({ hasPermission: false }, { status: 401 });
    }

    const { resource, action } = await request.json();
    
    console.log('Checking permission:', {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      resource,
      action
    });
    
    const hasPermission = await checkPermission(user.id, resource, action);
    
    console.log('Permission result:', hasPermission);
    
    return NextResponse.json({ hasPermission });
  } catch (error) {
    console.error('Error checking permission:', error);
    return NextResponse.json({ hasPermission: false }, { status: 500 });
  }
}