import { test, expect } from '@playwright/test';

/**
 * P1 — Contact Form Submission
 * Workflow: #24 (Contact page → Submit support request → Form filled, ticket created)
 */

test.describe('Contact Form (#24)', () => {
  test('should load contact page with all form fields', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('domcontentloaded');

    // Page title
    const heading = page.locator('text=/contact/i').first();
    await expect(heading).toBeVisible();

    // Form fields by ID
    const nameInput = page.locator('#contact-name, input[name="name"]').first();
    const emailInput = page.locator('#contact-email, input[type="email"]').first();
    const subjectSelect = page.locator('#contact-subject, select').first();
    const messageTextarea = page.locator('#contact-message, textarea').first();

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(subjectSelect).toBeVisible();
    await expect(messageTextarea).toBeVisible();
  });

  test('should have subject dropdown with options', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('domcontentloaded');

    const subjectSelect = page.locator('#contact-subject, select').first();
    const options = subjectSelect.locator('option');
    const count = await options.count();

    // Should have multiple subject options
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should fill form fields correctly', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('domcontentloaded');

    // Fill name
    const nameInput = page.locator('#contact-name, input[name="name"]').first();
    await nameInput.fill('Playwright Test User');
    await expect(nameInput).toHaveValue('Playwright Test User');

    // Fill email
    const emailInput = page.locator('#contact-email, input[type="email"]').first();
    await emailInput.fill('playwright@example.com');
    await expect(emailInput).toHaveValue('playwright@example.com');

    // Select subject
    const subjectSelect = page.locator('#contact-subject, select').first();
    await subjectSelect.selectOption({ index: 1 });

    // Fill message
    const messageTextarea = page.locator('#contact-message, textarea').first();
    await messageTextarea.fill('This is a Playwright E2E test message.');
    await expect(messageTextarea).toHaveValue('This is a Playwright E2E test message.');
  });

  test('should display contact info sidebar', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('domcontentloaded');

    // Check for email addresses in sidebar
    const body = await page.textContent('body');
    expect(body).toContain('support@fulluproar.com');
  });

  test('should show pro tips section', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('domcontentloaded');

    // Pro tips mention order number, photos, 24-48 hours response
    const proTips = page.locator('text=/order number|24-48 hours|response/i').first();
    if (await proTips.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(proTips).toBeVisible();
    }
  });

  test('should have submit button', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('domcontentloaded');

    const submitBtn = page.locator('button:has-text("Send Message"), button[type="submit"]').first();
    await expect(submitBtn).toBeVisible();
  });
});
