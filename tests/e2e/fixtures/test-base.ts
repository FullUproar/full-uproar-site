import { test as base, expect } from '@playwright/test';

// Define custom fixtures
type MyFixtures = {
  // Add custom fixtures here as needed
};

// Extend base test with custom fixtures
export const test = base.extend<MyFixtures>({
  // Custom fixture implementations
});

export { expect };

// Helper functions for common actions
export const helpers = {
  // Navigate to a page and wait for it to load
  async navigateTo(page: any, path: string) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  },

  // Check if element is visible
  async isVisible(page: any, selector: string) {
    return await page.locator(selector).isVisible();
  },

  // Wait for element and click
  async clickElement(page: any, selector: string) {
    await page.locator(selector).waitFor({ state: 'visible' });
    await page.locator(selector).click();
  },

  // Fill form field
  async fillField(page: any, selector: string, value: string) {
    await page.locator(selector).waitFor({ state: 'visible' });
    await page.locator(selector).fill(value);
  },

  // Add to cart helper
  async addToCart(page: any, productSelector: string) {
    await page.locator(productSelector).waitFor({ state: 'visible' });
    await page.locator(`${productSelector} button:has-text("Add to Cart")`).click();
  },

  // Get cart count
  async getCartCount(page: any): Promise<number> {
    const cartBadge = page.locator('[data-testid="cart-count"]');
    if (await cartBadge.isVisible()) {
      const text = await cartBadge.textContent();
      return parseInt(text || '0', 10);
    }
    return 0;
  }
};