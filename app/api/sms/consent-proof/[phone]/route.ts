import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUBLIC ENDPOINT - No authentication required (for Twilio compliance)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    const { phone } = await params;
    
    // Clean the phone number (remove special characters, ensure it starts with +1)
    let cleanPhone = phone.replace(/[^\d+]/g, '');
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    }
    if (!cleanPhone.startsWith('+1') && cleanPhone.length === 11) {
      cleanPhone = '+1' + cleanPhone.substring(1);
    }

    // Get the user with this phone number
    const user = await prisma.user.findUnique({
      where: { phoneNumber: cleanPhone },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        smsConsent: true,
        smsConsentDate: true,
        smsConsentIP: true,
        smsConsentMethod: true,
        smsOptOutDate: true,
        smsVerified: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json({
        status: 'not_found',
        message: 'No consent record found for this phone number',
        phone: cleanPhone,
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    // Get consent logs for this user
    const consentLogs = await prisma.sMSConsentLog.findMany({
      where: {
        OR: [
          { userId: user.id },
          { phoneNumber: cleanPhone }
        ]
      },
      orderBy: { timestamp: 'desc' },
      take: 10 // Last 10 consent actions
    });

    // Build the consent proof response
    const consentProof = {
      // Required fields for Twilio
      phone_number: user.phoneNumber,
      consent_status: user.smsConsent ? 'opted_in' : 'opted_out',
      consent_date: user.smsConsentDate?.toISOString() || null,
      opt_out_date: user.smsOptOutDate?.toISOString() || null,
      verified: user.smsVerified,
      
      // Additional proof information
      user_id: user.id,
      email_masked: user.email ? 
        user.email.substring(0, 3) + '***@' + user.email.split('@')[1] : null,
      consent_method: user.smsConsentMethod,
      consent_ip: user.smsConsentIP,
      account_created: user.createdAt.toISOString(),
      
      // Consent history
      consent_history: consentLogs.map(log => ({
        action: log.action,
        consent_given: log.consentGiven,
        timestamp: log.timestamp.toISOString(),
        method: log.method,
        ip_address: log.ipAddress
      })),
      
      // Compliance information
      compliance: {
        tcpa_compliant: true,
        consent_language: "User explicitly agreed to receive recurring automated marketing messages",
        opt_out_instructions: "Text STOP to unsubscribe at any time",
        help_instructions: "Text HELP for assistance",
        message_frequency: "Up to 5 messages per month",
        terms_url: "https://fulluproar.com/terms",
        privacy_url: "https://fulluproar.com/privacy"
      },
      
      // Metadata
      generated_at: new Date().toISOString(),
      api_version: "1.0"
    };

    // Return with proper headers for Twilio
    return NextResponse.json(consentProof, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Consent-Status': user.smsConsent ? 'opted-in' : 'opted-out'
      }
    });

  } catch (error) {
    console.error('Error fetching consent proof:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to retrieve consent proof',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}