# SMS Messaging Setup with Twilio

This document explains how to configure SMS messaging for Full Uproar using Twilio.

## Overview

The SMS system is fully implemented and ready to use. It includes:
- TCPA-compliant opt-in flow with phone verification
- Audit trail for all consent actions
- Protected consent proof endpoint for Twilio compliance
- Integration in checkout flow

## Setup Steps

### 1. Create Twilio Account

1. Sign up at [twilio.com](https://www.twilio.com)
2. Get your Account SID and Auth Token from the Twilio Console
3. Purchase a phone number or set up a Messaging Service

### 2. Configure Environment Variables

Add these to your `.env` file:

```env
# Twilio Credentials
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_PHONE_NUMBER="+15551234567"  # Your Twilio phone number

# OR use a Messaging Service instead of phone number
TWILIO_MESSAGING_SERVICE_SID="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Security Token for Consent Proof
SMS_CONSENT_PROOF_TOKEN="generate-a-secure-random-token-here"
```

**Important:** Generate a secure random token for `SMS_CONSENT_PROOF_TOKEN`. This should be:
- At least 32 characters long
- Randomly generated (use a password generator)
- Keep it secret - only share with Twilio

### 3. Provide Consent Proof URL to Twilio

When Twilio asks for "Proof of consent (opt-in) collected", provide them with this URL format:

```
https://fulluproar.com/api/sms/consent-proof/{phone-number}?token=YOUR_SMS_CONSENT_PROOF_TOKEN
```

Example:
```
https://fulluproar.com/api/sms/consent-proof/+15551234567?token=your-secure-token-here
```

Replace:
- `{phone-number}` with the actual phone number (including country code)
- `your-secure-token-here` with your actual SMS_CONSENT_PROOF_TOKEN value

### 4. What the Consent Proof Endpoint Returns

The endpoint provides Twilio with:
- Phone number and consent status (opted-in/opted-out)
- Consent date and verification status
- IP address where consent was collected
- Method of consent (checkout, account, campaign)
- Complete audit trail of all consent actions
- TCPA compliance information

**Security Note:** This endpoint requires the secret token to access, protecting user privacy while satisfying Twilio's compliance requirements.

## How the System Works

### User Opt-In Flow

1. User enters phone number in checkout or account settings
2. User explicitly checks consent checkbox with TCPA-compliant language
3. System sends 6-digit verification code via SMS
4. User enters code to verify phone ownership
5. System records consent with full audit trail

### Data Collected for Compliance

- Phone number
- Explicit consent confirmation
- Timestamp of consent
- IP address of consent
- Method/context of consent (checkout, account, etc.)
- Verification status

### Opt-Out

Users can opt out by:
- Texting STOP to any message
- The system will automatically handle STOP keywords and update their consent status

## Testing the System

1. Go to checkout page
2. Fill in customer information
3. Look for the "Get Exclusive SMS Deals" section
4. Enter a phone number and check the consent box
5. Click "Send Verification Code"
6. Enter the 6-digit code received via SMS

## Important Notes

- The consent proof endpoint is protected by token authentication
- Never share your SMS_CONSENT_PROOF_TOKEN publicly
- All SMS consent data is stored in the database with full audit trail
- The system automatically handles STOP/HELP keywords for compliance
- Verification codes expire after 10 minutes for security

## Database Tables

The system uses these tables:
- `User` table: Stores SMS consent fields
- `SMSConsentLog` table: Audit trail of all consent actions
- `SMSMessage` table: Log of all SMS messages sent

## Support

For issues with SMS setup:
1. Check that all environment variables are set correctly
2. Verify your Twilio account is active and has credits
3. Ensure the phone number format includes country code (+1 for US)
4. Check the server logs for any error messages