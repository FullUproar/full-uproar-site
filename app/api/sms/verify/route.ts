import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatPhoneForTwilio, sendPromotionalSMS } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, code, userId } = await request.json();
    
    // Format phone for consistency
    const formattedPhone = formatPhoneForTwilio(phoneNumber);
    
    // Find user with this phone number
    const user = await prisma.user.findFirst({
      where: {
        phoneNumber: formattedPhone,
        smsVerificationCode: code
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Check if code is expired (10 minutes)
    const codeAge = new Date().getTime() - (user.smsConsentDate?.getTime() || 0);
    if (codeAge > 10 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Verification code has expired' },
        { status: 400 }
      );
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        smsVerified: true,
        smsVerificationCode: null, // Clear the code after verification
        smsConsent: true
      }
    });

    // Log the verification
    await prisma.sMSConsentLog.create({
      data: {
        userId: user.id,
        phoneNumber: formattedPhone,
        action: 'verify',
        consentGiven: true,
        method: 'sms_verification'
      }
    });

    // Send welcome SMS
    try {
      const welcomeMessage = `🎮 Welcome to Full Uproar SMS updates! You'll receive exclusive deals, new game alerts, and order updates. Save up to 20% with SMS-only offers!`;
      await sendPromotionalSMS(formattedPhone, welcomeMessage);
      
      // Log welcome message
      await prisma.sMSMessage.create({
        data: {
          userId: user.id,
          phoneNumber: formattedPhone,
          message: welcomeMessage,
          direction: 'outbound',
          status: 'sent'
        }
      });
    } catch (smsError) {
      console.error('Failed to send welcome SMS:', smsError);
      // Don't fail the verification if welcome SMS fails
    }

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully',
      userId: user.id
    });

  } catch (error) {
    console.error('SMS verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify phone number' },
      { status: 500 }
    );
  }
}