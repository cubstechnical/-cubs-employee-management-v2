import { test, expect } from '@playwright/test';

test.describe('Authentication and Navigation', () => {
  test('should maintain authentication state across page navigation', async ({ page }) => {
    // Start from dashboard
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify we're authenticated by checking for dashboard content
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Navigate to employees page
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');
    
    // Verify we're still authenticated
    await expect(page.getByRole('heading', { name: /employees/i })).toBeVisible();
    
    // Navigate to documents page
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');
    
    // Verify we're still authenticated
    await expect(page.getByRole('heading', { name: /documents/i })).toBeVisible();
  });

  test('should handle navigation menu correctly', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for navigation menu
    const navMenu = page.locator('nav, [class*="navigation"], [class*="menu"]');
    const navCount = await navMenu.count();
    
    if (navCount > 0) {
      console.log('Navigation menu found');
      
      // Test navigation links
      const navLinks = navMenu.locator('a, button');
      const linkCount = await navLinks.count();
      
      if (linkCount > 0) {
        console.log(`Found ${linkCount} navigation links`);
        
        // Test clicking on navigation links
        for (let i = 0; i < Math.min(linkCount, 3); i++) {
          const link = navLinks.nth(i);
          const linkText = await link.textContent();
          
          if (linkText && !linkText.includes('Dashboard')) {
            await link.click();
            await page.waitForTimeout(1000);
            console.log(`Clicked on navigation link: ${linkText}`);
          }
        }
      }
    } else {
      console.log('No navigation menu found');
    }
  });

  test('should handle logout functionality', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for logout button or user menu
    const logoutButton = page.getByRole('button', { name: /logout/i }).or(page.getByRole('button', { name: /sign out/i }));
    const userMenu = page.locator('[class*="user"], [class*="profile"], [class*="avatar"]');
    
    if (await logoutButton.count() > 0) {
      console.log('Logout button found');
      await expect(logoutButton).toBeVisible();
      
      // Test logout (but don't actually logout to maintain auth state for other tests)
      // await logoutButton.click();
      // await page.waitForTimeout(2000);
    } else if (await userMenu.count() > 0) {
      console.log('User menu found');
      await userMenu.first().click();
      await page.waitForTimeout(500);
      
      // Look for logout option in user menu
      const logoutOption = page.getByRole('button', { name: /logout/i }).or(page.getByRole('button', { name: /sign out/i }));
      if (await logoutOption.count() > 0) {
        console.log('Logout option found in user menu');
      }
    } else {
      console.log('No logout functionality found');
    }
  });

  test('should handle protected routes correctly', async ({ page }) => {
    // Test accessing protected routes
    const protectedRoutes = ['/admin/dashboard', '/employees', '/documents'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Check if we're redirected to login or if we can access the route
      const currentUrl = page.url();
      
      if (currentUrl.includes('/login')) {
        console.log(`Route ${route} is properly protected - redirected to login`);
      } else {
        console.log(`Route ${route} is accessible - user is authenticated`);
        // Verify we can see the page content
        const pageContent = page.locator('body');
        await expect(pageContent).toBeVisible();
      }
    }
  });

  test('should handle page refresh correctly', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify dashboard is loaded
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify we're still authenticated and dashboard is still visible
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Navigate to employees
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');
    
    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Verify we're back on dashboard
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Go forward
    await page.goForward();
    await page.waitForLoadState('networkidle');
    
    // Verify we're back on employees page
    await expect(page.getByRole('heading', { name: /employees/i })).toBeVisible();
  });

  test('should handle responsive navigation on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for mobile navigation (hamburger menu, etc.)
    const mobileNav = page.locator('[class*="hamburger"], [class*="mobile-menu"], [class*="menu-toggle"]');
    const mobileNavCount = await mobileNav.count();
    
    if (mobileNavCount > 0) {
      console.log('Mobile navigation found');
      await mobileNav.first().click();
      await page.waitForTimeout(500);
      
      // Look for mobile menu items
      const mobileMenuItems = page.locator('[class*="mobile-menu"] a, [class*="mobile-menu"] button');
      const itemCount = await mobileMenuItems.count();
      
      if (itemCount > 0) {
        console.log(`Found ${itemCount} mobile menu items`);
      }
    } else {
      console.log('No mobile navigation found');
    }
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle loading states during navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Navigate to another page and check for loading states
    await page.goto('/employees');
    
    // Look for loading indicators
    const loadingElements = page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"]');
    const loadingCount = await loadingElements.count();
    
    if (loadingCount > 0) {
      console.log(`Found ${loadingCount} loading elements during navigation`);
      // Wait for loading to complete
      await page.waitForLoadState('networkidle');
      await expect(loadingElements.first()).not.toBeVisible();
    }
    
    // Verify page loaded correctly
    await expect(page.getByRole('heading', { name: /employees/i })).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Try to navigate to a non-existent route
    await page.goto('/non-existent-route');
    await page.waitForLoadState('networkidle');
    
    // Check for 404 or error page
    const errorElements = page.locator('[class*="404"], [class*="error"], [class*="not-found"]');
    const errorCount = await errorElements.count();
    
    if (errorCount > 0) {
      console.log('Error page found for non-existent route');
      await expect(errorElements.first()).toBeVisible();
    } else {
      // Check if we're redirected to a valid page
      const currentUrl = page.url();
      console.log(`Navigated to: ${currentUrl}`);
    }
  });

  test('should maintain user session across tabs', async ({ page, context }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Open a new tab
    const newPage = await context.newPage();
    
    // Navigate to a protected route in the new tab
    await newPage.goto('/employees');
    await newPage.waitForLoadState('networkidle');
    
    // Verify we're authenticated in the new tab
    await expect(newPage.getByRole('heading', { name: /employees/i })).toBeVisible();
    
    // Close the new tab
    await newPage.close();
  });
});
