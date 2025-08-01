import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check if the current user is already an admin
    const currentUser = await getCurrentUser();
    
    // Find the info@fulluproar.com user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'info@fulluproar.com' }
    });

    if (!adminUser) {
      return NextResponse.json({ 
        error: 'User with email info@fulluproar.com not found. Please sign in with this email first.' 
      }, { status: 404 });
    }

    // Update to admin role if not already
    if (adminUser.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { role: 'ADMIN' }
      });

      return NextResponse.json({ 
        message: 'Successfully granted admin access to info@fulluproar.com',
        user: {
          email: adminUser.email,
          role: 'ADMIN'
        }
      });
    }

    return NextResponse.json({ 
      message: 'User info@fulluproar.com already has admin access',
      user: {
        email: adminUser.email,
        role: adminUser.role
      }
    });

  } catch (error) {
    console.error('Error fixing admin access:', error);
    return NextResponse.json({ 
      error: 'Failed to fix admin access' 
    }, { status: 500 });
  }
}