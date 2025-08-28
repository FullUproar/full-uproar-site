# 🚀 Stripe & Printify Setup Guide for Full Uproar Fugly Merch

## Overview
This guide will help you set up Stripe for payment processing and Printify for POD (Print-on-Demand) merch fulfillment. With this setup, you can sell custom merch without holding inventory - Printify handles all production and shipping directly to customers.

## Part 1: Stripe Setup (Payment Processing)

### 1.1 Create Stripe Account
1. Go to https://stripe.com and click "Start now"
2. Enter your business details:
   - Email: Your business email
   - Full name: Your legal name
   - Country: United States
   - Business type: Company/Individual

### 1.2 Complete Business Profile
1. Navigate to Settings → Business settings
2. Fill in:
   - Business name: Full Uproar Games
   - Business website: https://fulluproar.com
   - Business description: "Gaming company selling board games and merchandise"
   - Product description: "Board games, apparel, and gaming accessories"
   - Support email: support@fulluproar.com
   - Support phone: Your business phone

### 1.3 Set Up Banking
1. Go to Settings → Bank accounts and scheduling
2. Add your business bank account:
   - Routing number
   - Account number
   - Account holder name
3. Set payout schedule (daily/weekly/monthly)

### 1.4 Get Your API Keys
1. Go to Developers → API keys
2. You'll see two sets of keys:
   - **Test mode** (for development)
   - **Live mode** (for production)
3. Copy your **Live mode** keys:
   ```
   Publishable key: pk_live_...
   Secret key: sk_live_...
   ```

### 1.5 Set Up Webhooks (Optional but Recommended)
1. Go to Developers → Webhooks
2. Add endpoint:
   - Endpoint URL: `https://fulluproar.com/api/stripe/webhook`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `checkout.session.completed`
3. Copy your webhook signing secret: `whsec_...`

### 1.6 Configure Tax Settings (Important!)
1. Go to Products → Tax
2. Enable "Automatically calculate tax"
3. Add your tax registrations if applicable

## Part 2: Printify Setup (POD Fulfillment)

### 2.1 Create Printify Account
1. Go to https://printify.com and click "Start selling"
2. Sign up with your business email
3. Select "I want to sell products" → "Online marketplace/Own website"

### 2.2 Set Up Your Shop
1. After signup, create a new shop:
   - Shop name: Full Uproar Games
   - Shop type: Manual Order Platform
2. Note your Shop ID (visible in the URL or shop settings)

### 2.3 Configure Billing
1. Go to Billing → Payment methods
2. Add your credit card for production costs
3. Consider Printify Premium ($29/month) for 20% discount on all products

### 2.4 Get API Credentials
1. Go to Settings → API
2. Click "Generate Token"
3. Copy your API token (keep this secret!)

### 2.5 Create Your Products
1. Browse Catalog → Choose products (T-shirts, Hoodies, Mugs, etc.)
2. For each product:
   - Upload your "Fugly" designs
   - Set your retail prices (Printify shows base cost)
   - Enable product variants (sizes/colors)
   - Publish to your shop

### 2.6 Recommended Products for Gaming Merch
- **Apparel**: Unisex T-shirts, Hoodies, Tank Tops
- **Accessories**: Mugs, Phone Cases, Tote Bags
- **Home**: Posters, Canvas Prints, Throw Pillows
- **Stickers**: Die-cut stickers (great for game boxes!)

## Part 3: Add Credentials to Your Site

### 3.1 Environment Variables
Add these to your `.env.local` file:

```bash
# Stripe Production Keys
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Printify API
PRINTIFY_API_TOKEN=YOUR_PRINTIFY_API_TOKEN_HERE
PRINTIFY_SHOP_ID=YOUR_SHOP_ID_HERE
```

### 3.2 Add to Vercel
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable for Production environment

## Part 4: Configure in Admin Panel

### 4.1 Set Printify Credentials (Alternative Method)
1. Go to https://fulluproar.com/admin
2. Navigate to Settings → Integrations
3. Enter:
   - Printify API Key
   - Printify Shop ID
4. Click "Save Settings"

### 4.2 Import Products from Printify
1. In admin, go to Merchandise → Import from Printify
2. Click "Import All Products"
3. Products will be imported with:
   - Titles and descriptions
   - All product images
   - Size variants
   - Base pricing (you can adjust markup)

### 4.3 Test the Integration
1. Create a test order for a Printify product
2. Check that order appears in Printify dashboard
3. Printify will handle:
   - Production (2-3 days)
   - Shipping (3-7 days)
   - Tracking info

## Part 5: Order Flow

### How POD Orders Work
1. **Customer orders** on fulluproar.com
2. **Payment processed** via Stripe
3. **Order sent to Printify** automatically
4. **Printify produces** the item (2-3 days)
5. **Printify ships** directly to customer
6. **Tracking provided** to customer
7. **You keep the profit** (retail price - Printify base cost - Stripe fees)

### Profit Calculation Example
- T-shirt retail price: $29.99
- Printify base cost: -$8.95
- Stripe fee (2.9% + $0.30): -$1.17
- **Your profit: $19.87**

## Part 6: Best Practices

### Pricing Strategy
- Mark up Printify base cost by 2.5-3x
- Account for Stripe fees (2.9% + $0.30)
- Consider Printify Premium for 20% discount
- Bundle products for better margins

### Design Tips
- Use high-res images (300 DPI)
- Design with bleed areas in mind
- Test print samples before launching
- Create collections (Summer, Gaming Nights, etc.)

### Customer Service
- Set realistic shipping expectations (7-14 days)
- Provide tracking immediately when available
- Handle returns through Printify's system
- Keep 10% margin for returns/issues

## Part 7: Testing Checklist

Before going live, test:
- [ ] Stripe live mode payment (small amount)
- [ ] Product import from Printify
- [ ] Order creation flow
- [ ] Order fulfillment to Printify
- [ ] Webhook notifications working
- [ ] Customer email notifications
- [ ] Tracking info updates

## Part 8: Monitoring & Analytics

### Key Metrics to Track
- Conversion rate (target: 2-3%)
- Average order value
- Product performance
- Return rate (should be <5%)
- Customer satisfaction

### Where to Monitor
- **Stripe Dashboard**: Payments, disputes, revenue
- **Printify Dashboard**: Orders, fulfillment status
- **Your Admin Panel**: Inventory, customer data

## Troubleshooting

### Common Issues

**Stripe payments failing:**
- Check API keys are correct
- Verify domain is added to Stripe
- Ensure HTTPS is enabled

**Printify not receiving orders:**
- Verify API token is valid
- Check shop ID is correct
- Ensure products have valid Printify IDs

**Missing tracking info:**
- Wait 24-48 hours after fulfillment
- Check Printify webhook is configured
- Manually sync if needed

## Support Contacts

- **Stripe Support**: support.stripe.com
- **Printify Support**: printify.com/support
- **Your Developer**: Update via GitHub issues

## Next Steps

1. Complete Stripe identity verification
2. Order product samples from Printify
3. Create marketing materials
4. Launch with a limited collection
5. Scale based on what sells

---

**Last Updated**: January 2025
**Status**: Ready for production setup