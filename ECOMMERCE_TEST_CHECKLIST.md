# E-Commerce Test Checklist

## Quick Start Testing Guide

### 1. Set Up Test Data
```bash
# Install dependencies if needed
npm install

# Run database migrations
npx prisma migrate dev

# Seed test data
npm run test:seed
```

This creates:
- 10 test games (various stock levels)
- 8 test merchandise items
- 50 test orders in different states
- 15 support tickets
- Test admin: admin@fullproar.test (password: testadmin123)

### 2. Enable Test Mode
1. Go to `/admin`
2. Look for the "Test Mode" panel on dashboard
3. Click "Enable Test Mode"

### 3. Manual Testing Checklist

#### Shopping Cart Tests
- [ ] Browse `/games` - products display correctly
- [ ] Browse `/merch` - products display correctly
- [ ] Add single item to cart
- [ ] Add multiple items
- [ ] Update quantities in cart
- [ ] Remove items from cart
- [ ] Cart total calculates correctly
- [ ] Cart persists on page refresh

#### Checkout Process
- [ ] Click checkout from cart
- [ ] Fill customer information
- [ ] Enter shipping address
- [ ] Shipping cost calculates (free over $50)
- [ ] Tax calculates (8%)
- [ ] Enter test card: 4242 4242 4242 4242
- [ ] Complete order successfully
- [ ] Order confirmation page shows
- [ ] Order ID is displayed

#### Payment Testing
Test these card numbers:
- [ ] ✅ Success: 4242 4242 4242 4242
- [ ] ❌ Declined: 4000 0000 0000 0002
- [ ] 💸 Insufficient funds: 4000 0000 0000 9995
- [ ] ⏱️ Expired: 4000 0000 0000 0069
- [ ] 🔒 3D Secure: 4000 0025 0000 3155

#### Admin Order Management
- [ ] View orders at `/admin/orders`
- [ ] Search orders by ID/email
- [ ] Filter by status
- [ ] View order details
- [ ] Update order status
- [ ] Add internal notes
- [ ] Generate shipping label (simulated)

#### Fulfillment Workflow
- [ ] Go to `/admin/fulfillment`
- [ ] See paid orders in queue
- [ ] Click "Start Picking"
- [ ] Move to "Packing"
- [ ] Mark as "Ready to Ship"
- [ ] Create shipping label

#### Returns Process
- [ ] Find delivered order in `/admin/orders`
- [ ] Click "Create Return"
- [ ] Fill return reason
- [ ] Get RMA number
- [ ] Go to `/admin/returns`
- [ ] Approve return
- [ ] Mark as received
- [ ] Process refund

#### Support Tickets
- [ ] View tickets at `/admin/support`
- [ ] Filter by status/priority
- [ ] Open ticket conversation
- [ ] Send reply
- [ ] Update ticket status
- [ ] Link to order

### 4. Automated Testing
```bash
# Run E2E tests
npm run test

# Run specific test suite
npx playwright test ecommerce-flow.spec.ts

# Run in UI mode for debugging
npm run test:ui
```

### 5. Performance Testing
- [ ] Load catalog with 50+ products
- [ ] Add 10+ items to cart
- [ ] Complete checkout < 30 seconds
- [ ] Admin dashboard loads < 3 seconds
- [ ] Search returns results < 1 second

### 6. Edge Cases to Test
- [ ] Out of stock during checkout
- [ ] Multiple users buying last item
- [ ] Payment timeout/network issues
- [ ] Invalid shipping address
- [ ] Refresh during checkout
- [ ] Back button during checkout
- [ ] Multiple tabs with cart

### 7. Clean Up Test Data
```bash
# Remove all test data
npm run test:clean

# Reset (clean + reseed)
npm run test:reset
```

## Common Issues & Solutions

### Cart not updating
- Check browser console for errors
- Verify Zustand store is working
- Clear localStorage and retry

### Payment not processing
- Ensure test mode is enabled
- Check Stripe keys in .env
- Verify webhook is configured

### Orders not appearing
- Check payment webhook logs
- Verify database connection
- Check order status filters

### Shipping labels failing
- Test mode should use mock labels
- Check shipping service logs
- Verify address format

## Test Account Credentials

### Stripe Test Dashboard
- URL: https://dashboard.stripe.com/test
- Use your Stripe account

### Test Customer Accounts
- test1@example.com
- test2@example.com
- test3@example.com

### Test Admin
- Email: admin@fullproar.test
- Password: testadmin123

## Production Testing Checklist

Before going live:
- [ ] Disable test mode
- [ ] Remove test data
- [ ] Verify real Stripe keys
- [ ] Test with real credit card (small amount)
- [ ] Verify email notifications work
- [ ] Check shipping integrations
- [ ] Monitor first 10 real orders closely

## Support

If you encounter issues:
1. Check browser console
2. Check server logs
3. Review `/admin/diagnostics`
4. Check Stripe dashboard
5. Review error tracking