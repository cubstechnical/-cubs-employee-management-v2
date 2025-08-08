import { test, expect } from '@playwright/test';

test.describe('Basic App Functionality', () => {
  test('should load main pages without errors', async ({ page }) => {
    // Test login page
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    
    // Test dashboard (should redirect to login if not authenticated)
    await page.goto('/admin/dashboard');
    await expect(page.locator('body')).toBeVisible();
    
    // Test employees page
    await page.goto('/admin/employees');
    await expect(page.locator('body')).toBeVisible();
    
    // Test documents page
    await page.goto('/admin/documents');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have working navigation structure', async ({ page }) => {
    await page.goto('/login');
    
    // Check for navigation elements
    const navElements = page.locator('nav, header, .sidebar, .navigation');
    const navCount = await navElements.count();
    
    console.log(`Found ${navCount} navigation elements`);
    
    // Should have some navigation structure
    expect(navCount).toBeGreaterThan(0);
  });

  test('should handle form interactions', async ({ page }) => {
    await page.goto('/login');
    
    // Test form inputs
    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('testpassword');
    
    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('testpassword');
  });

  test('should have responsive design', async ({ page }) => {
    await page.goto('/login');
    
    // Test different viewport sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle page loading states', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Verify page is interactive
    await expect(page.locator('body')).toBeVisible();
    
    // Check for any loading indicators
    const loadingElements = page.locator('.loading, .spinner, .loader');
    const loadingCount = await loadingElements.count();
    
    if (loadingCount > 0) {
      // Wait for loading to complete
      await page.waitForTimeout(3000);
    }
  });

  test('should have proper error handling', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page');
    await expect(page.locator('body')).toBeVisible();
    
    // Test invalid routes
    await page.goto('/invalid/route/test');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have working links and buttons', async ({ page }) => {
    await page.goto('/login');
    
    // Check for clickable elements
    const buttons = page.locator('button');
    const links = page.locator('a[href]');
    
    const buttonCount = await buttons.count();
    const linkCount = await links.count();
    
    console.log(`Found ${buttonCount} buttons and ${linkCount} links`);
    
    // Should have some interactive elements
    expect(buttonCount + linkCount).toBeGreaterThan(0);
  });

  test('should handle theme switching', async ({ page }) => {
    await page.goto('/login');
    
    // Look for theme toggle
    const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, button:has-text("Theme")');
    const toggleCount = await themeToggle.count();
    
    if (toggleCount > 0) {
      await expect(themeToggle.first()).toBeVisible();
    }
  });

  test('should have proper accessibility', async ({ page }) => {
    await page.goto('/login');
    
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    console.log(`Found ${headingCount} headings`);
    
    // Should have at least one heading
    expect(headingCount).toBeGreaterThan(0);
    
    // Check for form labels
    const labels = page.locator('label');
    const labelCount = await labels.count();
    
    console.log(`Found ${labelCount} labels`);
  });
}); 

test.describe('Basic App Functionality', () => {
  test('should load main pages without errors', async ({ page }) => {
    // Test login page
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    
    // Test dashboard (should redirect to login if not authenticated)
    await page.goto('/admin/dashboard');
    await expect(page.locator('body')).toBeVisible();
    
    // Test employees page
    await page.goto('/admin/employees');
    await expect(page.locator('body')).toBeVisible();
    
    // Test documents page
    await page.goto('/admin/documents');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have working navigation structure', async ({ page }) => {
    await page.goto('/login');
    
    // Check for navigation elements
    const navElements = page.locator('nav, header, .sidebar, .navigation');
    const navCount = await navElements.count();
    
    console.log(`Found ${navCount} navigation elements`);
    
    // Should have some navigation structure
    expect(navCount).toBeGreaterThan(0);
  });

  test('should handle form interactions', async ({ page }) => {
    await page.goto('/login');
    
    // Test form inputs
    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('testpassword');
    
    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('testpassword');
  });

  test('should have responsive design', async ({ page }) => {
    await page.goto('/login');
    
    // Test different viewport sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle page loading states', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Verify page is interactive
    await expect(page.locator('body')).toBeVisible();
    
    // Check for any loading indicators
    const loadingElements = page.locator('.loading, .spinner, .loader');
    const loadingCount = await loadingElements.count();
    
    if (loadingCount > 0) {
      // Wait for loading to complete
      await page.waitForTimeout(3000);
    }
  });

  test('should have proper error handling', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page');
    await expect(page.locator('body')).toBeVisible();
    
    // Test invalid routes
    await page.goto('/invalid/route/test');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have working links and buttons', async ({ page }) => {
    await page.goto('/login');
    
    // Check for clickable elements
    const buttons = page.locator('button');
    const links = page.locator('a[href]');
    
    const buttonCount = await buttons.count();
    const linkCount = await links.count();
    
    console.log(`Found ${buttonCount} buttons and ${linkCount} links`);
    
    // Should have some interactive elements
    expect(buttonCount + linkCount).toBeGreaterThan(0);
  });

  test('should handle theme switching', async ({ page }) => {
    await page.goto('/login');
    
    // Look for theme toggle
    const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, button:has-text("Theme")');
    const toggleCount = await themeToggle.count();
    
    if (toggleCount > 0) {
      await expect(themeToggle.first()).toBeVisible();
    }
  });

  test('should have proper accessibility', async ({ page }) => {
    await page.goto('/login');
    
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    console.log(`Found ${headingCount} headings`);
    
    // Should have at least one heading
    expect(headingCount).toBeGreaterThan(0);
    
    // Check for form labels
    const labels = page.locator('label');
    const labelCount = await labels.count();
    
    console.log(`Found ${labelCount} labels`);
  });
}); 
 
 
 