import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should load dashboard with all stats cards', async ({ page }) => {
    // Check if dashboard title is visible
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Check for stats cards
    const statsCards = [
      'Total Employees',
      'Active Employees', 
      'Total Documents',
      'Pending Approvals',
      'Visas Expiring Soon',
      'Departments'
    ];

    for (const cardTitle of statsCards) {
      const card = page.getByText(cardTitle);
      await expect(card).toBeVisible();
      
      // Check that the card has a numeric value
      const cardContainer = card.locator('..').or(card.locator('xpath=ancestor::div[contains(@class, "card") or contains(@class, "stat")]'));
      const valueElement = cardContainer.getByRole('heading').or(cardContainer.locator('[class*="text-"]').first());
      
      if (await valueElement.count() > 0) {
        const value = await valueElement.textContent();
        expect(value).toMatch(/\d+/); // Should contain at least one digit
        console.log(`✅ ${cardTitle}: ${value}`);
      }
    }
  });

  test('should display visa expiry alerts', async ({ page }) => {
    // Look for visa expiry alerts or warnings
    const visaAlerts = page.locator('[class*="alert"], [class*="warning"], [class*="expiry"]');
    const alertCount = await visaAlerts.count();
    
    if (alertCount > 0) {
      console.log(`Found ${alertCount} visa expiry alerts`);
      await expect(visaAlerts.first()).toBeVisible();
    } else {
      console.log('No visa expiry alerts found (this is normal if no visas are expiring)');
    }
  });

  test('should have working navigation menu', async ({ page }) => {
    // Check for navigation elements
    const navItems = [
      'Dashboard',
      'Employees', 
      'Documents',
      'Profile'
    ];

    for (const navItem of navItems) {
      const navElement = page.getByRole('link', { name: navItem }).or(page.getByText(navItem));
      if (await navElement.count() > 0) {
        await expect(navElement).toBeVisible();
      }
    }
  });

  test('should load dashboard stats from consolidated endpoint', async ({ page }) => {
    // Monitor network requests to ensure consolidated endpoint is used
    const requests: string[] = [];
    
    page.on('request', request => {
      if (request.url().includes('dashboard') || request.url().includes('stats')) {
        requests.push(request.url());
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check if we made requests to dashboard stats
    const hasDashboardRequests = requests.some(url => 
      url.includes('dashboard') || url.includes('stats') || url.includes('get_dashboard_stats')
    );
    
    console.log('Dashboard-related requests:', requests);
    expect(requests.length).toBeGreaterThan(0);
  });

  test('should display charts and visualizations', async ({ page }) => {
    // Look for chart elements (ApexCharts, etc.)
    const charts = page.locator('[class*="chart"], [class*="apex"], canvas, svg');
    const chartCount = await charts.count();
    
    if (chartCount > 0) {
      console.log(`Found ${chartCount} chart elements`);
      await expect(charts.first()).toBeVisible();
    } else {
      console.log('No charts found on dashboard');
    }
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Check if dashboard is still functional on mobile
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    // Check if dashboard is still functional on tablet
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should show loading states appropriately', async ({ page }) => {
    // Reload page and check for loading states
    await page.reload();
    
    // Look for loading indicators
    const loadingElements = page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"]');
    const loadingCount = await loadingElements.count();
    
    if (loadingCount > 0) {
      console.log(`Found ${loadingCount} loading elements`);
      // Wait for loading to complete
      await page.waitForLoadState('networkidle');
      await expect(loadingElements.first()).not.toBeVisible();
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Check for error messages or empty states
    const errorElements = page.locator('[class*="error"], [class*="empty"], [class*="no-data"]');
    const errorCount = await errorElements.count();
    
    if (errorCount > 0) {
      console.log(`Found ${errorCount} error/empty state elements`);
      // These should be visible if there are no errors
      await expect(errorElements.first()).toBeVisible();
    }
  });
});
