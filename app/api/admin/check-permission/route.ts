import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, checkPermission } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ hasPermission: false }, { status: 401 });
    }

    const { resource, action } = await request.json();
    
    const hasPermission = await checkPermission(resource, action);
    
    return NextResponse.json({ hasPermission });
  } catch (error) {
    console.error('Error checking permission:', error);
    return NextResponse.json({ hasPermission: false }, { status: 500 });
  }
}