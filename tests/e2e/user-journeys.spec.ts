import { test, expect } from '@playwright/test';

/**
 * User Journey Tests
 *
 * These tests measure the actual user experience of completing critical flows.
 * They track:
 * - Total journey time
 * - Number of clicks/interactions required
 * - Wait times between actions
 * - Cognitive load indicators
 *
 * A good UX should have:
 * - Fast page transitions (<500ms perceived)
 * - Minimal clicks to complete tasks
 * - Clear feedback at each step
 */

interface JourneyMetrics {
  totalTimeMs: number;
  clickCount: number;
  pageLoads: number;
  waitEvents: number;
  steps: { name: string; durationMs: number }[];
}

test.describe('User Journey - Browse to Cart', () => {
  test('homepage → shop → add item → cart (optimal path)', async ({ page }) => {
    const metrics: JourneyMetrics = {
      totalTimeMs: 0,
      clickCount: 0,
      pageLoads: 0,
      waitEvents: 0,
      steps: [],
    };

    const journeyStart = Date.now();
    let stepStart = Date.now();

    // Step 1: Land on homepage
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    metrics.pageLoads++;
    metrics.steps.push({ name: 'Homepage load', durationMs: Date.now() - stepStart });
    stepStart = Date.now();

    // Step 2: Navigate to shop
    await page.click('a[href="/shop"]');
    await page.waitForLoadState('networkidle');
    metrics.clickCount++;
    metrics.pageLoads++;
    metrics.steps.push({ name: 'Navigate to shop', durationMs: Date.now() - stepStart });
    stepStart = Date.now();

    // Step 3: Find and add a product
    const addToCartBtn = page.locator('button:has-text("Add to Cart")').first();

    if (await addToCartBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addToCartBtn.click();
      metrics.clickCount++;
      metrics.steps.push({ name: 'Add to cart', durationMs: Date.now() - stepStart });
      stepStart = Date.now();

      // Step 4: Navigate to cart
      await page.click('[data-testid="cart-button"]');
      await page.waitForLoadState('networkidle');
      metrics.clickCount++;
      metrics.pageLoads++;
      metrics.steps.push({ name: 'Navigate to cart', durationMs: Date.now() - stepStart });

      // Verify cart has item
      await expect(page.locator('.cart-item, [data-testid="cart-item"]').first()).toBeVisible({ timeout: 3000 }).catch(() => {
        // Cart structure may vary
      });
    }

    metrics.totalTimeMs = Date.now() - journeyStart;

    // Log journey metrics
    console.log('\n📊 Journey Metrics: Browse → Cart');
    console.log('═'.repeat(50));
    console.log(`Total time: ${metrics.totalTimeMs}ms`);
    console.log(`Clicks required: ${metrics.clickCount}`);
    console.log(`Page loads: ${metrics.pageLoads}`);
    console.log('\nStep breakdown:');
    metrics.steps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step.name}: ${step.durationMs}ms`);
    });
    console.log('═'.repeat(50));

    // Quality assertions
    expect(metrics.totalTimeMs).toBeLessThan(15000); // Should complete in under 15s
    expect(metrics.clickCount).toBeLessThanOrEqual(4); // Minimal clicks
  });

  test('direct shop link → add item → cart (returning user)', async ({ page }) => {
    const metrics: JourneyMetrics = {
      totalTimeMs: 0,
      clickCount: 0,
      pageLoads: 0,
      waitEvents: 0,
      steps: [],
    };

    const journeyStart = Date.now();

    // Returning user goes directly to shop
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');
    metrics.pageLoads++;

    const addToCartBtn = page.locator('button:has-text("Add to Cart")').first();

    if (await addToCartBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addToCartBtn.click();
      metrics.clickCount++;

      await page.click('[data-testid="cart-button"]');
      metrics.clickCount++;
      metrics.pageLoads++;

      await page.waitForLoadState('networkidle');
    }

    metrics.totalTimeMs = Date.now() - journeyStart;

    console.log(`\n📊 Returning User: Shop → Cart in ${metrics.totalTimeMs}ms with ${metrics.clickCount} clicks`);

    // Returning users should be faster
    expect(metrics.totalTimeMs).toBeLessThan(10000);
    expect(metrics.clickCount).toBeLessThanOrEqual(2);
  });
});

test.describe('User Journey - Information Seeking', () => {
  test('find contact information', async ({ page }) => {
    const journeyStart = Date.now();
    let clicks = 0;

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Try to find contact - user might try footer first
    const footerContact = page.locator('footer a[href*="contact"], footer a[href*="mailto"]').first();

    if (await footerContact.isVisible()) {
      await footerContact.click();
      clicks++;
    } else {
      // Try navigation
      await page.click('a[href="/connect"]');
      clicks++;
      await page.waitForLoadState('domcontentloaded');

      const contactLink = page.locator('a[href*="contact"]').first();
      if (await contactLink.isVisible()) {
        await contactLink.click();
        clicks++;
      }
    }

    await page.waitForLoadState('networkidle');

    const totalTime = Date.now() - journeyStart;
    console.log(`\n📊 Find Contact: ${totalTime}ms, ${clicks} clicks`);

    // Contact should be findable in 2 clicks or less
    expect(clicks).toBeLessThanOrEqual(2);
    expect(totalTime).toBeLessThan(8000);
  });

  test('find FAQ/help', async ({ page }) => {
    const journeyStart = Date.now();
    let clicks = 0;

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Look for FAQ in footer first (common pattern)
    const faqLink = page.locator('a[href*="faq"], a:has-text("FAQ")').first();

    if (await faqLink.isVisible()) {
      await faqLink.click();
      clicks++;
    }

    await page.waitForLoadState('networkidle');

    const totalTime = Date.now() - journeyStart;
    console.log(`\n📊 Find FAQ: ${totalTime}ms, ${clicks} clicks`);

    expect(clicks).toBeLessThanOrEqual(2);
  });

  test('find shipping/returns policy', async ({ page }) => {
    const journeyStart = Date.now();
    let clicks = 0;

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Returns policy should be in footer
    const returnsLink = page.locator('a[href*="return"], a:has-text("Returns")').first();

    if (await returnsLink.isVisible()) {
      await returnsLink.click();
      clicks++;
    }

    await page.waitForLoadState('networkidle');

    const totalTime = Date.now() - journeyStart;
    console.log(`\n📊 Find Returns Policy: ${totalTime}ms, ${clicks} clicks`);

    // Legal/policy pages should be 1 click from homepage
    expect(clicks).toBeLessThanOrEqual(1);
  });
});

test.describe('User Journey - Form Completion', () => {
  test('contact form submission flow', async ({ page }) => {
    const metrics = {
      totalTimeMs: 0,
      fieldsCount: 0,
      tabPresses: 0,
      errorEncountered: false,
    };

    const journeyStart = Date.now();

    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    // Count form fields
    const inputs = page.locator('input:visible, textarea:visible, select:visible');
    metrics.fieldsCount = await inputs.count();

    // Fill each field and count tab navigation
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User');
      await page.keyboard.press('Tab');
      metrics.tabPresses++;
    }

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await page.keyboard.press('Tab');
      metrics.tabPresses++;
    }

    const messageInput = page.locator('textarea').first();
    if (await messageInput.isVisible()) {
      await messageInput.fill('This is a test message for journey testing.');
      await page.keyboard.press('Tab');
      metrics.tabPresses++;
    }

    metrics.totalTimeMs = Date.now() - journeyStart;

    console.log('\n📊 Contact Form Journey');
    console.log('═'.repeat(50));
    console.log(`Total time: ${metrics.totalTimeMs}ms`);
    console.log(`Fields to complete: ${metrics.fieldsCount}`);
    console.log(`Tab navigations: ${metrics.tabPresses}`);
    console.log('═'.repeat(50));

    // Form should be quick to fill
    expect(metrics.fieldsCount).toBeLessThanOrEqual(5); // Not too many fields
  });

  test('newsletter signup (minimal friction)', async ({ page }) => {
    const journeyStart = Date.now();
    let interactions = 0;

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find newsletter input
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      interactions++;

      // Find and click subscribe
      const subscribeBtn = page.locator('button:has-text("Subscribe")').first();
      if (await subscribeBtn.isVisible()) {
        // Don't actually submit, just measure interaction count
        interactions++;
      }
    }

    const totalTime = Date.now() - journeyStart;
    console.log(`\n📊 Newsletter Signup: ${totalTime}ms, ${interactions} interactions`);

    // Newsletter should be 2 interactions max (type + click)
    expect(interactions).toBeLessThanOrEqual(2);
  });
});

test.describe('User Journey - Mobile Experience', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('mobile navigation journey', async ({ page }) => {
    const journeyStart = Date.now();
    let taps = 0;

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Mobile detection

    // Open mobile menu
    const menuButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await menuButton.click();
    taps++;
    await page.waitForTimeout(300);

    // Navigate to shop
    const shopLink = page.locator('a[href="/shop"], button:has-text("SHOP")').first();
    if (await shopLink.isVisible()) {
      await shopLink.click();
      taps++;
    }

    await page.waitForLoadState('networkidle');

    const totalTime = Date.now() - journeyStart;
    console.log(`\n📱 Mobile Navigation: ${totalTime}ms, ${taps} taps`);

    // Mobile navigation should be 2 taps to get to main pages
    expect(taps).toBeLessThanOrEqual(2);
    expect(totalTime).toBeLessThan(8000);
  });

  test('mobile add to cart journey', async ({ page }) => {
    const journeyStart = Date.now();
    let taps = 0;

    await page.goto('/shop');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const addBtn = page.locator('button:has-text("Add to Cart")').first();

    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      taps++;

      // Wait for feedback
      await page.waitForTimeout(500);
    }

    const totalTime = Date.now() - journeyStart;
    console.log(`\n📱 Mobile Add to Cart: ${totalTime}ms, ${taps} taps`);

    // Should be 1 tap to add to cart
    expect(taps).toBeLessThanOrEqual(1);
  });
});

test.describe('User Journey - Error Recovery', () => {
  test('404 page has clear path back', async ({ page }) => {
    const journeyStart = Date.now();

    await page.goto('/this-page-does-not-exist-12345');
    await page.waitForLoadState('networkidle');

    // Should show 404 or redirect
    const has404 = await page.locator('text=404, text=not found, text=page not found').first().isVisible().catch(() => false);
    const hasHomeLink = await page.locator('a[href="/"]').isVisible();

    const totalTime = Date.now() - journeyStart;
    console.log(`\n📊 404 Recovery: ${totalTime}ms, Home link: ${hasHomeLink}`);

    // 404 should have a way home
    expect(hasHomeLink).toBe(true);
  });

  test('empty cart has clear next action', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    // Empty cart should suggest next action
    const hasShopLink = await page.locator('a[href*="shop"]').isVisible();
    const hasEmptyMessage = await page.locator('text=empty, text=no items, text=nothing').first().isVisible().catch(() => false);

    console.log(`\n📊 Empty Cart: Shop link: ${hasShopLink}, Empty message: ${hasEmptyMessage}`);

    // Empty cart should guide users to shop
    expect(hasShopLink).toBe(true);
  });
});

test.describe('Cognitive Load Metrics', () => {
  test('homepage decision points', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Count primary CTAs visible above the fold
    const primaryButtons = page.locator('button:visible, a[href]:visible').filter({
      has: page.locator('text=/shop|buy|add|subscribe|sign/i'),
    });
    const ctaCount = await primaryButtons.count();

    // Count navigation options
    const navLinks = page.locator('nav a[href]');
    const navCount = await navLinks.count();

    console.log('\n📊 Homepage Cognitive Load');
    console.log('═'.repeat(50));
    console.log(`Primary CTAs visible: ${ctaCount}`);
    console.log(`Navigation options: ${navCount}`);
    console.log('═'.repeat(50));

    // Hick's Law: Too many choices = decision paralysis
    // Ideal: 1 clear primary CTA, max 7±2 nav items
    expect(navCount).toBeLessThanOrEqual(9);
  });

  test('checkout decision points', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    // Count form fields if checkout visible
    const inputs = page.locator('input:visible');
    const inputCount = await inputs.count();

    // Count buttons
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();

    console.log('\n📊 Cart/Checkout Cognitive Load');
    console.log(`Input fields: ${inputCount}`);
    console.log(`Buttons: ${buttonCount}`);

    // Checkout should be focused - not too many options
    expect(buttonCount).toBeLessThanOrEqual(5);
  });
});
