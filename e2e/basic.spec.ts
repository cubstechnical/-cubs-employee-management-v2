import { test, expect } from '@playwright/test';

test.describe('Basic App Tests', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    
    // Verify login page loads
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
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

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/login');
    
    // Fill invalid email
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
    
    // Log all error messages for debugging
    for (let i = 0; i < errorCount; i++) {
      const errorText = await errorMessages.nth(i).textContent();
      console.log(`Error message ${i + 1}:`, errorText);
    }
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
}); 

test.describe('Basic App Tests', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    
    // Verify login page loads
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
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

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/login');
    
    // Fill invalid email
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
    
    // Log all error messages for debugging
    for (let i = 0; i < errorCount; i++) {
      const errorText = await errorMessages.nth(i).textContent();
      console.log(`Error message ${i + 1}:`, errorText);
    }
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
}); 
 
 
 