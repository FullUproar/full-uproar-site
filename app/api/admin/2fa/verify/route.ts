import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { verifyTOTP, decryptSecret } from '@/lib/auth/totp';

// POST - Verify TOTP code to complete setup
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can verify 2FA
    const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'GOD'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if setup has been started
    if (!user.totpSecret) {
      return NextResponse.json({
        error: 'No 2FA setup in progress. Please start setup first.'
      }, { status: 400 });
    }

    const { code } = await request.json();

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
    }

    // Decrypt and verify
    const secret = decryptSecret(user.totpSecret);
    const isValid = verifyTOTP(secret, code);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totpEnabled: true,
        totpVerifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: '2FA has been enabled successfully',
    });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 });
  }
}
