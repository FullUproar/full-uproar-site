import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 *
 * These tests capture screenshots of critical pages and compare them
 * against baseline images. Any visual changes will cause the test to fail,
 * helping catch unintended UI changes before they reach production.
 *
 * To update baselines after intentional changes:
 *   npx playwright test visual-regression --update-snapshots
 */

test.describe('Visual Regression - Critical Pages', () => {
  // Dismiss cookie banner before screenshots
  test.beforeEach(async ({ page }) => {
    // Set cookie to dismiss the banner
    await page.context().addCookies([
      {
        name: 'cookie-consent',
        value: 'accepted',
        domain: 'localhost',
        path: '/',
      },
    ]);
  });

  test('homepage - above the fold', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for hero content to be visible
    await page.waitForSelector('h1');

    // Take screenshot of viewport (above the fold)
    await expect(page).toHaveScreenshot('homepage-hero.png', {
      maxDiffPixelRatio: 0.01, // Allow 1% pixel difference
      animations: 'disabled',
    });
  });

  test('homepage - full page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for all content to load
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });

  test('shop page - games tab', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('shop-games.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });

  test('shop page - merch tab', async ({ page }) => {
    await page.goto('/shop?tab=merch');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('shop-merch.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });

  test('cart page - empty state', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('cart-empty.png', {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    });
  });

  test('contact page', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('contact.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });

  test('discover page', async ({ page }) => {
    await page.goto('/discover');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('discover.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'cookie-consent',
        value: 'accepted',
        domain: 'localhost',
        path: '/',
      },
    ]);
  });

  test('homepage mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Allow mobile detection

    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });

  test('shop page mobile', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('shop-mobile.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });

  test('navigation menu mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Open mobile menu
    const menuButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await menuButton.click();
    await page.waitForTimeout(300); // Animation

    await expect(page).toHaveScreenshot('nav-mobile-open.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression - Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'cookie-consent',
        value: 'accepted',
        domain: 'localhost',
        path: '/',
      },
    ]);
  });

  test('footer component', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Screenshot just the footer
    const footer = page.locator('footer').last();
    await expect(footer).toHaveScreenshot('footer.png', {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    });
  });

  test('navigation component', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const nav = page.locator('nav').first();
    await expect(nav).toHaveScreenshot('navigation.png', {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    });
  });

  test('weapon cards expanded - games', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click Games card
    const gamesButton = page.locator('button').filter({ hasText: 'Games' }).first();
    await gamesButton.click();
    await page.waitForTimeout(300);

    // Screenshot the section
    const section = page.locator('#choose-your-weapon');
    await expect(section).toHaveScreenshot('weapon-games-expanded.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });

  test('weapon cards expanded - mods', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click Mods card
    const modsButton = page.locator('button').filter({ hasText: 'Mods' }).first();
    await modsButton.click();
    await page.waitForTimeout(300);

    const section = page.locator('#choose-your-weapon');
    await expect(section).toHaveScreenshot('weapon-mods-expanded.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });
});
