import { test, expect, helpers } from './fixtures/test-base';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await helpers.navigateTo(page, '/');
  });

  test('should load homepage successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Full Uproar/);
    
    // Check main elements are visible
    await expect(page.locator('h1')).toContainText('Welcome to Full Uproar');
    
    // Check navigation is present
    await expect(page.locator('nav')).toBeVisible();
    
    // Check featured games section
    const featuredGames = page.locator('[data-testid="featured-games"]');
    await expect(featuredGames).toBeVisible();
  });

  test('should navigate to main sections', async ({ page }) => {
    // Test navigation to Games
    await page.click('a[href="/games"]');
    await expect(page).toHaveURL('/games');
    await expect(page.locator('h1')).toContainText('Games');

    // Test navigation to Merch
    await page.click('a[href="/merch"]');
    await expect(page).toHaveURL('/merch');
    await expect(page.locator('h1')).toContainText('Merch');

    // Test navigation to Chaos
    await page.click('a[href="/chaos"]');
    await expect(page).toHaveURL('/chaos');
    await expect(page.locator('h1')).toContainText('Chaos');
  });

  test('should display featured content', async ({ page }) => {
    // Check featured games
    const featuredGames = page.locator('[data-testid="featured-games"] .game-card');
    await expect(featuredGames).toHaveCount(3); // Assuming 3 featured games

    // Check featured merch
    const featuredMerch = page.locator('[data-testid="featured-merch"] .merch-card');
    await expect(featuredMerch.first()).toBeVisible();
  });

  test('should have working footer links', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check footer is visible
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Check social links (if any)
    const socialLinks = footer.locator('a[target="_blank"]');
    const count = await socialLinks.count();
    
    for (let i = 0; i < count; i++) {
      const link = socialLinks.nth(i);
      const href = await link.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });
});