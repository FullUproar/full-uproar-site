import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import UAParser from 'ua-parser-js';

interface SessionInfo {
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
  city?: string;
  country?: string;
}

export async function createUserSession(userId: string, sessionToken: string) {
  const headersInstance = await headers();
  const userAgent = headersInstance.get('user-agent') || '';
  const ipAddress = headersInstance.get('x-forwarded-for')?.split(',')[0] || 
                    headersInstance.get('x-real-ip') || 
                    'unknown';

  // Parse user agent
  const parser = new UAParser(userAgent);
  const browserInfo = parser.getBrowser();
  const osInfo = parser.getOS();
  const deviceInfo = parser.getDevice();

  // Session expires in 30 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const session = await prisma.userSession.create({
    data: {
      userId,
      sessionToken,
      ipAddress,
      userAgent,
      browser: browserInfo.name ? `${browserInfo.name} ${browserInfo.version}` : 'Unknown',
      os: osInfo.name ? `${osInfo.name} ${osInfo.version}` : 'Unknown',
      device: deviceInfo.type || 'Desktop',
      expiresAt,
    }
  });

  return session;
}

export async function updateSessionActivity(sessionToken: string) {
  return prisma.userSession.update({
    where: { sessionToken },
    data: { lastActive: new Date() }
  });
}

export async function getUserSessions(userId: string) {
  return prisma.userSession.findMany({
    where: { 
      userId,
      expiresAt: { gt: new Date() }
    },
    orderBy: { lastActive: 'desc' }
  });
}

export async function revokeSession(sessionId: string, userId: string) {
  return prisma.userSession.update({
    where: { 
      id: sessionId,
      userId // Ensure user owns the session
    },
    data: { 
      isActive: false,
      expiresAt: new Date() // Expire immediately
    }
  });
}

export async function revokeAllSessions(userId: string, exceptToken?: string) {
  const whereClause = exceptToken 
    ? { userId, sessionToken: { not: exceptToken } }
    : { userId };

  return prisma.userSession.updateMany({
    where: whereClause,
    data: { 
      isActive: false,
      expiresAt: new Date()
    }
  });
}

export async function cleanupExpiredSessions() {
  return prisma.userSession.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { isActive: false }
      ]
    }
  });
}