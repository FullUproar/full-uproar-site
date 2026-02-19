import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth as getSession } from '@/lib/auth-config';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { contentType, contentId, targetUserId, reason, description, url } = body;

    // Validate required fields
    if (!contentType || !contentId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: contentType, contentId, reason' },
        { status: 400 }
      );
    }

    // Check if user already reported this content
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: userId,
        contentType,
        contentId,
        status: { in: ['PENDING', 'UNDER_REVIEW'] }
      }
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this content' },
        { status: 400 }
      );
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        reporterId: userId,
        contentType,
        contentId,
        targetUserId: targetUserId || null,
        reason,
        description: description || null,
        url: url || null,
        status: 'PENDING',
        priority: reason === 'HARASSMENT' || reason === 'HATE_SPEECH' ? 'HIGH' : 'NORMAL'
      }
    });

    // Update target user's flag count if applicable
    if (targetUserId) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          flagCount: { increment: 1 },
          lastFlaggedAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: 'Report submitted successfully. Our moderation team will review it shortly.'
    });

  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}
