import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { verifyTOTP, decryptSecret, getElevationExpiry, isElevationValid } from '@/lib/auth/totp';

// POST - Elevate admin session using 2FA code
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can elevate
    const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'GOD'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if 2FA is enabled
    if (!user.totpEnabled || !user.totpSecret) {
      return NextResponse.json({
        error: '2FA is not enabled. Please set up 2FA first.',
        requiresSetup: true,
      }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { code } = body;

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
    }

    // Decrypt and verify
    let secret;
    try {
      secret = decryptSecret(user.totpSecret);
    } catch (e: any) {
      console.error('Decryption error:', e?.message);
      return NextResponse.json({
        error: 'Failed to decrypt 2FA secret. The encryption key may have changed.',
      }, { status: 500 });
    }

    const isValid = verifyTOTP(secret, code);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid authentication code' }, { status: 400 });
    }

    // Elevate session
    const elevatedUntil = getElevationExpiry();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        adminElevatedUntil: elevatedUntil,
      },
    });

    return NextResponse.json({
      success: true,
      elevatedUntil,
      message: 'Admin session elevated for 3 hours',
    });
  } catch (error: any) {
    console.error('Error elevating session:', error?.message || error);
    return NextResponse.json({ error: 'Failed to elevate session' }, { status: 500 });
  }
}

// GET - Check current elevation status
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'GOD'];
    const isAdmin = adminRoles.includes(user.role);
    const isElevated = isElevationValid(user.adminElevatedUntil);

    return NextResponse.json({
      isAdmin,
      totpEnabled: user.totpEnabled,
      isElevated,
      elevatedUntil: user.adminElevatedUntil,
      requiresElevation: isAdmin && user.totpEnabled && !isElevated,
    });
  } catch (error) {
    console.error('Error checking elevation:', error);
    return NextResponse.json({ error: 'Failed to check elevation status' }, { status: 500 });
  }
}

// DELETE - Manually end elevation (logout of admin mode)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        adminElevatedUntil: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin session de-elevated',
    });
  } catch (error) {
    console.error('Error de-elevating session:', error);
    return NextResponse.json({ error: 'Failed to de-elevate session' }, { status: 500 });
  }
}
