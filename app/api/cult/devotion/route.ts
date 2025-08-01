import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get current user's cult devotion
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Calculate offline devotion if applicable
    let offlineDevotion = 0;
    if (user.cultLastVisit) {
      const minutesOffline = Math.floor(
        (new Date().getTime() - new Date(user.cultLastVisit).getTime()) / 60000
      );
      // Cap at 24 hours worth of devotion (1440 minutes)
      offlineDevotion = Math.min(minutesOffline, 1440);
    }

    return NextResponse.json({
      devotion: user.cultDevotion + offlineDevotion,
      level: user.cultLevel,
      offlineDevotion,
      lastVisit: user.cultLastVisit
    });
  } catch (error) {
    console.error('Error fetching cult devotion:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch devotion data' 
    }, { status: 500 });
  }
}

// Update user's cult devotion
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const { devotion, level } = await request.json();

    // Validate input
    if (typeof devotion !== 'number' || typeof level !== 'number') {
      return NextResponse.json({ 
        error: 'Invalid devotion or level value' 
      }, { status: 400 });
    }

    // Update user's cult stats
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        cultDevotion: Math.max(0, devotion),
        cultLevel: Math.max(0, level),
        cultLastVisit: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      devotion: updatedUser.cultDevotion,
      level: updatedUser.cultLevel,
      lastVisit: updatedUser.cultLastVisit
    });
  } catch (error) {
    console.error('Error updating cult devotion:', error);
    return NextResponse.json({ 
      error: 'Failed to update devotion data' 
    }, { status: 500 });
  }
}