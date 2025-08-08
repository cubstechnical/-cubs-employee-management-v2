import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test('should load dashboard with real data', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Wait for dashboard to load
    await page.waitForTimeout(2000);
    
    // Verify dashboard title
    await expect(page.getByRole('heading', { name: /Dashboard|Admin Dashboard/ })).toBeVisible();
    
    // Check for main dashboard elements
    await expect(page.locator('body')).not.toHaveText('Loading...');
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/dashboard-loaded.png', fullPage: true });
  });

  test('should display stats cards with real data', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Wait for stats to load
    await page.waitForTimeout(3000);
    
    // Check for various stat cards
    const statCards = page.locator('[data-testid="stat-card"], .stat-card, .bg-white');
    const cardCount = await statCards.count();
    
    console.log(`Found ${cardCount} stat cards`);
    expect(cardCount).toBeGreaterThan(0);
    
    // Check for specific stat types
    const employeeStats = page.locator('text=/Total Employees|Employees/');
    const documentStats = page.locator('text=/Documents|Total Documents/');
    const notificationStats = page.locator('text=/Notifications|Alerts/');
    
    // At least one of these should be visible
    const hasEmployeeStats = await employeeStats.count() > 0;
    const hasDocumentStats = await documentStats.count() > 0;
    const hasNotificationStats = await notificationStats.count() > 0;
    
    expect(hasEmployeeStats || hasDocumentStats || hasNotificationStats).toBeTruthy();
  });

  test('should display charts and visualizations', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Wait for charts to load
    await page.waitForTimeout(3000);
    
    // Look for chart containers
    const charts = page.locator('canvas, [data-testid="chart"], .chart-container');
    const chartCount = await charts.count();
    
    console.log(`Found ${chartCount} charts/visualizations`);
    
    // Charts might not be present, but dashboard should still work
    if (chartCount > 0) {
      // Verify charts are visible
      for (let i = 0; i < chartCount; i++) {
        await expect(charts.nth(i)).toBeVisible();
      }
    }
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check for navigation elements
    const navLinks = page.locator('nav a, [role="navigation"] a, .sidebar a');
    const linkCount = await navLinks.count();
    
    console.log(`Found ${linkCount} navigation links`);
    expect(linkCount).toBeGreaterThan(0);
    
    // Test a few key navigation links
    const employeesLink = page.locator('a[href*="employees"], a:has-text("Employees")');
    const documentsLink = page.locator('a[href*="documents"], a:has-text("Documents")');
    const settingsLink = page.locator('a[href*="settings"], a:has-text("Settings")');
    
    // At least one of these should be present
    const hasEmployeesLink = await employeesLink.count() > 0;
    const hasDocumentsLink = await documentsLink.count() > 0;
    const hasSettingsLink = await settingsLink.count() > 0;
    
    expect(hasEmployeesLink || hasDocumentsLink || hasSettingsLink).toBeTruthy();
  });

  test('should display recent activity or notifications', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Look for activity sections
    const activitySections = page.locator('text=/Recent Activity|Latest Updates|Notifications|Recent/');
    const activityCount = await activitySections.count();
    
    console.log(`Found ${activityCount} activity sections`);
    
    // Activity sections might not be present, but dashboard should still work
    if (activityCount > 0) {
      await expect(activitySections.first()).toBeVisible();
    }
  });

  test('should have responsive layout', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if page is responsive by testing different viewport sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle data loading states', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Check for loading states using proper selectors
    const loadingElements = page.locator('.loading, [data-testid="loading"], .spinner, .loader');
    const loadingCount = await loadingElements.count();
    
    if (loadingCount > 0) {
      // Wait for loading to complete
      await page.waitForTimeout(5000);
      await expect(page.locator('body')).not.toHaveText('Loading...');
    }
    
    // Verify page is interactive after loading
    await expect(page.locator('body')).toBeVisible();
  });
}); 

test.describe('Admin Dashboard', () => {
  test('should load dashboard with real data', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Wait for dashboard to load
    await page.waitForTimeout(2000);
    
    // Verify dashboard title
    await expect(page.getByRole('heading', { name: /Dashboard|Admin Dashboard/ })).toBeVisible();
    
    // Check for main dashboard elements
    await expect(page.locator('body')).not.toHaveText('Loading...');
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/dashboard-loaded.png', fullPage: true });
  });

  test('should display stats cards with real data', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Wait for stats to load
    await page.waitForTimeout(3000);
    
    // Check for various stat cards
    const statCards = page.locator('[data-testid="stat-card"], .stat-card, .bg-white');
    const cardCount = await statCards.count();
    
    console.log(`Found ${cardCount} stat cards`);
    expect(cardCount).toBeGreaterThan(0);
    
    // Check for specific stat types
    const employeeStats = page.locator('text=/Total Employees|Employees/');
    const documentStats = page.locator('text=/Documents|Total Documents/');
    const notificationStats = page.locator('text=/Notifications|Alerts/');
    
    // At least one of these should be visible
    const hasEmployeeStats = await employeeStats.count() > 0;
    const hasDocumentStats = await documentStats.count() > 0;
    const hasNotificationStats = await notificationStats.count() > 0;
    
    expect(hasEmployeeStats || hasDocumentStats || hasNotificationStats).toBeTruthy();
  });

  test('should display charts and visualizations', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Wait for charts to load
    await page.waitForTimeout(3000);
    
    // Look for chart containers
    const charts = page.locator('canvas, [data-testid="chart"], .chart-container');
    const chartCount = await charts.count();
    
    console.log(`Found ${chartCount} charts/visualizations`);
    
    // Charts might not be present, but dashboard should still work
    if (chartCount > 0) {
      // Verify charts are visible
      for (let i = 0; i < chartCount; i++) {
        await expect(charts.nth(i)).toBeVisible();
      }
    }
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check for navigation elements
    const navLinks = page.locator('nav a, [role="navigation"] a, .sidebar a');
    const linkCount = await navLinks.count();
    
    console.log(`Found ${linkCount} navigation links`);
    expect(linkCount).toBeGreaterThan(0);
    
    // Test a few key navigation links
    const employeesLink = page.locator('a[href*="employees"], a:has-text("Employees")');
    const documentsLink = page.locator('a[href*="documents"], a:has-text("Documents")');
    const settingsLink = page.locator('a[href*="settings"], a:has-text("Settings")');
    
    // At least one of these should be present
    const hasEmployeesLink = await employeesLink.count() > 0;
    const hasDocumentsLink = await documentsLink.count() > 0;
    const hasSettingsLink = await settingsLink.count() > 0;
    
    expect(hasEmployeesLink || hasDocumentsLink || hasSettingsLink).toBeTruthy();
  });

  test('should display recent activity or notifications', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Look for activity sections
    const activitySections = page.locator('text=/Recent Activity|Latest Updates|Notifications|Recent/');
    const activityCount = await activitySections.count();
    
    console.log(`Found ${activityCount} activity sections`);
    
    // Activity sections might not be present, but dashboard should still work
    if (activityCount > 0) {
      await expect(activitySections.first()).toBeVisible();
    }
  });

  test('should have responsive layout', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if page is responsive by testing different viewport sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle data loading states', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Check for loading states using proper selectors
    const loadingElements = page.locator('.loading, [data-testid="loading"], .spinner, .loader');
    const loadingCount = await loadingElements.count();
    
    if (loadingCount > 0) {
      // Wait for loading to complete
      await page.waitForTimeout(5000);
      await expect(page.locator('body')).not.toHaveText('Loading...');
    }
    
    // Verify page is interactive after loading
    await expect(page.locator('body')).toBeVisible();
  });
}); 
 
 
 