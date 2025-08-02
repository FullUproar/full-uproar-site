# Clerk Email Verification Setup Guide

## Why Email Verification?

Email verification is crucial for:
- Preventing spam accounts
- Ensuring users provide valid contact information
- Building trust with your user base
- Complying with best practices for user authentication

## Setup Steps

### 1. Access Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your Full Uproar application

### 2. Enable Email Verification

1. Navigate to **User & Authentication** → **Email, Phone, Username**
2. In the **Email address** section, find **Verification**
3. Toggle **"Require verification"** to ON
4. Choose verification method:
   - **Email verification link** (recommended)
   - **Email verification code** (what we're using in our custom sign-up)

### 3. Configure Email Templates (Optional)

1. Go to **Customization** → **Email templates**
2. Select **Email verification code**
3. Customize the template with your branding:

```
Subject: Verify your Full Uproar account

Hi {{user.firstName || "Chaos Seeker"}},

Your verification code is: {{code}}

This code will expire in 15 minutes.

Welcome to the chaos!
- The Full Uproar Team
```

### 4. Configure Verification Settings

1. Go to **User & Authentication** → **Restrictions**
2. Set **Verification code expiry**: 15 minutes (default)
3. Set **Maximum verification attempts**: 5 (recommended)

### 5. Test the Flow

1. Sign out of your admin account
2. Go to `/sign-up` on your site
3. Create a test account
4. Verify you receive the email
5. Complete verification

## What Happens After Setup

### For New Users:
- Must verify email before accessing protected features
- Can browse the site but can't post/comment until verified
- Receive verification email immediately after sign-up

### For Existing Users:
- Unverified users will be prompted to verify
- Can still sign in but with limited access
- Will see notification to verify email

### In Our Code:
- `emailVerified` field tracks verification status
- `UserSecurityService` checks verification before allowing actions
- Custom sign-up page handles verification flow

## Integration with Our Security System

Our implementation already checks email verification:

```typescript
// In UserSecurityService
if (!user.emailVerified && ['post', 'create_thread', 'message'].includes(action)) {
  return { 
    allowed: false, 
    reason: 'Please verify your email address first',
    requiresVerification: true 
  };
}
```

## Monitoring

After enabling, monitor:
- Sign-up completion rates
- Verification success rates
- Support tickets about verification issues

## Troubleshooting

### Users not receiving emails:
1. Check Clerk email logs in dashboard
2. Advise users to check spam folder
3. Verify email provider isn't blocking Clerk

### Verification code expired:
- Users can request new code from sign-in page
- Consider extending expiry time if many complaints

### Custom domain emails:
- Configure custom domain in Clerk for better deliverability
- Add SPF/DKIM records as instructed by Clerk

## Next Steps

1. Enable email verification in Clerk Dashboard
2. Test the complete flow
3. Monitor user feedback
4. Consider adding "Resend verification" button if needed