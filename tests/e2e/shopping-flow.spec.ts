import { test, expect, helpers } from './fixtures/test-base';

test.describe('Shopping Flow', () => {
  test('should complete full shopping flow for a game', async ({ page }) => {
    // Go to games page
    await helpers.navigateTo(page, '/games');
    
    // Click on first game
    const firstGame = page.locator('.game-card').first();
    const gameName = await firstGame.locator('h3').textContent();
    await firstGame.click();
    
    // Should be on game detail page
    await expect(page.locator('h1')).toContainText(gameName || '');
    
    // Add to cart
    await page.click('button:has-text("Add to Cart")');
    
    // Check cart count increased
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
    
    // Go to cart
    await page.click('[data-testid="cart-icon"]');
    
    // Verify item in cart
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await expect(page.locator('.cart-item')).toContainText(gameName || '');
    
    // Proceed to checkout
    await page.click('button:has-text("Proceed to Checkout")');
    
    // Fill checkout form (simplified for testing)
    await helpers.fillField(page, 'input[name="email"]', 'test@example.com');
    await helpers.fillField(page, 'input[name="name"]', 'Test User');
    
    // Complete order (you might want to mock payment in tests)
    // await page.click('button:has-text("Place Order")');
  });

  test('should add multiple items to cart', async ({ page }) => {
    // Add a game
    await helpers.navigateTo(page, '/games');
    await page.locator('.game-card').first().click();
    await page.click('button:has-text("Add to Cart")');
    
    // Add merch
    await helpers.navigateTo(page, '/merch');
    await page.locator('.merch-card').first().click();
    
    // Select size if needed
    const sizeSelector = page.locator('select[name="size"]');
    if (await sizeSelector.isVisible()) {
      await sizeSelector.selectOption({ index: 1 });
    }
    
    await page.click('button:has-text("Add to Cart")');
    
    // Verify cart has 2 items
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('2');
  });

  test('should update cart quantities', async ({ page }) => {
    // Add item to cart
    await helpers.navigateTo(page, '/games');
    await page.locator('.game-card').first().click();
    await page.click('button:has-text("Add to Cart")');
    
    // Go to cart
    await page.click('[data-testid="cart-icon"]');
    
    // Increase quantity
    await page.click('button[aria-label="Increase quantity"]');
    await expect(page.locator('.quantity-display')).toHaveText('2');
    
    // Decrease quantity
    await page.click('button[aria-label="Decrease quantity"]');
    await expect(page.locator('.quantity-display')).toHaveText('1');
    
    // Remove item
    await page.click('button[aria-label="Remove item"]');
    await expect(page.locator('.cart-item')).toHaveCount(0);
    await expect(page.locator('.empty-cart-message')).toBeVisible();
  });

  test('should persist cart across navigation', async ({ page }) => {
    // Add item to cart
    await helpers.navigateTo(page, '/games');
    await page.locator('.game-card').first().click();
    await page.click('button:has-text("Add to Cart")');
    
    // Navigate away and back
    await helpers.navigateTo(page, '/chaos');
    await helpers.navigateTo(page, '/');
    
    // Cart should still have item
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
  });
});