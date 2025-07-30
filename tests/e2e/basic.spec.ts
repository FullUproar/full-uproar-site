import { test, expect } from '@playwright/test';

test('basic test - app loads', async ({ page }) => {
  await page.goto('/');
  
  // Basic check that the app loaded
  await expect(page).toHaveTitle(/Full Uproar/);
  
  // Check that some content is visible
  const heading = page.locator('h1').first();
  await expect(heading).toBeVisible();
});