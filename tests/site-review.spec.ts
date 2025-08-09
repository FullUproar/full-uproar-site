import { test, expect, Page } from '@playwright/test';

test.describe('Full Uproar Site Review', () => {
  test('Complete site walkthrough and screenshot capture', async ({ page }) => {
    // Set viewport for desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('🚀 Starting Full Uproar site review...\n');
    
    // 1. Homepage
    console.log('📍 Visiting Homepage...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/01-homepage.png', fullPage: true });
    
    // Check for key elements
    const heroTitle = await page.locator('h1').first().textContent();
    console.log(`  ✓ Hero title: ${heroTitle}`);
    
    // Check featured games section
    const featuredGame = await page.locator('text=/PRE-ORDER MADNESS/i').isVisible();
    console.log(`  ✓ Featured game section: ${featuredGame ? 'Present' : 'Missing'}`);
    
    // Check testimonials
    const testimonial = await page.locator('text=/".*" -/').first().isVisible().catch(() => false);
    console.log(`  ✓ Testimonials: ${testimonial ? 'Present' : 'Missing'}`);
    
    // 2. Games Page
    console.log('\n📍 Visiting Games page...');
    await page.click('text=Games');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/02-games.png', fullPage: true });
    
    const gameCards = await page.locator('[class*="game-card"], [style*="border-radius"][style*="background"]').count();
    console.log(`  ✓ Game cards found: ${gameCards}`);
    
    // 3. Cart Test
    console.log('\n📍 Testing Cart functionality...');
    
    // Try to add to cart
    const addToCartBtn = await page.locator('button:has-text("Add to Cart"), button:has-text("ADD TO CART")').first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
      console.log('  ✓ Added item to cart');
      await page.waitForTimeout(1000);
      
      // Check for toast notification
      const toast = await page.locator('text=/added to cart/i').isVisible().catch(() => false);
      console.log(`  ✓ Toast notification: ${toast ? 'Shown' : 'Not shown'}`);
    }
    
    // Open cart
    const cartButton = await page.locator('[aria-label*="cart" i], button:has-text("Cart"), [class*="cart"]').first();
    if (await cartButton.isVisible()) {
      await cartButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/03-cart.png' });
      console.log('  ✓ Cart opened');
      
      // Close cart if modal
      await page.keyboard.press('Escape');
    }
    
    // 4. Checkout Page
    console.log('\n📍 Visiting Checkout page...');
    await page.goto('http://localhost:3000/checkout');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/04-checkout.png', fullPage: true });
    
    const checkoutForm = await page.locator('input[type="email"]').isVisible();
    console.log(`  ✓ Checkout form: ${checkoutForm ? 'Present' : 'Missing'}`);
    
    // 5. Legal Pages
    console.log('\n📍 Checking Legal pages...');
    
    await page.goto('http://localhost:3000/privacy');
    await page.waitForLoadState('networkidle');
    const privacyTitle = await page.locator('h1:has-text("Privacy")').isVisible();
    console.log(`  ✓ Privacy Policy: ${privacyTitle ? 'Present' : 'Missing'}`);
    await page.screenshot({ path: 'tests/screenshots/05-privacy.png' });
    
    await page.goto('http://localhost:3000/terms');
    await page.waitForLoadState('networkidle');
    const termsTitle = await page.locator('h1:has-text("Terms")').isVisible();
    console.log(`  ✓ Terms of Service: ${termsTitle ? 'Present' : 'Missing'}`);
    
    await page.goto('http://localhost:3000/returns');
    await page.waitForLoadState('networkidle');
    const returnsTitle = await page.locator('h1:has-text("Returns")').isVisible();
    console.log(`  ✓ Returns Policy: ${returnsTitle ? 'Present' : 'Missing'}`);
    
    // 6. Forum (Coming Soon)
    console.log('\n📍 Checking Forum page...');
    await page.goto('http://localhost:3000/forum');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/06-forum.png' });
    
    const forumTitle = await page.locator('h1').first().textContent();
    console.log(`  ✓ Forum page: ${forumTitle}`);
    
    // 7. 404 Page
    console.log('\n📍 Testing 404 page...');
    await page.goto('http://localhost:3000/this-page-does-not-exist');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/07-404.png' });
    
    const notFoundText = await page.locator('text=/404|not found|fuglied/i').isVisible();
    console.log(`  ✓ 404 page: ${notFoundText ? 'Branded correctly' : 'Generic or missing'}`);
    
    // 8. Mobile View
    console.log('\n📍 Testing Mobile responsiveness...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/08-mobile-home.png', fullPage: true });
    console.log('  ✓ Mobile screenshot captured');
    
    // 9. Test Mode Banner
    console.log('\n📍 Checking for Test Mode indicators...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3000');
    
    const testBanner = await page.locator('text=/test mode|test stripe/i').isVisible().catch(() => false);
    console.log(`  ✓ Test mode banner: ${testBanner ? 'VISIBLE (Should be hidden in production!)' : 'Hidden'}`);
    
    // 10. Admin Panel Access
    console.log('\n📍 Testing Admin panel security...');
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login or show access denied
    const adminBlocked = await page.url().includes('sign-in') || 
                         await page.locator('text=/access denied|unauthorized|sign in/i').isVisible().catch(() => false);
    console.log(`  ✓ Admin panel: ${adminBlocked ? 'Properly secured' : 'EXPOSED (Security issue!)'}`);
    
    console.log('\n✅ Site review complete! Check screenshots in tests/screenshots/');
    
    // Summary of issues
    console.log('\n📋 SUMMARY:');
    console.log('===========');
    
    if (!featuredGame) console.log('  ⚠️  Featured games section missing');
    if (!testimonial) console.log('  ⚠️  Testimonials not showing');
    if (testBanner) console.log('  ⚠️  Test mode banner visible (hide for production)');
    if (!adminBlocked) console.log('  🚨 Admin panel may be exposed!');
    if (gameCards === 0) console.log('  ⚠️  No games displayed on games page');
    if (!checkoutForm) console.log('  ⚠️  Checkout form not loading');
    
    console.log('\nReview "tests/screenshots/" folder to see visual state of each page.');
  });
});