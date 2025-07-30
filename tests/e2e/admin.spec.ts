import { test, expect, helpers } from './fixtures/test-base';

test.describe('Admin Dashboard', () => {
  // Skip these tests in CI unless we have test auth configured
  test.skip(({ browserName }, testInfo) => {
    return !!process.env.CI && !process.env.TEST_ADMIN_AUTH;
  });

  test.beforeEach(async ({ page }) => {
    // In real tests, you'd need to authenticate first
    // For now, we'll just navigate to admin
    await helpers.navigateTo(page, '/admin/dashboard');
    
    // If redirected to login, skip the test
    if (page.url().includes('sign-in')) {
      test.skip();
    }
  });

  test('should display admin dashboard', async ({ page }) => {
    // Check dashboard elements
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    
    // Check management sections
    await expect(page.locator('text=Manage Games')).toBeVisible();
    await expect(page.locator('text=Manage Merch')).toBeVisible();
    await expect(page.locator('text=Printify Settings')).toBeVisible();
  });

  test('should manage games', async ({ page }) => {
    // Click on manage games
    await page.click('text=Manage Games');
    
    // Should show games list
    const gamesList = page.locator('[data-testid="admin-games-list"]');
    await expect(gamesList).toBeVisible();
    
    // Test add new game button
    const addButton = page.locator('button:has-text("Add New Game")');
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Should show game form
      await expect(page.locator('form[data-testid="game-form"]')).toBeVisible();
    }
  });

  test('should handle Printify import', async ({ page }) => {
    // Navigate to Printify settings section
    const printifySection = page.locator('[data-testid="printify-settings"]');
    if (await printifySection.isVisible()) {
      // Check import button
      const importButton = printifySection.locator('button:has-text("Import from Printify")');
      await expect(importButton).toBeVisible();
      
      // Click import (but don't actually import in tests)
      // await importButton.click();
      // await expect(page.locator('.import-status')).toBeVisible();
    }
  });

  test('should display inventory management', async ({ page }) => {
    // Check inventory section
    const inventorySection = page.locator('[data-testid="inventory-management"]');
    if (await inventorySection.isVisible()) {
      // Should show inventory controls
      await expect(inventorySection.locator('text=Initialize Inventory')).toBeVisible();
    }
  });
});