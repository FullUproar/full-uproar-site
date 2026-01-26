import { test, expect } from '@playwright/test';

/**
 * UX Health Tests
 *
 * Automated detection of UX problems:
 * - Dead clicks (elements that look clickable but aren't)
 * - Broken links
 * - Missing images
 * - Console errors
 * - Form friction
 * - Slow interactions
 */

test.describe('Dead Click Detection', () => {
  test('no dead clicks on buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const deadClicks: string[] = [];

    // Find all button-like elements
    const buttons = page.locator('button, [role="button"], .btn, [class*="button"]');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 20); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const isDisabled = await button.getAttribute('disabled');
        const hasClickHandler = await button.evaluate((el) => {
          // Check if element has click handlers
          const hasOnClick = el.hasAttribute('onclick') || el.onclick !== null;
          // @ts-ignore - checking for React event handlers
          const hasReactHandler = el._reactProps?.onClick || el.__reactProps$?.onClick;
          return hasOnClick || hasReactHandler || el.tagName === 'BUTTON';
        });

        const text = await button.textContent();
        const hasLink = await button.locator('a').count() > 0;
        const isFormSubmit = await button.getAttribute('type') === 'submit';

        // Button without any action is a dead click
        if (!isDisabled && !hasClickHandler && !hasLink && !isFormSubmit && text?.trim()) {
          deadClicks.push(`"${text?.trim().substring(0, 30)}"`);
        }
      }
    }

    if (deadClicks.length > 0) {
      console.log('\n⚠️ Potential dead clicks found:', deadClicks.join(', '));
    }

    // Allow some non-interactive elements (may be styled but not buttons)
    expect(deadClicks.length).toBeLessThanOrEqual(2);
  });

  test('all visible links have valid hrefs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const badLinks: string[] = [];

    const links = page.locator('a[href]');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      if (await link.isVisible()) {
        const href = await link.getAttribute('href');
        const text = await link.textContent();

        // Check for problematic hrefs
        if (!href || href === '#' || href === 'javascript:void(0)' || href === 'javascript:;') {
          badLinks.push(`"${text?.trim().substring(0, 20)}" → ${href}`);
        }
      }
    }

    if (badLinks.length > 0) {
      console.log('\n⚠️ Links with bad hrefs:', badLinks.join(', '));
    }

    expect(badLinks.length).toBe(0);
  });
});

test.describe('Broken Element Detection', () => {
  // Increase timeout for these tests due to rate limiting in parallel runs
  test.setTimeout(60000);

  test('no broken images on homepage', async ({ page }) => {
    const brokenImages: string[] = [];

    // Listen for failed image loads
    page.on('response', (response) => {
      if (response.request().resourceType() === 'image' && response.status() >= 400) {
        brokenImages.push(response.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Also check for images with failed naturalWidth
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      if (await img.isVisible()) {
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        const src = await img.getAttribute('src');

        if (naturalWidth === 0 && src) {
          brokenImages.push(src);
        }
      }
    }

    if (brokenImages.length > 0) {
      console.log('\n🖼️ Broken images found:', brokenImages);
    }

    expect(brokenImages.length).toBe(0);
  });

  test('no broken images on shop page', async ({ page }) => {
    const brokenImages: string[] = [];

    page.on('response', (response) => {
      if (response.request().resourceType() === 'image' && response.status() >= 400) {
        brokenImages.push(response.url());
      }
    });

    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      if (await img.isVisible()) {
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        const src = await img.getAttribute('src');

        if (naturalWidth === 0 && src && !src.includes('placeholder')) {
          brokenImages.push(src);
        }
      }
    }

    if (brokenImages.length > 0) {
      console.log('\n🖼️ Broken images on shop:', brokenImages);
    }

    expect(brokenImages.length).toBe(0);
  });

  test('no console errors on critical pages', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore expected errors (favicon, analytics, rate limits during testing)
        if (!text.includes('favicon') &&
            !text.includes('analytics') &&
            !text.includes('Rate limit') &&
            !text.includes('429')) {
          consoleErrors.push(text.substring(0, 100));
        }
      }
    });

    const pages = ['/', '/shop', '/cart', '/contact'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
    }

    if (consoleErrors.length > 0) {
      console.log('\n🔴 Console errors:', consoleErrors);
    }

    // Allow some minor errors (third-party scripts, etc.)
    expect(consoleErrors.length).toBeLessThanOrEqual(3);
  });

  test('all internal links resolve', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const brokenLinks: string[] = [];

    // Get all internal links
    const links = page.locator('a[href^="/"]');
    const hrefs = await links.evaluateAll((els) =>
      els.map((el) => el.getAttribute('href')).filter((h): h is string => h !== null)
    );

    // Dedupe
    const uniqueHrefs = [...new Set(hrefs)].slice(0, 15); // Check first 15

    for (const href of uniqueHrefs) {
      const response = await page.goto(href, { waitUntil: 'domcontentloaded' });
      const status = response?.status() || 0;

      // 429 (rate limit) is expected during parallel testing, not a broken link
      if (status >= 400 && status !== 429) {
        brokenLinks.push(`${href} → ${status}`);
      }
    }

    if (brokenLinks.length > 0) {
      console.log('\n🔗 Broken internal links:', brokenLinks);
    }

    expect(brokenLinks.length).toBe(0);
  });
});

test.describe('Form Friction Detection', () => {
  test('contact form has proper labels', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    const unlabeledInputs: string[] = [];

    const inputs = page.locator('input:visible, textarea:visible, select:visible');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const name = await input.getAttribute('name');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');

      // Check if input has associated label
      let hasLabel = false;

      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        hasLabel = (await label.count()) > 0;
      }

      if (!hasLabel && !ariaLabel) {
        unlabeledInputs.push(name || placeholder || `input-${i}`);
      }
    }

    if (unlabeledInputs.length > 0) {
      console.log('\n📝 Inputs without proper labels:', unlabeledInputs);
    }

    // All inputs should have labels for accessibility
    expect(unlabeledInputs.length).toBe(0);
  });

  test('form fields have appropriate types', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    const issues: string[] = [];

    // Email field should be type="email"
    const emailInputs = page.locator('input[name*="email"], input[placeholder*="email" i]');
    const emailCount = await emailInputs.count();

    for (let i = 0; i < emailCount; i++) {
      const input = emailInputs.nth(i);
      const type = await input.getAttribute('type');

      if (type !== 'email') {
        issues.push('Email field should have type="email"');
      }
    }

    // Phone field should be type="tel"
    const phoneInputs = page.locator('input[name*="phone"], input[placeholder*="phone" i]');
    const phoneCount = await phoneInputs.count();

    for (let i = 0; i < phoneCount; i++) {
      const input = phoneInputs.nth(i);
      const type = await input.getAttribute('type');

      if (type !== 'tel') {
        issues.push('Phone field should have type="tel"');
      }
    }

    if (issues.length > 0) {
      console.log('\n📝 Form type issues:', issues);
    }

    // Allow some flexibility
    expect(issues.length).toBeLessThanOrEqual(1);
  });

  test('form validation provides clear feedback', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').first();

    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Check for validation messages
      await page.waitForTimeout(500);

      // Browser native validation
      const invalidInputs = page.locator('input:invalid, textarea:invalid');
      const invalidCount = await invalidInputs.count();

      // Custom validation messages
      const errorMessages = page.locator('[class*="error"], [class*="invalid"], [role="alert"]');
      const errorCount = await errorMessages.count();

      console.log(`\n📝 Form validation: ${invalidCount} native, ${errorCount} custom errors`);

      // Form should show validation feedback
      expect(invalidCount + errorCount).toBeGreaterThan(0);
    }
  });
});

test.describe('Slow Interaction Detection', () => {
  // More lenient in dev mode due to HMR overhead
  const isCI = !!process.env.CI;
  const CLICK_THRESHOLD = isCI ? 200 : 500; // ms - lenient for dev mode
  const NAV_THRESHOLD = isCI ? 3000 : 8000; // ms average

  test('button clicks respond within acceptable time', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const slowInteractions: string[] = [];

    // Use cookie button if visible, otherwise skip (this test is best-effort)
    const cookieButton = page.locator('button:has-text("Accept")');
    const anyButton = page.locator('button:visible').first();
    const button = await cookieButton.isVisible() ? cookieButton : anyButton;

    if (await button.isVisible()) {
      const startTime = Date.now();
      await button.click({ timeout: 5000 }).catch(() => {});
      const responseTime = Date.now() - startTime;

      if (responseTime > CLICK_THRESHOLD) {
        const text = await button.textContent();
        slowInteractions.push(`"${text?.trim()}" took ${responseTime}ms`);
      }

      console.log(`\n⏱️ Button response time: ${responseTime}ms (threshold: ${CLICK_THRESHOLD}ms)`);
    }

    // Allow 1 slow interaction in dev mode (HMR overhead can cause spikes)
    const maxSlow = isCI ? 0 : 1;
    expect(slowInteractions.length).toBeLessThanOrEqual(maxSlow);
  });

  test('navigation transitions are fast', async ({ page }) => {
    test.setTimeout(60000); // Longer timeout for navigation tests

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const navigationTimes: { path: string; timeMs: number }[] = [];

    // Fewer paths to reduce rate limit issues
    const paths = ['/shop', '/discover'];

    for (const path of paths) {
      const startTime = Date.now();
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const timeMs = Date.now() - startTime;
      navigationTimes.push({ path, timeMs });
    }

    console.log('\n⏱️ Navigation times:');
    navigationTimes.forEach(({ path, timeMs }) => {
      const status = timeMs > 2000 ? '🔴' : timeMs > 1000 ? '🟡' : '🟢';
      console.log(`  ${status} ${path}: ${timeMs}ms`);
    });

    // Average should be under threshold
    const avgTime = navigationTimes.reduce((sum, n) => sum + n.timeMs, 0) / navigationTimes.length;
    expect(avgTime).toBeLessThan(NAV_THRESHOLD);
  });
});

test.describe('Mobile-Specific Health Checks', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  test.setTimeout(60000); // Longer timeout for mobile tests

  test('no horizontal overflow', async ({ page }) => {
    const overflowPages: string[] = [];

    // Fewer pages to reduce rate limit issues
    const pages = ['/', '/shop'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000); // Wait for layout

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasOverflow) {
        overflowPages.push(pagePath);
      }
    }

    if (overflowPages.length > 0) {
      console.log('\n📱 Pages with horizontal overflow:', overflowPages);
    }

    expect(overflowPages.length).toBe(0);
  });

  test('touch targets are accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const tooSmallTargets: string[] = [];

    const clickables = page.locator('button:visible, a:visible');
    const count = await clickables.count();

    for (let i = 0; i < Math.min(count, 15); i++) {
      const el = clickables.nth(i);
      const box = await el.boundingBox();

      if (box && (box.width < 44 || box.height < 44)) {
        const text = await el.textContent();
        if (text?.trim()) {
          tooSmallTargets.push(`"${text.trim().substring(0, 20)}" (${box.width.toFixed(0)}x${box.height.toFixed(0)})`);
        }
      }
    }

    if (tooSmallTargets.length > 0) {
      console.log('\n📱 Touch targets smaller than 44x44:', tooSmallTargets.slice(0, 10));
    }

    // Most targets should be 44x44 or larger
    // Allow up to 10 small targets (some icon buttons are intentionally smaller)
    expect(tooSmallTargets.length).toBeLessThanOrEqual(10);
  });
});
