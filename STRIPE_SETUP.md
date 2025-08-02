# Stripe Integration Setup & Testing Guide

## 0. Creating a Stripe Account (If You Don't Have One)

1. **Sign up for free** at https://stripe.com
   - No credit card required for testing
   - Test mode is completely free
   - You only pay fees when processing real payments

2. **After signing up:**
   - You'll be taken to the Stripe Dashboard
   - By default, you'll be in "Test mode" (look for the toggle in the top right)
   - Test mode lets you simulate payments without real money

## 1. Setting Up Stripe Keys

You need to add your Stripe API keys to the `.env` file:

```bash
# Add these to your .env file
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_PUBLISHABLE_KEY
```

### Getting Your Stripe Keys:
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

## 2. Test Mode Configuration

The application is configured to run in test mode by default in development. You can verify this in the admin panel:
- Look for the "Test Mode" toggle in the dashboard
- Yellow header indicates test mode is active

## 3. Testing the Checkout Flow

### Step 1: Create a Test Product
1. Go to Admin Panel → Games or Merchandise
2. Click "New Game" or "New Merch"
3. Fill in the required fields with test data
4. Set a price (e.g., $19.99)
5. Save the product

### Step 2: Test the Purchase Flow
1. Navigate to the store front-end
2. Add a product to cart
3. Click on the cart icon → Proceed to checkout
4. In the checkout form, use Stripe test card numbers:

#### Test Cards:
- **Successful payment**: 4242 4242 4242 4242
- **Requires authentication**: 4000 0025 0000 3155
- **Declined**: 4000 0000 0000 9995

For all test cards:
- Use any future expiry date (e.g., 12/34)
- Use any 3-digit CVC
- Use any ZIP code

### Step 3: Verify the Order
1. Complete the checkout
2. Go to Admin Panel → Orders
3. You should see the new test order
4. Check the order details and status

## 4. Testing Webhooks (Optional)

For full integration testing, you can set up Stripe webhooks:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe CLI: `stripe login`
3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3010/api/webhooks/stripe
   ```
4. Copy the webhook signing secret and add to `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
   ```

## 5. Common Test Scenarios

### Test Successful Payment:
1. Use card 4242 4242 4242 4242
2. Complete checkout
3. Verify order shows as "paid" in admin

### Test Failed Payment:
1. Use card 4000 0000 0000 9995
2. Attempt checkout
3. Verify error message appears
4. Verify no order is created

### Test 3D Secure:
1. Use card 4000 0025 0000 3155
2. Complete authentication
3. Verify order completes successfully

## 6. Monitoring & Debugging

### Check Stripe Dashboard:
- Go to https://dashboard.stripe.com/test/payments
- View all test transactions
- Check for any errors or issues

### Check Application Logs:
- Browser console for client-side errors
- Terminal/server logs for API errors
- Network tab for failed requests

## 7. Switching to Production

When ready for production:
1. Get live mode API keys from Stripe
2. Update `.env` with production keys
3. Remove test mode indicators
4. Test with small real transaction first

## Important Notes:
- Always use test mode keys (sk_test_*, pk_test_*) during development
- Test mode transactions don't charge real cards
- Test data is separate from live data in Stripe
- You can clear test data anytime from Stripe dashboard