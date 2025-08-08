import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
  test('should load the app', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads (should redirect to login or show some content)
    await expect(page.locator('body')).toBeVisible();
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/health-check.png', fullPage: true });
    
    // Log the current URL
    console.log('Current URL:', page.url());
    
    // Check if we're on login page or dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    } else if (currentUrl.includes('/dashboard')) {
      await expect(page.locator('body')).not.toHaveText('Loading...');
    }
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/login');
    
    // Verify login page loads
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    
    // Check if there are any navigation links
    const links = page.locator('a[href]');
    const linkCount = await links.count();
    
    console.log(`Found ${linkCount} links on the page`);
    
    // Should have at least some links (like sign up, forgot password, etc.)
    expect(linkCount).toBeGreaterThan(0);
  });
}); 

test.describe('Health Check', () => {
  test('should load the app', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads (should redirect to login or show some content)
    await expect(page.locator('body')).toBeVisible();
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/health-check.png', fullPage: true });
    
    // Log the current URL
    console.log('Current URL:', page.url());
    
    // Check if we're on login page or dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    } else if (currentUrl.includes('/dashboard')) {
      await expect(page.locator('body')).not.toHaveText('Loading...');
    }
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/login');
    
    // Verify login page loads
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    
    // Check if there are any navigation links
    const links = page.locator('a[href]');
    const linkCount = await links.count();
    
    console.log(`Found ${linkCount} links on the page`);
    
    // Should have at least some links (like sign up, forgot password, etc.)
    expect(linkCount).toBeGreaterThan(0);
  });
}); 
 
 
 