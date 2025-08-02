import { test, expect } from '@playwright/test';

// Test configuration
const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_CARDS = {
  success: '4242424242424242',
  declined: '4000000000000002',
  insufficient: '4000000000009995'
};

test.describe('E-commerce Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto(TEST_URL);
  });

  test('Complete purchase flow - happy path', async ({ page }) => {
    // 1. Browse and add items to cart
    await test.step('Add items to cart', async () => {
      // Navigate to games
      await page.click('text=Games');
      await page.waitForSelector('[data-testid="game-card"]');
      
      // Add first game to cart
      await page.first('[data-testid="add-to-cart-button"]').click();
      await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
      
      // Navigate to merch
      await page.click('text=Merch');
      await page.waitForSelector('[data-testid="merch-card"]');
      
      // Add first merch item
      await page.first('[data-testid="add-to-cart-button"]').click();
      await expect(page.locator('[data-testid="cart-count"]')).toHaveText('2');
    });

    // 2. View cart and proceed to checkout
    await test.step('View cart', async () => {
      await page.click('[data-testid="cart-button"]');
      await expect(page).toHaveURL(/.*\/cart/);
      
      // Verify cart contents
      await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2);
      
      // Proceed to checkout
      await page.click('text=Checkout');
    });

    // 3. Complete checkout form
    await test.step('Fill checkout information', async () => {
      // Contact information
      await page.fill('[name="customerEmail"]', 'test@example.com');
      await page.fill('[name="customerName"]', 'Test Customer');
      await page.fill('[name="phone"]', '555-1234');
      
      await page.click('text=Continue to Shipping');
      
      // Shipping address
      await page.fill('[name="street"]', '123 Test Street');
      await page.fill('[name="city"]', 'Test City');
      await page.fill('[name="state"]', 'TS');
      await page.fill('[name="zipCode"]', '12345');
      
      await page.click('text=Continue to Payment');
      
      // Payment information
      await page.fill('[data-testid="card-number"]', TEST_CARDS.success);
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvc"]', '123');
      await page.fill('[data-testid="card-name"]', 'TEST CUSTOMER');
    });

    // 4. Complete order
    await test.step('Submit order', async () => {
      await page.click('text=Complete Order');
      
      // Wait for order confirmation
      await expect(page).toHaveURL(/.*\/order-confirmation/);
      await expect(page.locator('text=Order Confirmed')).toBeVisible();
      
      // Verify order ID is displayed
      const orderId = await page.locator('[data-testid="order-id"]').textContent();
      expect(orderId).toBeTruthy();
    });
  });

  test('Payment failure and recovery', async ({ page }) => {
    // Add item and go to checkout
    await page.click('text=Games');
    await page.first('[data-testid="add-to-cart-button"]').click();
    await page.click('[data-testid="cart-button"]');
    await page.click('text=Checkout');
    
    // Fill checkout with declining card
    await test.step('Attempt payment with declining card', async () => {
      // Quick fill (assuming we save form state)
      await page.fill('[name="customerEmail"]', 'test@example.com');
      await page.fill('[name="customerName"]', 'Test Customer');
      await page.fill('[name="phone"]', '555-1234');
      await page.click('text=Continue to Shipping');
      
      await page.fill('[name="street"]', '123 Test Street');
      await page.fill('[name="city"]', 'Test City');
      await page.fill('[name="state"]', 'TS');
      await page.fill('[name="zipCode"]', '12345');
      await page.click('text=Continue to Payment');
      
      // Use declining card
      await page.fill('[data-testid="card-number"]', TEST_CARDS.declined);
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvc"]', '123');
      await page.fill('[data-testid="card-name"]', 'TEST CUSTOMER');
      
      await page.click('text=Complete Order');
      
      // Expect error message
      await expect(page.locator('text=Your card was declined')).toBeVisible();
    });
    
    // Retry with good card
    await test.step('Retry with valid card', async () => {
      await page.fill('[data-testid="card-number"]', TEST_CARDS.success);
      await page.click('text=Complete Order');
      
      await expect(page).toHaveURL(/.*\/order-confirmation/);
    });
  });

  test('Cart persistence across sessions', async ({ page, context }) => {
    // Add items to cart
    await page.click('text=Games');
    await page.first('[data-testid="add-to-cart-button"]').click();
    
    // Get cart count
    const cartCount = await page.locator('[data-testid="cart-count"]').textContent();
    expect(cartCount).toBe('1');
    
    // Close and reopen in new page
    await page.close();
    const newPage = await context.newPage();
    await newPage.goto(TEST_URL);
    
    // Verify cart persisted
    await expect(newPage.locator('[data-testid="cart-count"]')).toHaveText('1');
  });

  test('Stock validation during checkout', async ({ page }) => {
    // This test assumes we have a low-stock item
    // Add specific low-stock item to cart
    await page.goto(`${TEST_URL}/games/low-stock-game`);
    
    // Add max quantity
    await page.fill('[data-testid="quantity-input"]', '10');
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Proceed to checkout
    await page.click('[data-testid="cart-button"]');
    await page.click('text=Checkout');
    
    // Complete checkout quickly
    // ... (fill form as above)
    
    // Expect stock error
    await expect(page.locator('text=Insufficient stock')).toBeVisible();
  });
});

test.describe('Admin Order Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin (implement based on your auth)
    await page.goto(`${TEST_URL}/admin`);
    // Add login steps here
  });

  test('Process order through fulfillment', async ({ page }) => {
    // Navigate to orders
    await page.click('text=Orders');
    
    // Find a paid order
    await page.click('text=paid').first();
    
    // Update status to processing
    await page.selectOption('[data-testid="order-status"]', 'processing');
    await expect(page.locator('text=Status updated')).toBeVisible();
    
    // Navigate to fulfillment center
    await page.click('text=Fulfillment');
    
    // Find order in picking queue
    await page.click('text=Start Picking');
    
    // Move through workflow
    await page.click('text=Move to Packing');
    await page.click('text=Ready to Ship');
    
    // Generate shipping label
    await page.click('text=Create Label');
    await page.selectOption('[name="carrier"]', 'usps');
    await page.selectOption('[name="service"]', 'priority');
    await page.click('text=Generate Label');
    
    await expect(page.locator('text=Label created')).toBeVisible();
  });
});

test.describe('Return Process', () => {
  test('Create and process return', async ({ page }) => {
    // Navigate to a delivered order
    await page.goto(`${TEST_URL}/admin/orders`);
    await page.click('text=delivered').first();
    
    // Create return
    await page.click('text=Create Return');
    await page.selectOption('[name="reason"]', 'defective');
    await page.fill('[name="customerNotes"]', 'Item not working properly');
    await page.click('text=Submit Return Request');
    
    // Get RMA number
    const rmaNumber = await page.locator('[data-testid="rma-number"]').textContent();
    expect(rmaNumber).toMatch(/^RMA/);
    
    // Navigate to returns
    await page.goto(`${TEST_URL}/admin/returns`);
    await page.click(`text=${rmaNumber}`);
    
    // Process return
    await page.selectOption('[data-testid="return-status"]', 'approved');
    await page.click('text=Generate Return Label');
    
    // Mark as received
    await page.selectOption('[data-testid="return-status"]', 'received');
    
    // Process refund
    await page.click('text=Process Refund');
    await page.fill('[name="refundAmount"]', '25.99');
    await page.click('text=Issue Refund');
    
    await expect(page.locator('text=Refund processed')).toBeVisible();
  });
});