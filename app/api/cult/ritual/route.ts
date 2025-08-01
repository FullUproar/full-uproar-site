import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Perform a ritual
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Check if user has enough devotion
    if (user.cultDevotion < 100) {
      return NextResponse.json({ 
        error: 'Insufficient devotion. You need 100% devotion to perform the ritual.' 
      }, { status: 400 });
    }

    // Reset devotion and increment level
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        cultDevotion: 0,
        cultLevel: user.cultLevel + 1,
        cultLastVisit: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Ritual performed successfully!',
      newLevel: updatedUser.cultLevel,
      devotion: updatedUser.cultDevotion
    });
  } catch (error) {
    console.error('Error performing ritual:', error);
    return NextResponse.json({ 
      error: 'Failed to perform ritual' 
    }, { status: 500 });
  }
}