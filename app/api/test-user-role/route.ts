import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check if info@fulluproar.com exists and has admin role
    const adminUser = await prisma.user.findUnique({
      where: { email: 'info@fulluproar.com' }
    });

    if (!adminUser) {
      return NextResponse.json({
        message: 'User info@fulluproar.com not found in database',
        action: 'Please sign out and sign back in with this email'
      });
    }

    return NextResponse.json({
      user: {
        email: adminUser.email,
        role: adminUser.role,
        createdAt: adminUser.createdAt,
        hasAdminRole: adminUser.role === 'ADMIN' || adminUser.role === 'SUPER_ADMIN'
      },
      message: adminUser.role === 'ADMIN' || adminUser.role === 'SUPER_ADMIN' 
        ? 'User has admin access' 
        : 'User does not have admin access, updating...'
    });
  } catch (error) {
    console.error('Test user role error:', error);
    return NextResponse.json({ 
      error: 'Failed to check user role',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}