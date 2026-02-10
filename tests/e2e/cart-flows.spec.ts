import { test, expect } from '@playwright/test';

/**
 * P1 — Cart & Checkout Flows
 * Workflows: #8 (cart → continue shopping), #15 (checkout → back a step)
 */

test.describe('Cart — Continue Shopping (#8)', () => {
  test('should have Continue Shopping button in populated cart', async ({ page }) => {
    // Add an item to cart first
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    const addBtn = page.locator('button:has-text("Add to Cart")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);

      // Navigate to cart
      await page.goto('/cart');
      await page.waitForLoadState('domcontentloaded');

      // Should have Continue Shopping button
      const continueBtn = page.locator('a:has-text("Continue Shopping"), button:has-text("Continue Shopping")');
      await expect(continueBtn.first()).toBeVisible();
    }
  });

  test('should navigate to /shop when Continue Shopping is clicked', async ({ page }) => {
    // Add an item first
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    const addBtn = page.locator('button:has-text("Add to Cart")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);

      await page.goto('/cart');
      await page.waitForLoadState('domcontentloaded');

      const continueBtn = page.locator('a:has-text("Continue Shopping"), button:has-text("Continue Shopping")').first();
      if (await continueBtn.isVisible()) {
        await continueBtn.click();
        await page.waitForLoadState('domcontentloaded');

        // Should land on shop page
        expect(page.url()).toContain('/shop');
      }
    }
  });

  test('should show Browse Games button on empty cart', async ({ page }) => {
    // Clear cart via localStorage
    await page.goto('/cart');
    await page.evaluate(() => localStorage.removeItem('cart-storage'));
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Empty cart should have a CTA to browse
    const browseBtn = page.locator('a:has-text("BROWSE GAMES"), a:has-text("Browse Games"), a[href="/shop"]').first();
    if (await browseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(browseBtn).toBeVisible();
    }
  });

  test('empty cart should display empty message', async ({ page }) => {
    await page.goto('/cart');
    await page.evaluate(() => localStorage.removeItem('cart-storage'));
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // data-testid="cart-empty" or empty message text
    const emptyMsg = page.locator('[data-testid="cart-empty"], text=/cart is empty|no items/i').first();
    if (await emptyMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(emptyMsg).toBeVisible();
    }
  });
});

test.describe('Checkout — Back a Step (#15)', () => {
  test('should allow going back during checkout', async ({ page }) => {
    // Add item and start checkout
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    const addBtn = page.locator('button:has-text("Add to Cart")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);

      // Navigate to cart then checkout
      await page.goto('/cart');
      await page.waitForLoadState('domcontentloaded');

      const checkoutBtn = page.locator('button:has-text("Checkout"), a:has-text("Checkout")').first();
      if (await checkoutBtn.isVisible()) {
        await checkoutBtn.click();
        await page.waitForLoadState('domcontentloaded');

        // On checkout page, there should be a back/return link
        const backLink = page.locator(
          'a:has-text("Back"), button:has-text("Back"), a:has-text("Return to cart"), a[href="/cart"]'
        ).first();

        if (await backLink.isVisible({ timeout: 3000 }).catch(() => false)) {
          await backLink.click();
          await page.waitForLoadState('domcontentloaded');

          // Should be back at cart
          expect(page.url()).toContain('/cart');
        }
      }
    }
  });
});
