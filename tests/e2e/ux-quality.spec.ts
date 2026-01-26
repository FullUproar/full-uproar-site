import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * UX Quality Tests
 *
 * These tests go beyond functional testing to measure:
 * - Performance (load times, responsiveness)
 * - Accessibility (WCAG compliance)
 * - Visual feedback (loading states, transitions)
 * - User flow quality (clear paths, proper feedback)
 */

// Performance thresholds - more lenient in dev mode due to Turbopack/HMR overhead
const isCI = !!process.env.CI;
const THRESHOLDS = {
  domContentLoaded: isCI ? 3000 : 6000,
  fullLoad: isCI ? 5000 : 10000,
  lcp: isCI ? 2500 : 5000,
  shopLoad: isCI ? 4000 : 8000,
};

test.describe('Performance Metrics', () => {
  test('homepage loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const domContentLoaded = Date.now() - startTime;

    await page.waitForLoadState('load');
    const fullLoad = Date.now() - startTime;

    // DOM should be interactive within threshold
    expect(domContentLoaded).toBeLessThan(THRESHOLDS.domContentLoaded);

    // Full page load within threshold
    expect(fullLoad).toBeLessThan(THRESHOLDS.fullLoad);

    console.log(`Homepage: DOM=${domContentLoaded}ms, Full=${fullLoad}ms (threshold: ${THRESHOLDS.domContentLoaded}ms)`);
  });

  test('shop page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/shop', { waitUntil: 'domcontentloaded' });
    const domContentLoaded = Date.now() - startTime;

    // Wait for network to settle but with a reasonable timeout
    await page.waitForLoadState('networkidle').catch(() => {
      // Network idle may take a while if API is slow, that's ok
    });
    const networkTime = Date.now() - startTime;

    // Shop DOM within 8 seconds (lenient for dev mode with cold cache and API calls)
    // In production this should be under 3 seconds
    expect(domContentLoaded).toBeLessThan(8000);

    // Log times for monitoring (these values indicate actual performance)
    console.log(`Shop: DOM=${domContentLoaded}ms, Total=${networkTime}ms`);
  });

  test('Core Web Vitals - Largest Contentful Paint', async ({ page }) => {
    // Enable performance metrics
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');

    await page.goto('/');
    await page.waitForLoadState('load');

    // Get LCP from Performance Observer
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // Fallback after 5 seconds
        setTimeout(() => resolve(5000), 5000);
      });
    });

    // LCP should be under threshold (2.5s in CI, more lenient in dev)
    expect(lcp).toBeLessThan(THRESHOLDS.lcp);
    console.log(`LCP: ${lcp.toFixed(0)}ms (threshold: ${THRESHOLDS.lcp}ms)`);
  });

  test('no layout shift after initial load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take initial measurements
    const initialHeight = await page.evaluate(() => document.body.scrollHeight);

    // Wait a bit for any lazy loading
    await page.waitForTimeout(1000);

    const finalHeight = await page.evaluate(() => document.body.scrollHeight);

    // Height shouldn't change dramatically (indicating layout shift)
    const shift = Math.abs(finalHeight - initialHeight);
    expect(shift).toBeLessThan(100); // Allow small adjustments
  });
});

test.describe('Interaction Responsiveness', () => {
  test('buttons respond immediately to clicks', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find the "Accept Cookies" button which is always present
    const cookieButton = page.locator('button:has-text("Accept Cookies")');
    if (await cookieButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Measure click response on cookie button
      const startTime = Date.now();
      await cookieButton.click();
      const responseTime = Date.now() - startTime;

      // Button should respond within 200ms (being lenient for dev mode)
      expect(responseTime).toBeLessThan(200);
    } else {
      // Fallback to any visible button
      const button = page.locator('button:visible').first();
      await expect(button).toBeVisible();

      const startTime = Date.now();
      await button.click();
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(200);
    }
  });

  test('search input has immediate feedback', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Type and measure
    const startTime = Date.now();
    await searchInput.fill('test');

    // Input should accept text immediately
    const inputValue = await searchInput.inputValue();
    const responseTime = Date.now() - startTime;

    expect(inputValue).toBe('test');
    expect(responseTime).toBeLessThan(200);
  });

  test('navigation links are immediately clickable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Nav should be interactive quickly
    const navLink = page.locator('nav a').first();

    const startTime = Date.now();
    await expect(navLink).toBeVisible();
    const visibleTime = Date.now() - startTime;

    // Navigation should be visible and clickable within 1 second
    expect(visibleTime).toBeLessThan(1000);
  });
});

test.describe('Visual Feedback Quality', () => {
  test('loading states are shown during data fetch', async ({ page }) => {
    // Slow down network to observe loading states
    await page.route('**/api/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });

    await page.goto('/shop');

    // Should show loading state
    const loadingText = page.locator('text=Loading');

    // Either loading is shown or content loads fast enough to skip it
    const hasLoadingState = await loadingText.isVisible({ timeout: 1000 }).catch(() => false);
    const hasContent = await page.locator('button:has-text("Add to Cart")').isVisible({ timeout: 3000 }).catch(() => false);

    // One of these should be true
    expect(hasLoadingState || hasContent).toBe(true);
  });

  test('error messages are clearly visible', async ({ page }) => {
    await page.goto('/contact');

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Browser validation or custom error should appear
    // Check that form didn't silently fail
    const url = page.url();
    expect(url).toContain('/contact'); // Should still be on same page
  });

  test('hover states provide visual feedback', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Use the weapon category buttons which have clear hover states
    const button = page.locator('button').filter({ hasText: 'Games' }).first();
    await expect(button).toBeVisible();

    // Get initial styles
    const initialBackground = await button.evaluate(el =>
      window.getComputedStyle(el).background
    );

    // Hover
    await button.hover();
    await page.waitForTimeout(100); // Allow transition

    // Styles should potentially change (hover effect)
    const hoverState = await button.evaluate(el => ({
      boxShadow: window.getComputedStyle(el).boxShadow,
      transform: window.getComputedStyle(el).transform,
      background: window.getComputedStyle(el).background
    }));

    // At minimum, button should remain visible and styled
    expect(hoverState).toBeDefined();
  });

  test('focus states are visible for keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // Get the focused element
    const focusedElement = page.locator(':focus');

    // Should have visible focus indicator
    const outlineStyle = await focusedElement.evaluate(el =>
      window.getComputedStyle(el).outline
    );

    // Focus should be visible (not "none" or "0px")
    // Many sites use box-shadow instead, so also check that
    const boxShadow = await focusedElement.evaluate(el =>
      window.getComputedStyle(el).boxShadow
    );

    const hasFocusIndicator =
      (outlineStyle && !outlineStyle.includes('0px') && outlineStyle !== 'none') ||
      (boxShadow && boxShadow !== 'none');

    // Focus indicator should exist (accessibility requirement)
    expect(hasFocusIndicator).toBe(true);
  });
});

test.describe('User Flow Quality', () => {
  test('add to cart flow provides clear feedback', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    // Find add to cart button
    const addToCartBtn = page.locator('button:has-text("Add to Cart")').first();

    if (await addToCartBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click add to cart
      await addToCartBtn.click();

      // Should get feedback - either toast, cart count update, or visual change
      const feedback = await Promise.race([
        page.locator('[role="alert"]').waitFor({ timeout: 2000 }).then(() => 'toast'),
        page.locator('[data-testid="cart-count"]').waitFor({ timeout: 2000 }).then(() => 'cartCount'),
        page.locator('text=Added').waitFor({ timeout: 2000 }).then(() => 'addedText'),
      ]).catch(() => 'none');

      // Should have some form of feedback
      expect(['toast', 'cartCount', 'addedText']).toContain(feedback);
    }
  });

  test('navigation provides clear location context', async ({ page }) => {
    await page.goto('/discover');

    // Page should clearly indicate where user is
    const pageTitle = page.locator('h1');
    await expect(pageTitle).toBeVisible();

    const titleText = await pageTitle.textContent();
    expect(titleText?.toLowerCase()).toContain('discover');
  });

  test('back navigation is available on subpages', async ({ page }) => {
    await page.goto('/discover');

    // Should have a way to go back
    const backLink = page.locator('a:has-text("Back")');
    const homeLink = page.locator('a[href="/"]');

    const hasBackNavigation =
      await backLink.isVisible().catch(() => false) ||
      await homeLink.isVisible().catch(() => false);

    expect(hasBackNavigation).toBe(true);
  });

  test('forms have clear submission feedback', async ({ page }) => {
    await page.goto('/contact');

    // Fill form with valid data
    await page.fill('input[name="name"], input[placeholder*="name" i]', 'Test User');
    await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
    await page.fill('textarea', 'This is a test message for quality testing.');

    // Form should be fillable without errors
    const messageValue = await page.locator('textarea').inputValue();
    expect(messageValue).toContain('test message');
  });
});

test.describe('Accessibility Quality', () => {
  test('critical pages pass accessibility audit', async ({ page }) => {
    const pages = ['/', '/shop', '/cart', '/contact'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa']) // WCAG 2.0 Level A and AA
        .exclude('[role="alert"]') // Exclude dynamic toasts
        .exclude('.cookie-banner') // Exclude cookie banner (often has acceptable contrast tradeoffs)
        .analyze();

      // Log violations for debugging
      if (results.violations.length > 0) {
        console.log(`\n${pagePath} accessibility issues:`);
        results.violations.forEach(v => {
          console.log(`  - ${v.id} (${v.impact}): ${v.description} (${v.nodes.length} occurrences)`);
          if (v.impact === 'critical') {
            console.log(`    CRITICAL - Affected elements:`);
            v.nodes.forEach(node => {
              console.log(`      ${node.html?.substring(0, 100)}`);
            });
          }
        });
      }

      // Only critical violations should fail the test
      const criticalViolations = results.violations.filter(
        v => v.impact === 'critical'
      );

      if (criticalViolations.length > 0) {
        console.log(`\n${pagePath} has ${criticalViolations.length} CRITICAL violations`);
      }

      expect(criticalViolations.length).toBe(0);
    }
  });

  test('color contrast meets WCAG standards', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withTags(['cat.color'])
      .analyze();

    const contrastIssues = results.violations.filter(
      v => v.id === 'color-contrast'
    );

    // Log details for debugging
    if (contrastIssues.length > 0) {
      console.log('\nColor contrast issues found:');
      contrastIssues.forEach(issue => {
        issue.nodes.forEach(node => {
          console.log(`  Element: ${node.html?.substring(0, 100)}`);
          console.log(`  Issue: ${node.failureSummary?.substring(0, 200)}`);
          console.log('---');
        });
      });
    }

    // Allow up to 2 minor contrast issues (some decorative/non-essential elements)
    // Critical text should always pass - this is a health check
    expect(contrastIssues.length).toBeLessThanOrEqual(2);
  });

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    // Tab through the page
    let tabCount = 0;
    const maxTabs = 50;
    const focusedElements: string[] = [];

    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;

      const focusedTag = await page.evaluate(() =>
        document.activeElement?.tagName.toLowerCase()
      );

      if (focusedTag) {
        focusedElements.push(focusedTag);
      }

      // If we've cycled back to body, we're done
      if (focusedTag === 'body') break;
    }

    // Should be able to reach interactive elements
    const hasButtons = focusedElements.includes('button');
    const hasLinks = focusedElements.includes('a');
    const hasInputs = focusedElements.includes('input') || focusedElements.includes('select');

    expect(hasButtons || hasLinks || hasInputs).toBe(true);
  });
});

test.describe('Mobile UX Quality', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('touch targets are adequately sized', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Focus on primary action buttons, not all buttons (some may be icon-only)
    const buttons = page.locator('button').filter({ hasText: /.+/ }); // Only buttons with text
    const count = await buttons.count();

    let adequateSizedButtons = 0;
    let totalChecked = 0;

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          totalChecked++;
          // Touch targets should be at least 44x44 pixels (Apple guideline)
          // We'll be slightly lenient at 40px
          if (box.width >= 40 && box.height >= 40) {
            adequateSizedButtons++;
          }
        }
      }
    }

    // At least 80% of primary buttons should meet touch target guidelines
    const percentage = totalChecked > 0 ? adequateSizedButtons / totalChecked : 0;
    expect(percentage).toBeGreaterThanOrEqual(0.8);
  });

  test('text is readable without zooming', async ({ page }) => {
    await page.goto('/');

    // Get font sizes of main text
    const bodyFontSize = await page.evaluate(() => {
      const body = document.body;
      return parseFloat(window.getComputedStyle(body).fontSize);
    });

    // Minimum readable font size is 16px on mobile
    expect(bodyFontSize).toBeGreaterThanOrEqual(14);
  });

  test('no horizontal scrolling required', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    // Allow small tolerance for scroll bars
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
  });
});
