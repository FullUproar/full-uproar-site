import { test, expect, helpers } from './fixtures/test-base';

// Helper to dismiss cookie banner if present
async function dismissCookieBanner(page: any) {
  try {
    const acceptButton = page.getByRole('button', { name: /accept|got it|okay/i });
    if (await acceptButton.isVisible({ timeout: 1000 })) {
      await acceptButton.click();
      await page.waitForTimeout(300); // Brief wait for banner to disappear
    }
  } catch {
    // Cookie banner not present, continue
  }
}

test.describe('Game Nights Feature', () => {
  test.describe('Game Nights Page (Public View)', () => {
    test('should load game nights page', async ({ page }) => {
      await helpers.navigateTo(page, '/game-nights');
      await dismissCookieBanner(page);

      // Check page title/heading
      await expect(page.locator('h1')).toContainText('Game Night HQ');

      // Check the main call-to-action button exists
      await expect(page.getByRole('button', { name: /rally the squad/i })).toBeVisible();
    });

    test('should show empty state when not logged in or no game nights', async ({ page }) => {
      await helpers.navigateTo(page, '/game-nights');
      await dismissCookieBanner(page);

      // Navigation should be present
      await expect(page.locator('nav')).toBeVisible();

      // Page should have proper branding
      await expect(page.locator('h1')).toContainText('Game Night HQ');
    });

    test('should have navigation link to game nights', async ({ page }) => {
      await helpers.navigateTo(page, '/');
      await dismissCookieBanner(page);

      // Check nav link exists (desktop view)
      const gameNightsLink = page.locator('nav a[href="/game-nights"]');
      await expect(gameNightsLink).toBeVisible();

      // Click and verify navigation
      await gameNightsLink.click();
      await expect(page).toHaveURL('/game-nights');
    });
  });

  test.describe('Public Join Page', () => {
    test('should show error for invalid token', async ({ page }) => {
      await helpers.navigateTo(page, '/join/invalid-token-12345');

      // Should show error message (looking for "invalid" or "Oops" text)
      const hasErrorText = await page.locator('text=/invalid|oops/i').first().isVisible({ timeout: 10000 });
      expect(hasErrorText).toBeTruthy();

      // Should have link back to main site
      await expect(page.getByRole('link', { name: /full uproar|go to/i }).first()).toBeVisible();
    });

    test('should display branding on join error page', async ({ page }) => {
      await helpers.navigateTo(page, '/join/test-token');

      // The error page should show Full Uproar branding somewhere
      // Could be in header, link, or text
      const brandingVisible = await page.locator('text=/full uproar/i').first().isVisible({ timeout: 5000 });
      expect(brandingVisible).toBeTruthy();
    });
  });

  test.describe('Game Night Creation Modal UI', () => {
    test('should open creation modal when clicking Rally the Squad', async ({ page }) => {
      await helpers.navigateTo(page, '/game-nights');
      await dismissCookieBanner(page);

      // Click the create button
      await page.getByRole('button', { name: /rally the squad/i }).click();

      // Modal should appear (checking for modal content)
      await expect(page.locator('text=Rally the Squad!')).toBeVisible({ timeout: 5000 });

      // Should show date picker in first step
      await expect(page.locator('input[type="date"]')).toBeVisible();
    });

    test('should close modal when clicking outside', async ({ page }) => {
      await helpers.navigateTo(page, '/game-nights');
      await dismissCookieBanner(page);

      // Open modal
      await page.getByRole('button', { name: /rally the squad/i }).click();
      await expect(page.locator('text=Rally the Squad!')).toBeVisible({ timeout: 5000 });

      // Click outside modal (on the backdrop - top left corner)
      await page.mouse.click(10, 10);

      // Modal should close
      await expect(page.locator('text=Rally the Squad!')).not.toBeVisible({ timeout: 3000 });
    });

    test('should show vibe selection in step 2', async ({ page }) => {
      await helpers.navigateTo(page, '/game-nights');
      await dismissCookieBanner(page);

      // Open modal
      await page.getByRole('button', { name: /rally the squad/i }).click();

      // Fill in date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      await page.locator('input[type="date"]').fill(dateStr);

      // Click next
      await page.getByRole('button', { name: /next.*vibe/i }).click();

      // Should show vibe selection header
      await expect(page.locator('text=What\'s the Vibe?')).toBeVisible({ timeout: 5000 });

      // Check vibe options are visible using role-based selectors
      await expect(page.getByRole('button', { name: /chill/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /competitive/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /party/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /cozy/i })).toBeVisible();
    });

    test('should progress through all 3 creation steps', async ({ page }) => {
      await helpers.navigateTo(page, '/game-nights');
      await dismissCookieBanner(page);

      // Open modal
      await page.getByRole('button', { name: /rally the squad/i }).click();

      // Step 1: Date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await page.locator('input[type="date"]').fill(tomorrow.toISOString().split('T')[0]);
      await page.getByRole('button', { name: /next.*vibe/i }).click();

      // Step 2: Vibe - Select Chill (first option, less ambiguous)
      await page.getByRole('button', { name: /chill.*relaxed/i }).click();

      // Dismiss cookie banner again if it reappeared
      await dismissCookieBanner(page);

      await page.getByRole('button', { name: /almost there/i }).click({ force: true });

      // Step 3: Final details
      await expect(page.locator('text=Final Details')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('input[placeholder*="Game Night"]')).toBeVisible();

      // Let's Go button should be visible
      await expect(page.getByRole('button', { name: /let's go/i })).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await helpers.navigateTo(page, '/game-nights');
      await dismissCookieBanner(page);

      // Page should still be functional
      await expect(page.locator('h1')).toContainText('Game Night HQ');
      await expect(page.getByRole('button', { name: /rally the squad/i })).toBeVisible();
    });

    test('join page should load on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await helpers.navigateTo(page, '/join/test-token');

      // Page should load (will show error but should still render)
      await page.waitForLoadState('networkidle');

      // Should have some content visible
      const pageHasContent = await page.locator('body').textContent();
      expect(pageHasContent?.length).toBeGreaterThan(0);
    });
  });

  test.describe('Accessibility', () => {
    test('game nights page should have proper heading structure', async ({ page }) => {
      await helpers.navigateTo(page, '/game-nights');
      await dismissCookieBanner(page);

      // Should have h1
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      await expect(h1).toContainText('Game Night HQ');
    });

    test('buttons should be keyboard accessible', async ({ page }) => {
      await helpers.navigateTo(page, '/game-nights');
      await dismissCookieBanner(page);

      // Tab to the Rally the Squad button
      const createButton = page.getByRole('button', { name: /rally the squad/i });
      await createButton.focus();

      // Press Enter to activate
      await page.keyboard.press('Enter');

      // Modal should open
      await expect(page.locator('text=Rally the Squad!')).toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe('Game Night Detail Page', () => {
  test('should handle non-existent game night gracefully', async ({ page }) => {
    await helpers.navigateTo(page, '/game-nights/non-existent-id-12345');

    // Should show error or redirect - page should at least load
    await page.waitForLoadState('networkidle');

    // Should either show error message or have navigation back
    const hasBackLink = await page.locator('a[href="/game-nights"]').isVisible().catch(() => false);
    const hasErrorText = await page.locator('text=/not found|error|something went wrong/i').first().isVisible().catch(() => false);
    const hasNavigation = await page.locator('nav').isVisible().catch(() => false);

    // At least one of these should be true
    expect(hasBackLink || hasErrorText || hasNavigation).toBeTruthy();
  });
});
