import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';

export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  requiresVerification?: boolean;
  remainingTime?: number; // seconds until restriction lifted
}

export class UserSecurityService {
  /**
   * Check if a user can perform an action based on their security status
   */
  static async canPerformAction(
    userId: string, 
    action: 'post' | 'comment' | 'vote' | 'message' | 'create_thread'
  ): Promise<SecurityCheckResult> {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    // Check if banned
    if (user.isBanned) {
      return { 
        allowed: false, 
        reason: user.bannedReason || 'Your account has been banned' 
      };
    }

    // Check if muted
    if (user.isMuted && user.mutedUntil) {
      const now = new Date();
      if (user.mutedUntil > now) {
        const remainingTime = Math.floor((user.mutedUntil.getTime() - now.getTime()) / 1000);
        return { 
          allowed: false, 
          reason: 'You are temporarily muted',
          remainingTime 
        };
      } else {
        // Mute expired, unmute the user
        await prisma.user.update({
          where: { clerkId: userId },
          data: { isMuted: false, mutedUntil: null }
        });
      }
    }

    // Check email verification for certain actions
    if (!user.emailVerified && ['post', 'create_thread', 'message'].includes(action)) {
      return { 
        allowed: false, 
        reason: 'Please verify your email address first',
        requiresVerification: true 
      };
    }

    // New user restrictions (account less than 24 hours old)
    const accountAge = Date.now() - user.createdAt.getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    if (accountAge < oneDayInMs && user.trustLevel === 0) {
      if (action === 'create_thread') {
        const remainingTime = Math.floor((oneDayInMs - accountAge) / 1000);
        return { 
          allowed: false, 
          reason: 'New users must wait 24 hours before creating threads',
          remainingTime 
        };
      }
      
      // Limit posts/comments for new users
      if (['post', 'comment'].includes(action)) {
        const recentPosts = await prisma.messagePost.count({
          where: {
            authorId: userId,
            createdAt: {
              gte: new Date(Date.now() - 60 * 60 * 1000) // last hour
            }
          }
        });
        
        if (recentPosts >= 5) {
          return { 
            allowed: false, 
            reason: 'New users are limited to 5 posts per hour' 
          };
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Update user trust level based on activity
   */
  static async updateTrustLevel(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        posts: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // last 30 days
            }
          }
        }
      }
    });

    if (!user) return;

    const accountAge = Date.now() - user.createdAt.getTime();
    const daysOld = accountAge / (24 * 60 * 60 * 1000);
    const postCount = user.posts.length;
    
    let newTrustLevel = user.trustLevel;

    // Trust level progression
    if (daysOld >= 60 && postCount >= 50 && user.flagCount < 5) {
      newTrustLevel = 4; // Leader
    } else if (daysOld >= 30 && postCount >= 25 && user.flagCount < 3) {
      newTrustLevel = 3; // Regular
    } else if (daysOld >= 7 && postCount >= 10 && user.flagCount < 2) {
      newTrustLevel = 2; // Member
    } else if (daysOld >= 1 && user.emailVerified) {
      newTrustLevel = 1; // Basic
    }

    if (newTrustLevel !== user.trustLevel) {
      await prisma.user.update({
        where: { clerkId: userId },
        data: { trustLevel: newTrustLevel }
      });
    }
  }

  /**
   * Flag a user for moderation
   */
  static async flagUser(userId: string, reason: string, reportedBy: string): Promise<void> {
    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        flagCount: { increment: 1 },
        lastFlaggedAt: new Date()
      }
    });

    // Log the flag for moderation review
    await prisma.userActivity.create({
      data: {
        userId: reportedBy,
        action: 'flag_user',
        targetType: 'user',
        targetId: 0, // We'd need to convert userId to number or adjust schema
        metadata: JSON.stringify({ flaggedUserId: userId, reason })
      }
    });

    // Auto-mute if too many flags
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (user && user.flagCount >= 5 && !user.isMuted) {
      await prisma.user.update({
        where: { clerkId: userId },
        data: {
          isMuted: true,
          mutedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hour mute
        }
      });
    }
  }

  /**
   * Check if IP address has too many accounts
   */
  static async checkIPLimit(ipAddress: string): Promise<boolean> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentSignups = await prisma.userSession.count({
      where: {
        ipAddress,
        createdAt: { gte: oneDayAgo }
      }
    });

    return recentSignups < 3; // Max 3 accounts per IP per day
  }
}