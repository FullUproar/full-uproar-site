import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

interface SecurityEvent {
  userId?: string;
  eventType: 'login' | 'logout' | 'failed_login' | 'suspicious_activity' | 'password_change' | 'permission_change';
  ipAddress: string;
  userAgent: string;
  details?: Record<string, any>;
}

/**
 * Log security events for audit trail
 */
export async function logSecurityEvent(event: SecurityEvent) {
  try {
    await prisma.securityLog.create({
      data: {
        userId: event.userId,
        eventType: event.eventType,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        metadata: event.details || {},
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('[SECURITY] Failed to log security event:', error);
  }
}

/**
 * Check for suspicious login patterns
 */
export async function checkSuspiciousActivity(userId: string, ipAddress: string): Promise<boolean> {
  try {
    // Check for multiple failed login attempts
    const recentFailedAttempts = await prisma.securityLog.count({
      where: {
        userId,
        eventType: 'failed_login',
        createdAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
        }
      }
    });

    if (recentFailedAttempts >= 5) {
      await logSecurityEvent({
        userId,
        eventType: 'suspicious_activity',
        ipAddress,
        userAgent: '',
        details: { reason: 'Multiple failed login attempts' }
      });
      return true;
    }

    // Check for login from new location
    const previousLogins = await prisma.securityLog.findMany({
      where: {
        userId,
        eventType: 'login',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      select: { ipAddress: true },
      distinct: ['ipAddress']
    });

    const knownIPs = previousLogins.map(log => log.ipAddress);
    if (knownIPs.length > 0 && !knownIPs.includes(ipAddress)) {
      // New IP detected - could be suspicious or just a new location
      console.log(`[SECURITY] New IP detected for user ${userId}: ${ipAddress}`);
    }

    // Check for impossible travel (login from different countries within short time)
    const recentLogin = await prisma.userSession.findFirst({
      where: {
        userId,
        lastActive: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      },
      orderBy: { lastActive: 'desc' }
    });

    if (recentLogin && recentLogin.country && recentLogin.ipAddress !== ipAddress) {
      // Different IP within an hour - could be VPN or suspicious
      console.warn(`[SECURITY] Rapid IP change detected for user ${userId}`);
    }

    return false;
  } catch (error) {
    console.error('[SECURITY] Failed to check suspicious activity:', error);
    return false;
  }
}

/**
 * Get security events for a user
 */
export async function getUserSecurityEvents(userId: string, limit: number = 20) {
  return prisma.securityLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

/**
 * Monitor and alert on critical security events
 */
export async function monitorCriticalEvents() {
  try {
    // Check for brute force attacks
    const bruteForceCheck = await prisma.securityLog.groupBy({
      by: ['ipAddress'],
      where: {
        eventType: 'failed_login',
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      },
      _count: true,
      having: {
        _count: {
          _gt: 10 // More than 10 failed attempts from same IP
        }
      }
    });

    if (bruteForceCheck.length > 0) {
      console.error('[SECURITY ALERT] Potential brute force attack detected:', bruteForceCheck);
      // Here you could trigger alerts, block IPs, etc.
    }

    // Check for privilege escalation attempts
    const privEscalation = await prisma.securityLog.findMany({
      where: {
        eventType: 'permission_change',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    if (privEscalation.length > 0) {
      console.warn('[SECURITY] Permission changes detected:', privEscalation.length);
    }

  } catch (error) {
    console.error('[SECURITY] Failed to monitor critical events:', error);
  }
}

/**
 * Get current request security context
 */
export async function getSecurityContext() {
  const headersInstance = await headers();
  
  return {
    ipAddress: headersInstance.get('x-forwarded-for')?.split(',')[0] || 
               headersInstance.get('x-real-ip') || 
               'unknown',
    userAgent: headersInstance.get('user-agent') || 'unknown',
    referer: headersInstance.get('referer'),
    origin: headersInstance.get('origin')
  };
}

/**
 * Rate limit check for security operations
 */
const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const attempts = rateLimitMap.get(identifier) || [];
  
  // Remove old attempts outside the window
  const validAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
  
  if (validAttempts.length >= maxAttempts) {
    return false; // Rate limit exceeded
  }
  
  validAttempts.push(now);
  rateLimitMap.set(identifier, validAttempts);
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance on each call
    for (const [key, timestamps] of rateLimitMap.entries()) {
      const valid = timestamps.filter(t => now - t < windowMs);
      if (valid.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, valid);
      }
    }
  }
  
  return true;
}