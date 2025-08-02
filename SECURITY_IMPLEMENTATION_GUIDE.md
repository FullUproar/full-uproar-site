# Security Implementation Guide

## 1. Email Verification (Clerk)

To enable email verification in Clerk:
1. Go to Clerk Dashboard → Email & SMS → Email verification
2. Toggle "Require email verification" ON
3. Customize the verification email template if desired

## 2. Environment Variables Needed

Add these to your `.env.local` and Vercel environment variables:

```env
# Cloudflare Turnstile (CAPTCHA)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here

# Rate limiting (if using Upstash Redis)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

## 3. CAPTCHA Setup (Cloudflare Turnstile)

1. Go to https://dash.cloudflare.com/
2. Navigate to Turnstile
3. Create a new site
4. Add your domains (localhost:3000 for dev, your-domain.com for prod)
5. Copy the Site Key and Secret Key

## 4. Using the Security Features

### Check if user can perform action:
```typescript
const response = await fetch('/api/user/can-perform-action', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'post' })
});

const { allowed, reason } = await response.json();
if (!allowed) {
  alert(reason);
  return;
}
```

### Add CAPTCHA to sign-up:
```tsx
import Turnstile from '@/app/components/Turnstile';

function SignUpForm() {
  const [captchaToken, setCaptchaToken] = useState('');
  
  return (
    <form>
      {/* Your form fields */}
      
      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onVerify={setCaptchaToken}
        theme="dark"
      />
      
      <button disabled={!captchaToken}>Sign Up</button>
    </form>
  );
}
```

## 5. Security Headers

Security headers are automatically added by the middleware for:
- XSS Protection
- Clickjacking Protection
- MIME Type Sniffing Protection
- Content Security Policy
- HSTS (in production)

## 6. Rate Limiting

Already implemented for:
- Auth endpoints: 5 requests/minute
- API endpoints: 100 requests/minute
- Upload endpoints: 5 requests/5 minutes

## 7. User Trust Levels

- Level 0 (New): Default, restricted actions
- Level 1 (Basic): Email verified, 1+ days old
- Level 2 (Member): 7+ days, 10+ posts
- Level 3 (Regular): 30+ days, 25+ posts
- Level 4 (Leader): 60+ days, 50+ posts

## 8. Moderation Features

### Ban a user:
```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    isBanned: true,
    bannedAt: new Date(),
    bannedReason: 'Spam'
  }
});
```

### Mute a user:
```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    isMuted: true,
    mutedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  }
});
```

## 9. Next Steps

1. Run migration: `/api/migrate-user-security`
2. Configure Clerk email verification
3. Set up Cloudflare Turnstile
4. Add CAPTCHA to sign-up flow
5. Implement moderation UI in admin panel
6. Add user reporting system
7. Set up monitoring alerts