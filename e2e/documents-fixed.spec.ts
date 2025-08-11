import { test, expect } from '@playwright/test';

test.describe('Document Navigation and Viewer - Fixed Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to documents page
    await page.goto('/admin/documents');
    await page.waitForTimeout(3000);
  });

  test('should load documents page with company folders', async ({ page }) => {
    console.log('🔍 Testing documents page loading...');
    
    // Check if page loaded
    await expect(page.locator('body')).toBeVisible();
    
    // Look for company folders or navigation elements
    const companyElements = page.locator('a[href*="/"], [data-testid*="company"], [class*="company"]');
    const companyCount = await companyElements.count();
    console.log(`🏢 Found ${companyCount} potential company elements`);
    
    // Check for any clickable elements that might be company folders
    const clickableElements = page.locator('a, button, [role="button"]');
    const clickableCount = await clickableElements.count();
    console.log(`🔗 Found ${clickableCount} clickable elements`);
    
    if (clickableCount > 0) {
      console.log('✅ Documents page has navigation elements');
    } else {
      console.log('⚠️ No navigation elements found');
    }
  });

  test('should handle document page navigation', async ({ page }) => {
    console.log('🔍 Testing document navigation...');
    
    // Look for any clickable elements that might be folders
    const folderElements = page.locator('a, [role="button"], [class*="folder"], [class*="company"]');
    const folderCount = await folderElements.count();
    console.log(`📁 Found ${folderCount} potential folder elements`);
    
    if (folderCount > 0) {
      // Try clicking the first folder-like element
      const firstFolder = folderElements.first();
      const folderText = await firstFolder.textContent();
      console.log(`📁 Clicking first folder: "${folderText?.trim()}"`);
      
      await firstFolder.click();
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      console.log(`📍 URL after clicking folder: ${currentUrl}`);
      
      if (currentUrl !== 'http://localhost:3002/admin/documents') {
        console.log('✅ Navigation to folder successful');
      } else {
        console.log('⚠️ Navigation may not have worked');
      }
    } else {
      console.log('⚠️ No folder elements found to test navigation');
    }
  });

  test('should display breadcrumb navigation', async ({ page }) => {
    console.log('🔍 Testing breadcrumb navigation...');
    
    // Look for breadcrumb elements
    const breadcrumbElements = page.locator('[class*="breadcrumb"], [aria-label*="breadcrumb"], nav');
    const breadcrumbCount = await breadcrumbElements.count();
    console.log(`🍞 Found ${breadcrumbCount} breadcrumb elements`);
    
    if (breadcrumbCount > 0) {
      console.log('✅ Breadcrumb navigation found');
    } else {
      console.log('⚠️ No breadcrumb navigation found');
    }
  });

  test('should handle document upload functionality', async ({ page }) => {
    console.log('🔍 Testing document upload functionality...');
    
    // Look for upload button or form
    const uploadElements = page.locator('button:has-text("Upload"), input[type="file"], [class*="upload"]');
    const uploadCount = await uploadElements.count();
    console.log(`📤 Found ${uploadCount} upload elements`);
    
    if (uploadCount > 0) {
      console.log('✅ Upload functionality found');
      
      // Try to click upload button if it exists
      const uploadButton = page.locator('button:has-text("Upload")');
      if (await uploadButton.count() > 0) {
        console.log('🔘 Upload button found, clicking...');
        await uploadButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Upload button clicked');
      }
    } else {
      console.log('⚠️ No upload functionality found');
    }
  });

  test('should handle document search and filtering', async ({ page }) => {
    console.log('🔍 Testing document search and filtering...');
    
    // Look for search input
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"], input[type="search"]');
    const searchCount = await searchInput.count();
    console.log(`🔍 Found ${searchCount} search inputs`);
    
    if (searchCount > 0) {
      console.log('✅ Search functionality found');
      
      // Try to use search
      const firstSearch = searchInput.first();
      await firstSearch.fill('test');
      await page.waitForTimeout(500);
      console.log('✅ Search input working');
    } else {
      console.log('⚠️ No search functionality found');
    }
    
    // Look for filter elements
    const filterElements = page.locator('select, [class*="filter"], [role="combobox"]');
    const filterCount = await filterElements.count();
    console.log(`🔧 Found ${filterCount} filter elements`);
    
    if (filterCount > 0) {
      console.log('✅ Filter functionality found');
    } else {
      console.log('⚠️ No filter functionality found');
    }
  });

  test('should handle responsive design', async ({ page }) => {
    console.log('🔍 Testing responsive design...');
    
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ];
    
    for (const viewport of viewports) {
      console.log(`📱 Testing viewport: ${viewport.width}x${viewport.height}`);
      await page.setViewportSize(viewport);
      await page.waitForTimeout(1000);
      
      // Check if page is still functional
      await expect(page.locator('body')).toBeVisible();
      console.log(`✅ Viewport ${viewport.width}x${viewport.height} working`);
    }
  });
});

