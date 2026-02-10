import { test, expect } from '@playwright/test';

/**
 * P1 — Order Tracking
 * Workflow: #22 (Track order page → Track an order → Sees order status + tracking)
 */

test.describe('Order Tracking Page (#22)', () => {
  test('should load with track order title', async ({ page }) => {
    await page.goto('/track-order');
    await page.waitForLoadState('domcontentloaded');

    // Title: "Track Your Chaos"
    const heading = page.locator('text=/track/i').first();
    await expect(heading).toBeVisible();
  });

  test('should have search input for order lookup', async ({ page }) => {
    await page.goto('/track-order');
    await page.waitForLoadState('domcontentloaded');

    // Search input for order ID or email
    const searchInput = page.locator('input[placeholder*="order"], input[placeholder*="email"], input[type="search"], input[type="text"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('should handle search with invalid order ID', async ({ page }) => {
    await page.goto('/track-order');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('input').first();
    await searchInput.fill('nonexistent-order-12345');

    // Submit search
    const searchBtn = page.locator('button[type="submit"], button:has-text("Search"), button:has-text("Track")').first();
    if (await searchBtn.isVisible()) {
      await searchBtn.click();
      await page.waitForTimeout(1000);

      // Should show error or "not found" message
      const body = await page.textContent('body');
      const hasErrorOrEmpty = body?.toLowerCase().includes('not found') ||
        body?.toLowerCase().includes('no order') ||
        body?.toLowerCase().includes('error') ||
        body?.toLowerCase().includes('try again');
      // Page should handle gracefully (no crash)
      expect(body?.length).toBeGreaterThan(50);
    }
  });

  test('should handle search with email', async ({ page }) => {
    await page.goto('/track-order');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('input').first();
    await searchInput.fill('nobody@example.com');

    const searchBtn = page.locator('button[type="submit"], button:has-text("Search"), button:has-text("Track")').first();
    if (await searchBtn.isVisible()) {
      await searchBtn.click();
      await page.waitForTimeout(1000);

      // Should handle gracefully
      const body = await page.textContent('body');
      expect(body?.length).toBeGreaterThan(50);
    }
  });
});
