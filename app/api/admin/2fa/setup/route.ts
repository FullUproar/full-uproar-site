import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { generateTOTPSecret, generateQRCode, encryptSecret } from '@/lib/auth/totp';

// POST - Start 2FA setup (generate new secret)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can set up 2FA
    const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'GOD'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Generate new TOTP secret
    const { secret, uri } = generateTOTPSecret(user.email);

    // Generate QR code
    const qrCode = await generateQRCode(uri);

    // Store encrypted secret (but don't enable until verified)
    const encryptedSecret = encryptSecret(secret);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totpSecret: encryptedSecret,
        totpEnabled: false, // Will be enabled after verification
      },
    });

    return NextResponse.json({
      qrCode,
      secret, // Show the secret in case user can't scan QR
      message: 'Scan the QR code with your authenticator app, then verify with a code',
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 });
  }
}

// GET - Check if 2FA is set up
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      totpEnabled: user.totpEnabled,
      totpVerifiedAt: user.totpVerifiedAt,
    });
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return NextResponse.json({ error: 'Failed to check 2FA status' }, { status: 500 });
  }
}
