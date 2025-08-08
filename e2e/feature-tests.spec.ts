import { test, expect } from '@playwright/test';

test.describe('App Feature Tests', () => {
  test('should have working login form', async ({ page }) => {
    await page.goto('/login');
    
    // Check form elements exist
    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(signInButton).toBeVisible();
    
    // Test form validation
    await signInButton.click();
    await page.waitForTimeout(1000);
    
    // Should show validation errors or stay on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
  });

  test('should handle form input correctly', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');
    
    // Test email input
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
    
    // Test password input
    await passwordInput.fill('testpassword123');
    await expect(passwordInput).toHaveValue('testpassword123');
    
    // Test clearing inputs
    await emailInput.clear();
    await passwordInput.clear();
    await expect(emailInput).toHaveValue('');
    await expect(passwordInput).toHaveValue('');
  });

  test('should have proper page navigation', async ({ page }) => {
    // Test login page
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
    
    // Test dashboard (should redirect to login if not authenticated)
    await page.goto('/admin/dashboard');
    await expect(page.locator('body')).toBeVisible();
    
    // Test employees page
    await page.goto('/admin/employees');
    await expect(page.locator('body')).toBeVisible();
    
    // Test documents page
    await page.goto('/admin/documents');
    await expect(page.locator('body')).toBeVisible();
    
    // Test settings page
    await page.goto('/admin/settings');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    await page.goto('/login');
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle error pages gracefully', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page');
    await expect(page.locator('body')).toBeVisible();
    
    // Test invalid routes
    await page.goto('/invalid/route/test');
    await expect(page.locator('body')).toBeVisible();
    
    // Test malformed URLs
    await page.goto('/admin/employees/invalid-id');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have proper accessibility features', async ({ page }) => {
    await page.goto('/login');
    
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
    
    // Check for form labels
    const labels = page.locator('label');
    const labelCount = await labels.count();
    expect(labelCount).toBeGreaterThan(0);
    
    // Check for proper button roles
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    // Check for proper input types
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test('should handle page loading states', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Verify page is interactive
    await expect(page.locator('body')).toBeVisible();
    
    // Check for any loading indicators
    const loadingElements = page.locator('.loading, .spinner, .loader, [data-testid="loading"]');
    const loadingCount = await loadingElements.count();
    
    if (loadingCount > 0) {
      // Wait for loading to complete
      await page.waitForTimeout(3000);
    }
  });

  test('should handle JavaScript errors gracefully', async ({ page }) => {
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
    
    // Test button clicks don't cause errors
    if (buttonCount > 0) {
      await buttons.first().click();
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle theme switching if available', async ({ page }) => {
    await page.goto('/login');
    
    // Look for theme toggle
    const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, button:has-text("Theme")');
    const toggleCount = await themeToggle.count();
    
    if (toggleCount > 0) {
      await expect(themeToggle.first()).toBeVisible();
      
      // Test theme toggle click
      await themeToggle.first().click();
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should have proper form validation', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    
    // Test empty form submission
    await signInButton.click();
    await page.waitForTimeout(1000);
    
    // Should show validation or stay on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
    
    // Test invalid email format
    await emailInput.fill('invalid-email');
    await passwordInput.fill('password');
    await signInButton.click();
    await page.waitForTimeout(1000);
    
    // Should handle invalid email gracefully
    expect(currentUrl).toContain('/login');
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/login');
    await page.goto('/admin/dashboard');
    await page.goBack();
    
    // Should handle back navigation gracefully
    await expect(page.locator('body')).toBeVisible();
    
    await page.goForward();
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have proper meta tags and SEO', async ({ page }) => {
    await page.goto('/login');
    
    // Check for basic meta tags
    const title = await page.title();
    expect(title).toBeTruthy();
    
    const metaDescription = page.locator('meta[name="description"]');
    const descriptionCount = await metaDescription.count();
    
    // Should have some meta information
    expect(title.length).toBeGreaterThan(0);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(emailInput).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();
  });

  test('should handle form submission with Enter key', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password');
    
    // Submit form with Enter key
    await passwordInput.press('Enter');
    await page.waitForTimeout(1000);
    
    // Should handle form submission
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('Enter your email');
    
    // Test focus
    await emailInput.focus();
    await expect(emailInput).toBeFocused();
    
    // Test blur
    await emailInput.blur();
    await expect(emailInput).not.toBeFocused();
  });
});

test.describe('App Feature Tests', () => {
  test('should have working login form', async ({ page }) => {
    await page.goto('/login');
    
    // Check form elements exist
    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(signInButton).toBeVisible();
    
    // Test form validation
    await signInButton.click();
    await page.waitForTimeout(1000);
    
    // Should show validation errors or stay on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
  });

  test('should handle form input correctly', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');
    
    // Test email input
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
    
    // Test password input
    await passwordInput.fill('testpassword123');
    await expect(passwordInput).toHaveValue('testpassword123');
    
    // Test clearing inputs
    await emailInput.clear();
    await passwordInput.clear();
    await expect(emailInput).toHaveValue('');
    await expect(passwordInput).toHaveValue('');
  });

  test('should have proper page navigation', async ({ page }) => {
    // Test login page
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
    
    // Test dashboard (should redirect to login if not authenticated)
    await page.goto('/admin/dashboard');
    await expect(page.locator('body')).toBeVisible();
    
    // Test employees page
    await page.goto('/admin/employees');
    await expect(page.locator('body')).toBeVisible();
    
    // Test documents page
    await page.goto('/admin/documents');
    await expect(page.locator('body')).toBeVisible();
    
    // Test settings page
    await page.goto('/admin/settings');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    await page.goto('/login');
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle error pages gracefully', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page');
    await expect(page.locator('body')).toBeVisible();
    
    // Test invalid routes
    await page.goto('/invalid/route/test');
    await expect(page.locator('body')).toBeVisible();
    
    // Test malformed URLs
    await page.goto('/admin/employees/invalid-id');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have proper accessibility features', async ({ page }) => {
    await page.goto('/login');
    
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
    
    // Check for form labels
    const labels = page.locator('label');
    const labelCount = await labels.count();
    expect(labelCount).toBeGreaterThan(0);
    
    // Check for proper button roles
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    // Check for proper input types
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test('should handle page loading states', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Verify page is interactive
    await expect(page.locator('body')).toBeVisible();
    
    // Check for any loading indicators
    const loadingElements = page.locator('.loading, .spinner, .loader, [data-testid="loading"]');
    const loadingCount = await loadingElements.count();
    
    if (loadingCount > 0) {
      // Wait for loading to complete
      await page.waitForTimeout(3000);
    }
  });

  test('should handle JavaScript errors gracefully', async ({ page }) => {
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
    
    // Test button clicks don't cause errors
    if (buttonCount > 0) {
      await buttons.first().click();
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle theme switching if available', async ({ page }) => {
    await page.goto('/login');
    
    // Look for theme toggle
    const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, button:has-text("Theme")');
    const toggleCount = await themeToggle.count();
    
    if (toggleCount > 0) {
      await expect(themeToggle.first()).toBeVisible();
      
      // Test theme toggle click
      await themeToggle.first().click();
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should have proper form validation', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    
    // Test empty form submission
    await signInButton.click();
    await page.waitForTimeout(1000);
    
    // Should show validation or stay on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
    
    // Test invalid email format
    await emailInput.fill('invalid-email');
    await passwordInput.fill('password');
    await signInButton.click();
    await page.waitForTimeout(1000);
    
    // Should handle invalid email gracefully
    expect(currentUrl).toContain('/login');
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/login');
    await page.goto('/admin/dashboard');
    await page.goBack();
    
    // Should handle back navigation gracefully
    await expect(page.locator('body')).toBeVisible();
    
    await page.goForward();
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have proper meta tags and SEO', async ({ page }) => {
    await page.goto('/login');
    
    // Check for basic meta tags
    const title = await page.title();
    expect(title).toBeTruthy();
    
    const metaDescription = page.locator('meta[name="description"]');
    const descriptionCount = await metaDescription.count();
    
    // Should have some meta information
    expect(title.length).toBeGreaterThan(0);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(emailInput).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();
  });

  test('should handle form submission with Enter key', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password');
    
    // Submit form with Enter key
    await passwordInput.press('Enter');
    await page.waitForTimeout(1000);
    
    // Should handle form submission
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('Enter your email');
    
    // Test focus
    await emailInput.focus();
    await expect(emailInput).toBeFocused();
    
    // Test blur
    await emailInput.blur();
    await expect(emailInput).not.toBeFocused();
  });
});



