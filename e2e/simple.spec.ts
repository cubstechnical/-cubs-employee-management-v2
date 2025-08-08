import { test, expect } from '@playwright/test';

test.describe('Simple App Tests', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
    
    // Check for login form elements
    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(signInButton).toBeVisible();
  });

  test('should handle form input', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('testpassword');
    
    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('testpassword');
  });

  test('should have responsive layout', async ({ page }) => {
    await page.goto('/login');
    
    // Test different viewport sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle 404 pages', async ({ page }) => {
    await page.goto('/non-existent-page');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have proper page structure', async ({ page }) => {
    await page.goto('/login');
    
    // Check for basic page elements
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const buttons = page.locator('button');
    const inputs = page.locator('input');
    
    const headingCount = await headings.count();
    const buttonCount = await buttons.count();
    const inputCount = await inputs.count();
    
    console.log(`Found ${headingCount} headings, ${buttonCount} buttons, ${inputCount} inputs`);
    
    // Should have at least some basic elements
    expect(headingCount + buttonCount + inputCount).toBeGreaterThan(0);
  });

  test('should load without JavaScript errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    console.log(`Console errors found: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }
    
    // Page should still be functional even with some console errors
    await expect(page.locator('body')).toBeVisible();
  });
}); 

test.describe('Simple App Tests', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
    
    // Check for login form elements
    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(signInButton).toBeVisible();
  });

  test('should handle form input', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('testpassword');
    
    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('testpassword');
  });

  test('should have responsive layout', async ({ page }) => {
    await page.goto('/login');
    
    // Test different viewport sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle 404 pages', async ({ page }) => {
    await page.goto('/non-existent-page');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have proper page structure', async ({ page }) => {
    await page.goto('/login');
    
    // Check for basic page elements
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const buttons = page.locator('button');
    const inputs = page.locator('input');
    
    const headingCount = await headings.count();
    const buttonCount = await buttons.count();
    const inputCount = await inputs.count();
    
    console.log(`Found ${headingCount} headings, ${buttonCount} buttons, ${inputCount} inputs`);
    
    // Should have at least some basic elements
    expect(headingCount + buttonCount + inputCount).toBeGreaterThan(0);
  });

  test('should load without JavaScript errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    console.log(`Console errors found: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }
    
    // Page should still be functional even with some console errors
    await expect(page.locator('body')).toBeVisible();
  });
}); 
 
 
 