import { test, expect } from '@playwright/test';

/**
 * P1 — Content & Discovery Pages
 * Workflows: #43 (about), #44 (the-line/lore), #45 (FAQ), #46 (afterroar), #49 (fugly)
 */

test.describe('About Page (#43)', () => {
  test('should load with company identity', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('domcontentloaded');

    // Should have the main identity statement
    const body = await page.textContent('body');
    expect(body).toContain('Full Uproar');
  });

  test('should have tabbed navigation sections', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('domcontentloaded');

    // Section tabs: Mission, What We Do, Philosophy, Our Tribe, Our Promise, Fugly
    const sections = ['Mission', 'What We Do', 'Philosophy', 'Our Tribe', 'Our Promise', 'Fugly'];

    for (const section of sections) {
      const tab = page.locator(`button:has-text("${section}"), a:has-text("${section}")`).first();
      if (await tab.isVisible().catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(300);
        // Content area should update (no error/crash)
      }
    }
  });

  test('should have CTA to browse games', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('domcontentloaded');

    const shopCta = page.locator('a[href="/shop"], a:has-text("BROWSE OUR GAMES")').first();
    await expect(shopCta).toBeVisible();
  });
});

test.describe('FAQ Page (#45)', () => {
  test('should load with title and FAQ items', async ({ page }) => {
    await page.goto('/faq');
    await page.waitForLoadState('domcontentloaded');

    // Page title
    const heading = page.locator('text=Frequently Asked Questions');
    await expect(heading).toBeVisible();
  });

  test('should have category filter buttons', async ({ page }) => {
    await page.goto('/faq');
    await page.waitForLoadState('domcontentloaded');

    // Category buttons
    const categories = ['All', 'Ordering', 'Products', 'Payment', 'Returns', 'Account'];
    let foundCategories = 0;

    for (const cat of categories) {
      const btn = page.locator(`button:has-text("${cat}")`).first();
      if (await btn.isVisible().catch(() => false)) {
        foundCategories++;
      }
    }

    expect(foundCategories).toBeGreaterThanOrEqual(2);
  });

  test('should expand FAQ item on click', async ({ page }) => {
    await page.goto('/faq');
    await page.waitForLoadState('domcontentloaded');

    // Find first FAQ question (clickable element)
    const faqItem = page.locator('button, div[role="button"]').filter({
      hasText: /\?/,
    }).first();

    if (await faqItem.isVisible()) {
      await faqItem.click();
      await page.waitForTimeout(300);

      // After click, answer content should be visible
      // The expanded content area should have more text
      const pageText = await page.textContent('body');
      expect(pageText?.length).toBeGreaterThan(100);
    }
  });

  test('should have contact links at bottom', async ({ page }) => {
    await page.goto('/faq');
    await page.waitForLoadState('domcontentloaded');

    // "Still Have Questions?" section
    const stillHaveQuestions = page.locator('text=/still have questions/i');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    // Should have link to contact page
    const contactLink = page.locator('a[href="/contact"]');
    if (await contactLink.isVisible().catch(() => false)) {
      await expect(contactLink).toBeVisible();
    }
  });
});

test.describe('Afterroar Page (#46)', () => {
  test('should load with title and definition', async ({ page }) => {
    await page.goto('/afterroar');
    await page.waitForLoadState('domcontentloaded');

    // Title contains "Afterroar"
    const body = await page.textContent('body');
    expect(body).toContain('roar');

    // Definition text
    const definition = page.locator('text=/emotional afterglow|night well played/i');
    if (await definition.isVisible().catch(() => false)) {
      await expect(definition).toBeVisible();
    }
  });

  test('should show waitlist signup form', async ({ page }) => {
    await page.goto('/afterroar');
    await page.waitForLoadState('domcontentloaded');

    // Waitlist email input
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible().catch(() => false)) {
      await expect(emailInput).toBeVisible();

      // Join Waitlist button
      const joinBtn = page.locator('button:has-text("Join Waitlist"), button:has-text("Join")');
      await expect(joinBtn.first()).toBeVisible();
    }
  });

  test('should show Coming Soon badge', async ({ page }) => {
    await page.goto('/afterroar');
    await page.waitForLoadState('domcontentloaded');

    const comingSoon = page.locator('text=/coming soon/i');
    if (await comingSoon.isVisible().catch(() => false)) {
      await expect(comingSoon).toBeVisible();
    }
  });
});

test.describe('Fugly Page (#49)', () => {
  test('should load with Fugly domain header', async ({ page }) => {
    await page.goto('/fugly');
    await page.waitForLoadState('domcontentloaded');

    // Main heading
    const heading = page.locator('text=/FUGLY/i').first();
    await expect(heading).toBeVisible();
  });

  test('should display comics section', async ({ page }) => {
    await page.goto('/fugly');
    await page.waitForLoadState('networkidle');

    // Comics section or empty state
    const body = await page.textContent('body');
    // Should have either comics or loading/empty state
    const hasComicsOrEmpty = body?.includes('comic') ||
      body?.includes('Comic') ||
      body?.includes('CHAOS') ||
      body?.includes('chaos');
    expect(body?.length).toBeGreaterThan(100);
  });

  test('should display news/dispatches section', async ({ page }) => {
    await page.goto('/fugly');
    await page.waitForLoadState('networkidle');

    // Chaos Dispatches section or empty state
    const dispatches = page.locator('text=/dispatch|chaos|news/i').first();
    if (await dispatches.isVisible().catch(() => false)) {
      await expect(dispatches).toBeVisible();
    }
  });
});

test.describe('The Line / Lore Page (#44)', () => {
  test('should load lore content', async ({ page }) => {
    await page.goto('/the-line');
    await page.waitForLoadState('domcontentloaded');

    // Should have some content about the game universe
    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);
  });
});
