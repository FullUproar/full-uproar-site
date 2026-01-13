import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { currentUser } from '@clerk/nextjs/server';
import { ReportResolutionType } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    // Check moderation permission
    await requirePermission('admin', 'write');

    const moderator = await currentUser();
    if (!moderator) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      actionType,
      targetUserId,
      reason,
      duration, // in hours
      contentType,
      contentId,
      reportId,
      internalNotes,
      publicReason
    } = body;

    // Validate required fields
    if (!actionType || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: actionType, reason' },
        { status: 400 }
      );
    }

    let expiresAt: Date | null = null;
    if (duration) {
      expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);
    }

    // Perform the action based on type
    let userUpdate: any = {};

    switch (actionType) {
      case 'WARN':
        // No user status change, just log it
        break;

      case 'MUTE':
        if (!targetUserId) {
          return NextResponse.json({ error: 'targetUserId required for MUTE' }, { status: 400 });
        }
        userUpdate = {
          isMuted: true,
          mutedUntil: expiresAt
        };
        break;

      case 'SUSPEND':
      case 'BAN':
        if (!targetUserId) {
          return NextResponse.json({ error: 'targetUserId required for BAN' }, { status: 400 });
        }
        userUpdate = {
          isBanned: true,
          bannedAt: new Date(),
          bannedReason: publicReason || reason
        };
        break;

      case 'UNBAN':
        if (!targetUserId) {
          return NextResponse.json({ error: 'targetUserId required for UNBAN' }, { status: 400 });
        }
        userUpdate = {
          isBanned: false,
          bannedAt: null,
          bannedReason: null
        };
        break;

      case 'UNMUTE':
        if (!targetUserId) {
          return NextResponse.json({ error: 'targetUserId required for UNMUTE' }, { status: 400 });
        }
        userUpdate = {
          isMuted: false,
          mutedUntil: null
        };
        break;

      case 'HIDE_CONTENT':
      case 'REMOVE_CONTENT':
        // Content hiding/removal would need to be handled by content-specific logic
        // For now, we just log the action
        break;

      case 'LOCK_THREAD':
        // Thread locking would be handled in forum logic
        if (contentType === 'THREAD' && contentId) {
          await prisma.messageThread.update({
            where: { id: parseInt(contentId) },
            data: { isLocked: true }
          });
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }

    // Update user if needed
    if (targetUserId && Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: userUpdate
      });
    }

    // Log the moderation action
    const moderationAction = await prisma.moderationAction.create({
      data: {
        moderatorId: moderator.id,
        actionType,
        targetUserId: targetUserId || null,
        contentType: contentType || null,
        contentId: contentId || null,
        relatedReportId: reportId || null,
        reason,
        duration,
        expiresAt,
        internalNotes: internalNotes || null,
        publicReason: publicReason || null,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
        userAgent: req.headers.get('user-agent') || null
      }
    });

    // If this action resolved a report, update it
    if (reportId) {
      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: 'RESOLVED',
          reviewedBy: moderator.id,
          reviewedAt: new Date(),
          resolution: reason,
          resolutionType: getResolutionType(actionType)
        }
      });
    }

    return NextResponse.json({
      success: true,
      actionId: moderationAction.id,
      message: `${actionType} action completed successfully`
    });

  } catch (error) {
    console.error('Error performing moderation action:', error);
    return NextResponse.json(
      { error: 'Failed to perform moderation action' },
      { status: 500 }
    );
  }
}

function getResolutionType(actionType: string): ReportResolutionType {
  const mapping: Record<string, ReportResolutionType> = {
    'WARN': ReportResolutionType.USER_WARNED,
    'MUTE': ReportResolutionType.USER_MUTED,
    'SUSPEND': ReportResolutionType.USER_SUSPENDED,
    'BAN': ReportResolutionType.USER_BANNED,
    'HIDE_CONTENT': ReportResolutionType.CONTENT_HIDDEN,
    'REMOVE_CONTENT': ReportResolutionType.CONTENT_REMOVED,
    'LOCK_THREAD': ReportResolutionType.CONTENT_HIDDEN
  };
  return mapping[actionType] || ReportResolutionType.NO_ACTION;
}
