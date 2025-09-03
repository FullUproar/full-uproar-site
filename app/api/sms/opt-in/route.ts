import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { 
  sendVerificationSMS, 
  generateVerificationCode, 
  formatPhoneForTwilio,
  validatePhoneNumber 
} from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, consent, context, userId, email } = await request.json();
    
    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Format phone for Twilio
    const formattedPhone = formatPhoneForTwilio(phoneNumber);
    
    // Get IP address for consent tracking
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Get current user if authenticated
    const { userId: clerkUserId } = await auth();
    let user = null;

    if (userId) {
      // If userId provided, find the user
      user = await prisma.user.findUnique({
        where: { id: userId }
      });
    } else if (clerkUserId) {
      // If authenticated, find by Clerk ID
      user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId }
      });
    } else if (email) {
      // Try to find by email if provided
      user = await prisma.user.findUnique({
        where: { email }
      });
    }

    // Check if phone number is already in use by another user
    const existingUserWithPhone = await prisma.user.findUnique({
      where: { phoneNumber: formattedPhone }
    });

    if (existingUserWithPhone && existingUserWithPhone.id !== user?.id) {
      return NextResponse.json(
        { error: 'This phone number is already registered to another account' },
        { status: 400 }
      );
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Update or create user record with consent
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneNumber: formattedPhone,
          smsConsent: consent,
          smsConsentDate: consent ? new Date() : null,
          smsConsentIP: ipAddress as string,
          smsConsentMethod: context,
          smsVerificationCode: verificationCode,
          marketingConsent: consent
        }
      });
    }

    // Create consent log for audit trail
    await prisma.sMSConsentLog.create({
      data: {
        userId: user?.id || 'guest',
        phoneNumber: formattedPhone,
        action: 'opt_in',
        consentGiven: consent,
        ipAddress: ipAddress as string,
        userAgent: userAgent as string,
        method: context,
        message: 'I agree to receive recurring automated marketing text messages at the phone number provided. Consent is not a condition to purchase. Msg & data rates may apply.'
      }
    });

    // Send verification SMS
    try {
      await sendVerificationSMS(formattedPhone, verificationCode);
      
      // Log the SMS message
      await prisma.sMSMessage.create({
        data: {
          userId: user?.id,
          phoneNumber: formattedPhone,
          message: `Verification code: ${verificationCode}`,
          direction: 'outbound',
          status: 'sent'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Verification code sent successfully',
        phoneNumber: formattedPhone
      });
    } catch (smsError: any) {
      console.error('Failed to send verification SMS:', smsError);
      
      // Still return success but note that SMS failed
      return NextResponse.json({
        success: true,
        message: 'Consent recorded. SMS service temporarily unavailable.',
        phoneNumber: formattedPhone,
        smsError: true
      });
    }

  } catch (error) {
    console.error('SMS opt-in error:', error);
    return NextResponse.json(
      { error: 'Failed to process opt-in request' },
      { status: 500 }
    );
  }
}