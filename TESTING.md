# Testing Guide

## Overview

Full Uproar uses a comprehensive testing strategy including E2E tests with Playwright, unit tests, and API integration tests.

## E2E Testing with Playwright

### Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers (first time only)
npx playwright install

# Run all tests
npm test

# Run tests in UI mode (recommended for development)
npm run test:ui

# Debug tests
npm run test:debug

# Generate test code by recording actions
npm run test:codegen

# View test report
npm run test:report
```

### Test Structure

```
tests/
├── e2e/
│   ├── fixtures/
│   │   └── test-base.ts      # Common test utilities
│   ├── home.spec.ts          # Homepage tests
│   ├── shopping-flow.spec.ts # Shopping cart tests
│   ├── product-pages.spec.ts # Product listing tests
│   ├── admin.spec.ts         # Admin dashboard tests
│   └── accessibility.spec.ts # Accessibility tests
```

### Writing Tests

1. **Use the test base fixture** for common utilities:
```typescript
import { test, expect, helpers } from './fixtures/test-base';

test('should do something', async ({ page }) => {
  await helpers.navigateTo(page, '/');
  // Your test code
});
```

2. **Follow the Page Object pattern** for complex pages:
```typescript
class GamePage {
  constructor(private page: Page) {}
  
  async addToCart() {
    await this.page.click('button:has-text("Add to Cart")');
  }
}
```

3. **Use data-testid attributes** for reliable selectors:
```typescript
// In your component
<button data-testid="add-to-cart">Add to Cart</button>

// In your test
await page.click('[data-testid="add-to-cart"]');
```

### Best Practices

1. **Test user flows, not implementation details**
   - Focus on what users can see and do
   - Don't test internal state or component props

2. **Keep tests independent**
   - Each test should be able to run in isolation
   - Use `beforeEach` for common setup

3. **Use meaningful test descriptions**
   ```typescript
   test('should display error when adding out-of-stock item to cart', async ({ page }) => {
     // Test implementation
   });
   ```

4. **Handle dynamic content**
   ```typescript
   // Wait for content to load
   await page.waitForSelector('.product-list');
   
   // Wait for network idle
   await page.waitForLoadState('networkidle');
   ```

5. **Test accessibility**
   - Use the included accessibility tests
   - Add aria-labels for interactive elements
   - Ensure keyboard navigation works

### Running Tests in CI

Tests automatically run on GitHub Actions for:
- Push to main or develop branches
- Pull requests

Test reports are uploaded as artifacts and can be downloaded from the Actions tab.

### Debugging Failed Tests

1. **Use the Playwright UI**
   ```bash
   npm run test:ui
   ```

2. **Debug a specific test**
   ```bash
   npm run test:debug tests/e2e/shopping-flow.spec.ts
   ```

3. **View traces for failed tests**
   - Traces are automatically captured on failure
   - View them in the test report

4. **Use Playwright Inspector**
   ```bash
   npx playwright test --debug
   ```

### Environment Variables for Tests

Create a `.env.test` file for test-specific environment variables:

```env
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
TEST_ADMIN_AUTH=true
```

### Common Issues and Solutions

1. **Tests timing out**
   - Increase timeout in playwright.config.ts
   - Use `waitForSelector` instead of fixed waits

2. **Flaky tests**
   - Add proper wait conditions
   - Use `waitForLoadState('networkidle')`
   - Avoid hardcoded delays

3. **Authentication in tests**
   - Mock authentication for faster tests
   - Use test accounts for real auth flows

## Running Specific Test Suites

```bash
# Run only shopping flow tests
npx playwright test shopping-flow

# Run tests in headed mode
npx playwright test --headed

# Run tests in a specific browser
npx playwright test --project=chromium

# Run tests matching a pattern
npx playwright test -g "add to cart"
```

## Continuous Integration

The GitHub Actions workflow:
1. Installs dependencies
2. Installs Playwright browsers
3. Runs all E2E tests
4. Uploads test reports as artifacts

## Future Improvements

- [ ] Add visual regression testing
- [ ] Implement API mocking for faster tests
- [ ] Add performance testing
- [ ] Create more granular test suites
- [ ] Add test coverage reporting