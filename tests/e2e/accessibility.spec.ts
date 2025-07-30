import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('games page should not have accessibility violations', async ({ page }) => {
    await page.goto('/games');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('cart should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Tab to cart button
    await page.keyboard.press('Tab');
    
    // Keep tabbing until we reach the cart
    let focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    let tabCount = 0;
    
    while (focused !== 'cart-icon' && tabCount < 20) {
      await page.keyboard.press('Tab');
      focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      tabCount++;
    }
    
    // Cart should be reachable by keyboard
    expect(tabCount).toBeLessThan(20);
  });

  test('forms should have proper labels', async ({ page }) => {
    await page.goto('/checkout');
    
    // Check all inputs have labels
    const inputs = page.locator('input');
    const count = await inputs.count();
    
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toHaveCount(1);
      }
    }
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      
      // All images should have alt text
      expect(alt).toBeTruthy();
    }
  });
});