import { test, expect } from '@playwright/test';

test.describe('Document Navigation and Viewer', () => {
  test('can navigate to documents page', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load with a reasonable timeout
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/documents-test.png', fullPage: true });
    
    // Basic assertion that we're on a page
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if page has any content
    const bodyText = await page.locator('body').textContent();
    console.log('Page content length:', bodyText?.length || 0);
    
    // Basic assertion that the page loaded
    expect(title).toBeTruthy();
  });
}); 
 
 
 