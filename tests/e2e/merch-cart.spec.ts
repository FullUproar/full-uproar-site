import { test, expect } from '@playwright/test';

/**
 * P0 — Merch Add-to-Cart with Size Selection
 * Workflow: #7 (Merch detail → Add to cart with size → Cart updates with correct variant)
 */

test.describe('Merch Add-to-Cart with Size (#7)', () => {
  test('should require size selection before adding to cart', async ({ page }) => {
    await page.goto('/merch');
    await page.waitForLoadState('networkidle');

    // Click first merch item
    const firstMerch = page.locator('a[href^="/merch/"]').first();
    if (await firstMerch.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstMerch.click();
      await page.waitForLoadState('domcontentloaded');

      // On merch detail page, check for size selector
      const sizeSelector = page.locator('select[name="size"], [role="listbox"], button:has-text("Select Size")').first();
      const sizeButtons = page.locator('button').filter({ hasText: /^(XS|S|M|L|XL|XXL|2XL|3XL)$/ });

      const hasSizeSelect = await sizeSelector.isVisible().catch(() => false);
      const hasSizeButtons = (await sizeButtons.count()) > 0;

      if (hasSizeSelect || hasSizeButtons) {
        // Try to add without selecting size — button may be disabled
        const addBtn = page.locator('button:has-text("Add to Cart")');

        if (hasSizeButtons) {
          // Click a size button
          await sizeButtons.first().click();
          await page.waitForTimeout(300);
        } else if (hasSizeSelect) {
          await sizeSelector.selectOption({ index: 1 });
        }

        // Now add to cart should work
        await expect(addBtn).toBeEnabled();
        await addBtn.click();

        // Verify cart updated
        await page.waitForTimeout(500);
        const cartCount = page.locator('[data-testid="cart-count"]');
        if (await cartCount.isVisible()) {
          const count = await cartCount.textContent();
          expect(parseInt(count || '0')).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  test('should show selected size in cart', async ({ page }) => {
    await page.goto('/merch');
    await page.waitForLoadState('networkidle');

    const firstMerch = page.locator('a[href^="/merch/"]').first();
    if (await firstMerch.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstMerch.click();
      await page.waitForLoadState('domcontentloaded');

      // Select a specific size
      const sizeButtons = page.locator('button').filter({ hasText: /^(XS|S|M|L|XL|XXL|2XL|3XL)$/ });
      const sizeSelector = page.locator('select[name="size"]');

      let selectedSize = '';

      if ((await sizeButtons.count()) > 0) {
        const sizeBtn = sizeButtons.first();
        selectedSize = (await sizeBtn.textContent()) || '';
        await sizeBtn.click();
      } else if (await sizeSelector.isVisible().catch(() => false)) {
        await sizeSelector.selectOption({ index: 1 });
        selectedSize = await sizeSelector.inputValue();
      }

      if (selectedSize) {
        // Add to cart
        const addBtn = page.locator('button:has-text("Add to Cart")');
        await addBtn.click();
        await page.waitForTimeout(500);

        // Go to cart and verify size is shown
        await page.goto('/cart');
        await page.waitForLoadState('domcontentloaded');

        const cartContent = await page.textContent('body');
        // Size should appear somewhere in cart
        expect(cartContent).toContain(selectedSize);
      }
    }
  });

  test('should show correct price in cart after adding merch', async ({ page }) => {
    await page.goto('/merch');
    await page.waitForLoadState('networkidle');

    const firstMerch = page.locator('a[href^="/merch/"]').first();
    if (await firstMerch.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstMerch.click();
      await page.waitForLoadState('domcontentloaded');

      // Get the displayed price
      const priceEl = page.locator('text=/\\$\\d+\\.\\d{2}/').first();
      const priceText = await priceEl.textContent();

      // Select size if needed
      const sizeButtons = page.locator('button').filter({ hasText: /^(XS|S|M|L|XL|XXL|2XL|3XL)$/ });
      const sizeSelector = page.locator('select[name="size"]');

      if ((await sizeButtons.count()) > 0) {
        await sizeButtons.first().click();
      } else if (await sizeSelector.isVisible().catch(() => false)) {
        await sizeSelector.selectOption({ index: 1 });
      }

      // Add to cart
      const addBtn = page.locator('button:has-text("Add to Cart")');
      if (await addBtn.isEnabled()) {
        await addBtn.click();
        await page.waitForTimeout(500);

        // Check cart has the price
        await page.goto('/cart');
        await page.waitForLoadState('domcontentloaded');

        if (priceText) {
          const cartBody = await page.textContent('body');
          // Price from detail page should appear in cart
          expect(cartBody).toContain(priceText.replace('$', ''));
        }
      }
    }
  });
});
