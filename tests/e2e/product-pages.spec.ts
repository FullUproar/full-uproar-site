import { test, expect, helpers } from './fixtures/test-base';

test.describe('Product Pages', () => {
  test.describe('Games Page', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.navigateTo(page, '/games');
    });

    test('should display games grid', async ({ page }) => {
      // Check page loaded
      await expect(page.locator('h1')).toContainText('Games');
      
      // Check games are displayed
      const gameCards = page.locator('.game-card');
      await expect(gameCards).toHaveCount.greaterThan(0);
      
      // Check each game card has required elements
      const firstGame = gameCards.first();
      await expect(firstGame.locator('img')).toBeVisible();
      await expect(firstGame.locator('h3')).toBeVisible(); // Title
      await expect(firstGame.locator('.price')).toBeVisible();
    });

    test('should filter games by category', async ({ page }) => {
      // If there are category filters
      const categoryFilter = page.locator('[data-testid="category-filter"]');
      if (await categoryFilter.isVisible()) {
        await categoryFilter.selectOption({ index: 1 });
        
        // Wait for filtered results
        await page.waitForTimeout(500);
        
        // Verify games are still displayed
        const gameCards = page.locator('.game-card');
        await expect(gameCards).toHaveCount.greaterThan(0);
      }
    });

    test('should navigate to game detail', async ({ page }) => {
      const firstGame = page.locator('.game-card').first();
      const gameTitle = await firstGame.locator('h3').textContent();
      
      await firstGame.click();
      
      // Should be on detail page
      await expect(page).toHaveURL(/\/games\/.+/);
      await expect(page.locator('h1')).toContainText(gameTitle || '');
      
      // Check detail page elements
      await expect(page.locator('.game-description')).toBeVisible();
      await expect(page.locator('.price')).toBeVisible();
      await expect(page.locator('button:has-text("Add to Cart")')).toBeVisible();
    });
  });

  test.describe('Merch Page', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.navigateTo(page, '/merch');
    });

    test('should display merch items', async ({ page }) => {
      // Check page loaded
      await expect(page.locator('h1')).toContainText('Merch');
      
      // Check merch items are displayed
      const merchCards = page.locator('.merch-card');
      await expect(merchCards).toHaveCount.greaterThan(0);
      
      // Check each merch card has required elements
      const firstMerch = merchCards.first();
      await expect(firstMerch.locator('img')).toBeVisible();
      await expect(firstMerch.locator('h3')).toBeVisible(); // Title
      await expect(firstMerch.locator('.price')).toBeVisible();
    });

    test('should handle size selection', async ({ page }) => {
      const firstMerch = page.locator('.merch-card').first();
      await firstMerch.click();
      
      // Check if size selector exists
      const sizeSelector = page.locator('select[name="size"]');
      if (await sizeSelector.isVisible()) {
        // Should have size options
        const options = await sizeSelector.locator('option').count();
        expect(options).toBeGreaterThan(1);
        
        // Select a size
        await sizeSelector.selectOption({ index: 1 });
        
        // Should be able to add to cart
        await expect(page.locator('button:has-text("Add to Cart")')).toBeEnabled();
      }
    });
  });

  test.describe('Search Functionality', () => {
    test('should search for products', async ({ page }) => {
      await helpers.navigateTo(page, '/');
      
      const searchInput = page.locator('input[type="search"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await searchInput.press('Enter');
        
        // Should show search results
        await expect(page).toHaveURL(/search/);
        await expect(page.locator('.search-results')).toBeVisible();
      }
    });
  });
});