import { test as base, expect } from '@playwright/test';

// Extend the base test with custom fixtures
export const test = base.extend({
  // Custom page fixture with enhanced error handling
  page: async ({ page }, use) => {
    // Set up page event listeners for better debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Browser Error: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      console.log(`Page Error: ${error.message}`);
    });

    page.on('requestfailed', request => {
      console.log(`Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
    });

    await use(page);
  },
});

// Global test configuration
test.beforeEach(async ({ page }) => {
  // Set default timeout for all tests
  test.setTimeout(60000);
  
  // Set up common page settings
  await page.setViewportSize({ width: 1280, height: 720 });
  
  // Add custom headers if needed
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  });
});

// Global test teardown
test.afterEach(async ({ page }) => {
  // Take screenshot on failure
  if (test.info().status === 'failed') {
    await page.screenshot({ 
      path: `test-results/screenshot-${test.info().title}-${Date.now()}.png`,
      fullPage: true 
    });
  }
});

// Custom matchers for better assertions
expect.extend({
  async toBeVisibleInViewport(locator) {
    const isVisible = await locator.isVisible();
    const isInViewport = await locator.evaluate((el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return rect.top >= 0 && rect.left >= 0 && 
             rect.bottom <= window.innerHeight && 
             rect.right <= window.innerWidth;
    });
    
    if (isVisible && isInViewport) {
      return {
        message: () => `Expected element to be visible in viewport`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected element to be visible in viewport, but it was not`,
        pass: false,
      };
    }
  },
});

export { expect };
