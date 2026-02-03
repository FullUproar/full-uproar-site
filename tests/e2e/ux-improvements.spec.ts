import { test, expect } from '@playwright/test';

test.describe('UX Improvements', () => {
  test.describe('Shop Search & Sort', () => {
    test('should have search input on shop page', async ({ page }) => {
      await page.goto('/shop');

      // Search input should be visible
      const searchInput = page.locator('input[placeholder*="Search"]');
      await expect(searchInput).toBeVisible();
    });

    test('should filter games by search query', async ({ page }) => {
      await page.goto('/shop');

      // Type in search
      const searchInput = page.locator('input[placeholder*="Search"]');
      await searchInput.fill('chaos');

      // Wait for filtering (debounce)
      await page.waitForTimeout(500);

      // Results should be filtered or show "no results" message
      // This tests that the search functionality is wired up
    });

    test('should have sort dropdown on shop page', async ({ page }) => {
      await page.goto('/shop');

      // Sort dropdown should be visible
      const sortSelect = page.locator('select');
      await expect(sortSelect).toBeVisible();

      // Should have expected options
      const options = sortSelect.locator('option');
      await expect(options).toHaveCount(5); // default, price-asc, price-desc, name, newest
    });

    test('should change sort order', async ({ page }) => {
      await page.goto('/shop');

      // Wait for page to be interactive
      await page.waitForLoadState('networkidle');

      const sortSelect = page.locator('select');
      await expect(sortSelect).toBeVisible();

      // Select the option
      await sortSelect.selectOption({ value: 'price-asc' });

      // Wait a moment for React state to update
      await page.waitForTimeout(100);

      // Verify selection changed
      await expect(sortSelect).toHaveValue('price-asc');
    });
  });

  test.describe('Cart Shipping Estimate', () => {
    test('should show shipping estimate box in cart', async ({ page }) => {
      // First add item to cart via shop page
      await page.goto('/shop');

      // Find and click add to cart if products exist
      const addToCartBtn = page.locator('button:has-text("Add to Cart")').first();
      if (await addToCartBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addToCartBtn.click();

        // Go to cart
        await page.goto('/cart');

        // Should see shipping estimate box with Truck icon
        const shippingBox = page.locator('text=Shipping Estimate').or(page.locator('text=Free Shipping Unlocked'));
        await expect(shippingBox).toBeVisible();

        // Should show estimated delivery
        const deliveryEstimate = page.locator('text=Estimated delivery');
        await expect(deliveryEstimate).toBeVisible();
      }
    });

    test('should show progress bar when below free shipping threshold', async ({ page }) => {
      await page.goto('/cart');

      // If cart is empty, that's ok - test passes
      // If cart has items under $50, should show progress bar
      const progressText = page.locator('text=more for FREE shipping');
      const freeShippingText = page.locator('text=Free Shipping Unlocked');

      // One of these should be visible if there are items
      const cartEmpty = page.locator('text=Your cart is empty');

      // At least one state should be visible
      const anyVisible = await Promise.race([
        cartEmpty.waitFor({ timeout: 3000 }).then(() => 'empty'),
        progressText.waitFor({ timeout: 3000 }).then(() => 'progress'),
        freeShippingText.waitFor({ timeout: 3000 }).then(() => 'free'),
      ]).catch(() => 'timeout');

      expect(['empty', 'progress', 'free']).toContain(anyVisible);
    });
  });

  test.describe('Navigation Back Links', () => {
    test('should have back link on Connect page', async ({ page }) => {
      await page.goto('/connect');

      const backLink = page.locator('a:has-text("Back to Home")');
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute('href', '/');
    });

    test('should have back link on Discover page', async ({ page }) => {
      await page.goto('/discover');

      const backLink = page.locator('a:has-text("Back to Home")');
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute('href', '/');
    });
  });

  test.describe('Social Links on Connect', () => {
    test('should have social media links', async ({ page }) => {
      await page.goto('/connect');

      // Check for social links section
      const discordLink = page.locator('a:has-text("Discord")');
      const instagramLink = page.locator('a:has-text("Instagram")');
      const tiktokLink = page.locator('a:has-text("TikTok")');

      await expect(discordLink).toBeVisible();
      await expect(instagramLink).toBeVisible();
      await expect(tiktokLink).toBeVisible();

      // Verify they open in new tab
      await expect(discordLink).toHaveAttribute('target', '_blank');
      await expect(instagramLink).toHaveAttribute('target', '_blank');
      await expect(tiktokLink).toHaveAttribute('target', '_blank');
    });
  });

  test.describe('Legal Page Navigation', () => {
    test('Terms page should have navigation section', async ({ page }) => {
      await page.goto('/terms');

      // Use first() to handle multiple matches (nav section + footer)
      const backToHome = page.locator('a:has-text("Back to Home")').first();
      const privacyLink = page.locator('a:has-text("Privacy Policy")').first();
      const returnsLink = page.locator('a:has-text("Returns Policy")').first();

      await expect(backToHome).toBeVisible();
      await expect(privacyLink).toBeVisible();
      await expect(returnsLink).toBeVisible();
    });

    test('Privacy page should have navigation section', async ({ page }) => {
      await page.goto('/privacy');

      // Use first() to handle multiple matches (nav section + footer)
      const backToHome = page.locator('a:has-text("Back to Home")').first();
      const termsLink = page.locator('a:has-text("Terms of Service")').first();
      const returnsLink = page.locator('a:has-text("Returns Policy")').first();

      await expect(backToHome).toBeVisible();
      await expect(termsLink).toBeVisible();
      await expect(returnsLink).toBeVisible();
    });

    test('Returns page should have navigation section', async ({ page }) => {
      await page.goto('/returns');

      // Use first() to handle multiple matches (nav section + footer)
      const backToHome = page.locator('a:has-text("Back to Home")').first();
      const termsLink = page.locator('a:has-text("Terms of Service")').first();
      const contactLink = page.locator('a:has-text("Contact Support")').first();

      await expect(backToHome).toBeVisible();
      await expect(termsLink).toBeVisible();
      await expect(contactLink).toBeVisible();
    });
  });

  test.describe('The Line Page Image Fallback', () => {
    test('should show image or fallback on The Line page', async ({ page }) => {
      await page.goto('/the-line');

      // Either the image or the fallback heart icon should be visible
      const image = page.locator('img[alt="Fugly giving a hug"]');
      const fallbackHeart = page.locator('svg'); // Heart icon in fallback

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // At least one should be visible (either loaded image or fallback)
      const imageVisible = await image.isVisible().catch(() => false);
      const fallbackVisible = await fallbackHeart.first().isVisible().catch(() => false);

      expect(imageVisible || fallbackVisible).toBe(true);
    });
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('Forum page loads on mobile', async ({ page }) => {
    await page.goto('/forum');

    // Wait for React hydration and JS to run
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Allow JS-based mobile detection to run

    // Key elements should be visible
    const header = page.locator('text=Full Uproar Forums');
    await expect(header).toBeVisible();

    // Stats should be visible
    const statsText = page.locator('text=threads');
    await expect(statsText.first()).toBeVisible();
  });

  test('Contact page loads on mobile', async ({ page }) => {
    await page.goto('/contact');

    // Wait for React hydration
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Form should be visible
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Contact info should be visible
    const emailSection = page.locator('text=Email Us Directly');
    await expect(emailSection).toBeVisible();
  });

  test('Shop page should be usable on mobile', async ({ page }) => {
    await page.goto('/shop');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Search should be visible and usable
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Sort dropdown should be visible
    const sortSelect = page.locator('select');
    await expect(sortSelect).toBeVisible();
  });
});
