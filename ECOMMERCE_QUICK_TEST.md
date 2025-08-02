# E-Commerce Quick Test Guide

## Setup Instructions

1. **Install dependencies** (if you haven't already):
   ```bash
   npm install
   ```

2. **Run database migrations**:
   ```bash
   npx prisma migrate dev
   ```

3. **Seed test data**:
   ```bash
   npm run test:seed
   ```

   This creates:
   - Test games and merchandise
   - Test orders in various states  
   - Test customers
   - Test admin account

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Access the site**:
   - Main site: http://localhost:3000
   - Admin panel: http://localhost:3000/admin

## Quick Test Flows

### 1. Test Purchase (2 minutes)
1. Go to http://localhost:3000/games
2. Add a game to cart
3. Go to http://localhost:3000/merch
4. Add a merch item
5. Click cart icon → Checkout
6. Fill test info:
   - Email: test@example.com
   - Name: Test Customer
   - Phone: 555-1234
   - Address: 123 Test St, Test City, TS 12345
   - Card: 4242 4242 4242 4242
   - Expiry: 12/25
   - CVC: 123
7. Complete order
8. Note the order ID

### 2. Admin Order Management (2 minutes)
1. Go to http://localhost:3000/admin
2. Click "Enable Test Mode" if not already enabled
3. Go to Orders
4. Find your test order
5. Click to view details
6. Update status to "processing"
7. Go to Fulfillment
8. Process order through workflow

### 3. Test Return (1 minute)
1. In admin, find a "delivered" order
2. Click "Create Return"
3. Select reason and submit
4. Go to Returns section
5. Approve the return
6. Process refund

### 4. Test Support (1 minute)
1. Go to Support section
2. View existing tickets
3. Open a ticket
4. Send a reply
5. Update status

## Common Issues

**Can't see products?**
- Make sure test data was seeded: `npm run test:seed`

**Payment not working?**
- Enable test mode in admin dashboard
- Use test card: 4242 4242 4242 4242

**Orders not appearing?**
- Check if payment webhook is configured
- Look in browser console for errors

## Clean Up

To remove all test data:
```bash
npm run test:clean
```

To reset (clean + reseed):
```bash
npm run test:reset
```