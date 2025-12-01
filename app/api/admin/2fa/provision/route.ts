import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { generateTOTPSecret, generateQRCode, encryptSecret, isElevationValid } from '@/lib/auth/totp';

// POST - Generate 2FA setup for another admin (requires elevated admin)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require elevated admin
    const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'GOD'];
    if (!adminRoles.includes(currentUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check elevation
    if (!isElevationValid(currentUser.adminElevatedUntil)) {
      return NextResponse.json({
        error: 'Admin elevation required to provision 2FA',
        requiresElevation: true
      }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        totpEnabled: true,
        displayName: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check email domain
    if (!targetUser.email.endsWith('@fulluproar.com')) {
      return NextResponse.json({
        error: 'Only @fulluproar.com email addresses can receive 2FA setup'
      }, { status: 403 });
    }

    // Check if user is an admin role
    if (!adminRoles.includes(targetUser.role)) {
      return NextResponse.json({
        error: 'Target user must have an admin role to set up 2FA'
      }, { status: 403 });
    }

    // Check if already has 2FA
    if (targetUser.totpEnabled) {
      return NextResponse.json({
        error: 'User already has 2FA enabled. To reset, contact support.'
      }, { status: 400 });
    }

    // Generate new TOTP secret
    const { secret, uri } = generateTOTPSecret(targetUser.email);

    // Generate QR code
    const qrCode = await generateQRCode(uri);

    // Store encrypted secret (not enabled until user verifies)
    const encryptedSecret = encryptSecret(secret);
    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        totpSecret: encryptedSecret,
        totpEnabled: false,
      },
    });

    // Log this security action
    console.log(`[SECURITY] Admin ${currentUser.email} provisioned 2FA for ${targetUser.email}`);

    return NextResponse.json({
      success: true,
      qrCode,
      secret,
      userEmail: targetUser.email,
      userName: targetUser.displayName || targetUser.email,
      message: 'Share this QR code securely with the user. It will only be shown once.',
    });
  } catch (error) {
    console.error('Error provisioning 2FA:', error);
    return NextResponse.json({ error: 'Failed to provision 2FA' }, { status: 500 });
  }
}
