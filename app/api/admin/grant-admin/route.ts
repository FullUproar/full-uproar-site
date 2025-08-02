import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Grant admin role to the current user
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' }
    });

    return NextResponse.json({ 
      message: 'Admin access granted',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error granting admin access:', error);
    return NextResponse.json({ error: 'Failed to grant admin access' }, { status: 500 });
  }
}