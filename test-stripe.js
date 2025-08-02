// Simple Stripe Integration Test Script
// Run this after setting up your Stripe keys in .env

const testStripeIntegration = async () => {
  console.log('🧪 Testing Stripe Integration...\n');
  
  // Check if running on correct port
  const baseUrl = 'http://localhost:3010';
  
  try {
    // 1. Check if server is running
    console.log('1️⃣ Checking server status...');
    const healthCheck = await fetch(`${baseUrl}/api/health`).catch(() => null);
    if (!healthCheck) {
      console.log('❌ Server not running on port 3010. Please start the dev server first.');
      return;
    }
    console.log('✅ Server is running\n');
    
    // 2. Check test mode status
    console.log('2️⃣ Checking test mode status...');
    const testModeRes = await fetch(`${baseUrl}/api/admin/test-mode`);
    if (testModeRes.ok) {
      const testMode = await testModeRes.json();
      console.log(`✅ Test mode: ${testMode.enabled ? 'ENABLED' : 'DISABLED'}`);
      console.log(`   Stripe mode: ${testMode.stripeMode || 'NOT CONFIGURED'}\n`);
      
      if (!testMode.stripeMode || testMode.stripeMode === 'live') {
        console.log('⚠️  WARNING: Stripe is not in test mode or not configured!');
        console.log('   Please add your test keys to .env file.\n');
      }
    }
    
    // 3. Create a test order
    console.log('3️⃣ Creating test order...');
    console.log('   Note: This will fail if no products exist in the database.');
    console.log('   Create products in the admin panel first.\n');
    
    const orderData = {
      customerEmail: 'test@example.com',
      customerName: 'Test User',
      shippingAddress: {
        line1: '123 Test Street',
        line2: '',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'US'
      },
      items: [
        {
          itemType: 'game',
          gameId: 'test-game-001', // This needs to be a real game ID from your database
          quantity: 1
        }
      ]
    };
    
    const orderRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    if (orderRes.ok) {
      const order = await orderRes.json();
      console.log('✅ Test order created successfully!');
      console.log(`   Order ID: ${order.id}`);
      console.log(`   Total: $${order.total}`);
      console.log(`   Status: ${order.status}\n`);
      
      // 4. Instructions for manual testing
      console.log('4️⃣ Next steps for manual testing:');
      console.log('   1. Go to http://localhost:3010 in your browser');
      console.log('   2. Add a product to cart');
      console.log('   3. Proceed to checkout');
      console.log('   4. Use test card: 4242 4242 4242 4242');
      console.log('   5. Use any future expiry date and any CVC');
      console.log('   6. Complete the checkout\n');
      
      console.log('5️⃣ To view orders:');
      console.log('   1. Go to http://localhost:3010/admin');
      console.log('   2. Navigate to Orders section');
      console.log('   3. You should see your test orders there\n');
      
    } else {
      const error = await orderRes.text();
      console.log('❌ Failed to create test order:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('📝 For full setup instructions, see STRIPE_SETUP.md');
};

// Run the test
testStripeIntegration();