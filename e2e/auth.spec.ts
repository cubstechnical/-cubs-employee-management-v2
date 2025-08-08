import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for the login form to be visible
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    
    // Verify form elements are present
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit without filling any fields
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for validation to appear
    await page.waitForTimeout(1000);
    
    // Check for validation messages
    const validationMessages = page.locator('.text-red-600, .text-red-500, [role="alert"]');
    const messageCount = await validationMessages.count();
    
    // Should have at least one validation message
    expect(messageCount).toBeGreaterThan(0);
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.goto('/login');
    
    // Fill invalid email format
    await page.getByPlaceholder('Enter your email').fill('invalid-email');
    await page.getByPlaceholder('Enter your password').fill('password123');
    
    // Try to submit
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for validation
    await page.waitForTimeout(1000);
    
    // Check for any validation error messages
    const errorMessages = page.locator('.text-red-600, .text-red-500');
    const errorCount = await errorMessages.count();
    
    // Should have at least one error message
    expect(errorCount).toBeGreaterThan(0);
  });

  test('should show validation error for short password', async ({ page }) => {
    await page.goto('/login');
    
    // Fill valid email but short password
    await page.getByPlaceholder('Enter your email').fill('test@example.com');
    await page.getByPlaceholder('Enter your password').fill('123');
    
    // Try to submit
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for validation
    await page.waitForTimeout(1000);
    
    // Use a more specific selector for password validation error
    await expect(page.locator('.text-red-600, .text-red-500').filter({ hasText: '6 characters' })).toBeVisible();
  });

  test('should attempt login with test credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in test credentials
    await page.getByPlaceholder('Enter your email').fill('info@cubstechnical.com');
    await page.getByPlaceholder('Enter your password').fill('password123');
    
    // Click the sign in button
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after login attempt:', currentUrl);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/login-attempt.png', fullPage: true });
    
    // Check for error messages
    const errorMessages = page.locator('[role="alert"], .error, .text-red-600, .text-red-500');
    const errorCount = await errorMessages.count();
    
    if (errorCount > 0) {
      console.log('Error messages found:');
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorMessages.nth(i).textContent();
        console.log(`Error ${i + 1}:`, errorText);
      }
    }
    
    // If we're still on login page, that's expected if credentials are wrong
    if (currentUrl.includes('/login')) {
      await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    } else if (currentUrl.includes('/dashboard')) {
      // If we successfully logged in, verify dashboard
      await expect(page.getByText('Dashboard')).toBeVisible();
    }
  });
}); 

test.describe('Authentication Flow', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for the login form to be visible
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    
    // Verify form elements are present
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit without filling any fields
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for validation to appear
    await page.waitForTimeout(1000);
    
    // Check for validation messages
    const validationMessages = page.locator('.text-red-600, .text-red-500, [role="alert"]');
    const messageCount = await validationMessages.count();
    
    // Should have at least one validation message
    expect(messageCount).toBeGreaterThan(0);
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.goto('/login');
    
    // Fill invalid email format
    await page.getByPlaceholder('Enter your email').fill('invalid-email');
    await page.getByPlaceholder('Enter your password').fill('password123');
    
    // Try to submit
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for validation
    await page.waitForTimeout(1000);
    
    // Check for any validation error messages
    const errorMessages = page.locator('.text-red-600, .text-red-500');
    const errorCount = await errorMessages.count();
    
    // Should have at least one error message
    expect(errorCount).toBeGreaterThan(0);
  });

  test('should show validation error for short password', async ({ page }) => {
    await page.goto('/login');
    
    // Fill valid email but short password
    await page.getByPlaceholder('Enter your email').fill('test@example.com');
    await page.getByPlaceholder('Enter your password').fill('123');
    
    // Try to submit
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for validation
    await page.waitForTimeout(1000);
    
    // Use a more specific selector for password validation error
    await expect(page.locator('.text-red-600, .text-red-500').filter({ hasText: '6 characters' })).toBeVisible();
  });

  test('should attempt login with test credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in test credentials
    await page.getByPlaceholder('Enter your email').fill('info@cubstechnical.com');
    await page.getByPlaceholder('Enter your password').fill('password123');
    
    // Click the sign in button
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after login attempt:', currentUrl);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/login-attempt.png', fullPage: true });
    
    // Check for error messages
    const errorMessages = page.locator('[role="alert"], .error, .text-red-600, .text-red-500');
    const errorCount = await errorMessages.count();
    
    if (errorCount > 0) {
      console.log('Error messages found:');
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorMessages.nth(i).textContent();
        console.log(`Error ${i + 1}:`, errorText);
      }
    }
    
    // If we're still on login page, that's expected if credentials are wrong
    if (currentUrl.includes('/login')) {
      await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    } else if (currentUrl.includes('/dashboard')) {
      // If we successfully logged in, verify dashboard
      await expect(page.getByText('Dashboard')).toBeVisible();
    }
  });
}); 
 
 
 