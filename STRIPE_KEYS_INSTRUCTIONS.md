# 🔑 How to Add Your Stripe Keys

## Important: Stripe keys CANNOT be saved through the admin UI
Stripe keys are environment variables that must be set in your `.env.local` file or Vercel dashboard.

## Step 1: Add Keys Locally (for development)

1. Open `.env.local` file in your project root
2. Replace the placeholder values with your actual Stripe keys:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_KEY_HERE
```

For testing, you can use test keys:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY_HERE
```

3. **RESTART your development server** (Ctrl+C then `npm run dev`)
4. Go back to `/admin` → Integrations to verify

## Step 2: Add Keys to Vercel (for production)

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (for all environments)
   - `STRIPE_SECRET_KEY` (for all environments)
   - `STRIPE_WEBHOOK_SECRET` (optional, for webhooks)
5. Redeploy your site

## Where to Find Your Stripe Keys

1. Log in to https://dashboard.stripe.com
2. Go to Developers → API keys
3. You'll see:
   - **Test mode keys** (for development)
   - **Live mode keys** (for production - requires account activation)

## Security Notes

- ✅ `.env.local` is gitignored - your keys won't be committed
- ✅ Never share your secret key (sk_) with anyone
- ✅ The publishable key (pk_) is safe to use in client-side code
- ⚠️ Always use test keys during development
- ⚠️ Only use live keys when ready to accept real payments

## Testing Your Integration

After adding keys and restarting:
1. Go to `/admin` → Integrations
2. You should see "✓ Stripe is configured"
3. Click "Test Stripe Connection" to verify
4. Visit `/test-stripe` to test payments

---

Need help? Check the Stripe dashboard or contact support.