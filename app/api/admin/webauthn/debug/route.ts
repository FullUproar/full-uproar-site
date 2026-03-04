import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ADMIN_ROLES } from '@/lib/constants';

// GET — Debug WebAuthn config (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !ADMIN_ROLES.includes(user.role as typeof ADMIN_ROLES[number])) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const rpId = process.env.WEBAUTHN_RP_ID || 'localhost';
    const origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

    // Build expected origins same way as webauthn.ts
    const origins = [origin];
    if (origin.includes('://www.')) {
      origins.push(origin.replace('://www.', '://'));
    } else if (origin.includes('://') && !origin.includes('://localhost')) {
      origins.push(origin.replace('://', '://www.'));
    }

    const credentials = await prisma.webAuthnCredential.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        credentialId: true,
        nickname: true,
        transports: true,
        deviceType: true,
        createdAt: true,
        counter: true,
      },
    });

    const challenges = await prisma.webAuthnChallenge.findMany({
      where: { userId: user.id },
      select: { id: true, expiresAt: true, createdAt: true },
    });

    return NextResponse.json({
      config: {
        rpId,
        rpIdSource: process.env.WEBAUTHN_RP_ID ? 'env' : 'default (localhost)',
        origin,
        originSource: process.env.WEBAUTHN_ORIGIN ? 'env' : 'default (localhost:3000)',
        expectedOrigins: origins,
      },
      user: {
        id: user.id,
        email: user.email,
      },
      credentials: credentials.map(c => ({
        ...c,
        credentialIdPreview: c.credentialId.slice(0, 20) + '...',
        credentialIdLength: c.credentialId.length,
        counter: Number(c.counter),
      })),
      challenges,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
