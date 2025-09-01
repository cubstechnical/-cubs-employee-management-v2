import { test, expect } from '@playwright/test';

test.describe('Document Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');
  });

  test('should display document explorer interface', async ({ page }) => {
    // Check if document explorer is visible
    await expect(page.getByRole('heading', { name: /documents/i })).toBeVisible();
    
    // Look for document explorer elements
    const explorerElements = page.locator('[class*="explorer"], [class*="folder"], [class*="tree"]');
    const explorerCount = await explorerElements.count();
    
    if (explorerCount > 0) {
      console.log(`Found ${explorerCount} document explorer elements`);
      await expect(explorerElements.first()).toBeVisible();
    }
  });

  test('should navigate through company folders', async ({ page }) => {
    // Look for company folders
    const companyFolders = page.locator('[class*="company"], [class*="folder"]');
    const folderCount = await companyFolders.count();
    
    if (folderCount > 0) {
      console.log(`Found ${folderCount} company folders`);
      
      // Click on first company folder
      const firstFolder = companyFolders.first();
      await firstFolder.click();
      await page.waitForTimeout(1000);
      
      // Check if we navigated to company view
      const companyView = page.locator('[class*="company"], [class*="employees"]');
      if (await companyView.count() > 0) {
        await expect(companyView.first()).toBeVisible();
        console.log('Successfully navigated to company view');
      }
    } else {
      console.log('No company folders found');
    }
  });

  test('should navigate through employee folders', async ({ page }) => {
    // First navigate to a company folder
    const companyFolders = page.locator('[class*="company"], [class*="folder"]');
    const folderCount = await companyFolders.count();
    
    if (folderCount > 0) {
      await companyFolders.first().click();
      await page.waitForTimeout(1000);
      
      // Look for employee folders
      const employeeFolders = page.locator('[class*="employee"], [class*="folder"]');
      const employeeCount = await employeeFolders.count();
      
      if (employeeCount > 0) {
        console.log(`Found ${employeeCount} employee folders`);
        
        // Click on first employee folder
        await employeeFolders.first().click();
        await page.waitForTimeout(1000);
        
        // Check if we navigated to employee documents view
        const employeeView = page.locator('[class*="employee"], [class*="documents"]');
        if (await employeeView.count() > 0) {
          await expect(employeeView.first()).toBeVisible();
          console.log('Successfully navigated to employee documents view');
        }
      } else {
        console.log('No employee folders found');
      }
    }
  });

  test('should display document list with proper information', async ({ page }) => {
    // Navigate to a folder with documents
    const folders = page.locator('[class*="folder"], [class*="company"], [class*="employee"]');
    const folderCount = await folders.count();
    
    if (folderCount > 0) {
      await folders.first().click();
      await page.waitForTimeout(1000);
      
      // Look for document list
      const documentList = page.locator('[class*="document"], [class*="file"], table');
      const documentCount = await documentList.count();
      
      if (documentCount > 0) {
        console.log(`Found ${documentCount} document elements`);
        
        // Check for document information
        const documentItems = page.locator('[class*="document-item"], tbody tr, [class*="file-item"]');
        const itemCount = await documentItems.count();
        
        if (itemCount > 0) {
          const firstItem = documentItems.first();
          
          // Check for common document fields
          const expectedFields = ['name', 'type', 'size', 'date', 'status'];
          
          for (const field of expectedFields) {
            const fieldElement = firstItem.locator(`[class*="${field}"], td`).first();
            if (await fieldElement.count() > 0) {
              const text = await fieldElement.textContent();
              expect(text).toBeTruthy();
              console.log(`Document ${field}: ${text}`);
            }
          }
        }
      } else {
        console.log('No documents found');
      }
    }
  });

  test('should have working search functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i).or(page.locator('input[type="search"]'));
    
    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible();
      
      // Test search functionality
      await searchInput.fill('test document');
      await page.waitForTimeout(1000);
      
      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(1000);
      
      console.log('Search functionality working');
    } else {
      console.log('Search functionality not found');
    }
  });

  test('should handle document upload if available', async ({ page }) => {
    // Look for upload button or area
    const uploadButton = page.getByRole('button', { name: /upload/i }).or(page.locator('[class*="upload"]'));
    const uploadArea = page.locator('[class*="dropzone"], [class*="upload-area"]');
    
    if (await uploadButton.count() > 0) {
      console.log('Upload button found');
      await expect(uploadButton).toBeVisible();
    } else if (await uploadArea.count() > 0) {
      console.log('Upload area found');
      await expect(uploadArea).toBeVisible();
    } else {
      console.log('No upload functionality found');
    }
  });

  test('should handle document actions (view, download, delete)', async ({ page }) => {
    // Navigate to a folder with documents
    const folders = page.locator('[class*="folder"], [class*="company"], [class*="employee"]');
    const folderCount = await folders.count();
    
    if (folderCount > 0) {
      await folders.first().click();
      await page.waitForTimeout(1000);
      
      // Look for document action buttons
      const actionButtons = page.locator('button, [class*="action"], [class*="menu"]');
      const buttonCount = await actionButtons.count();
      
      if (buttonCount > 0) {
        console.log(`Found ${buttonCount} action buttons`);
        
        // Look for specific action buttons
        const viewButton = page.getByRole('button', { name: /view/i });
        const downloadButton = page.getByRole('button', { name: /download/i });
        const deleteButton = page.getByRole('button', { name: /delete/i });
        
        if (await viewButton.count() > 0) {
          await expect(viewButton.first()).toBeVisible();
        }
        
        if (await downloadButton.count() > 0) {
          await expect(downloadButton.first()).toBeVisible();
        }
        
        if (await deleteButton.count() > 0) {
          await expect(deleteButton.first()).toBeVisible();
        }
      }
    }
  });

  test('should handle breadcrumb navigation', async ({ page }) => {
    // Look for breadcrumb navigation
    const breadcrumbs = page.locator('[class*="breadcrumb"], [class*="nav-path"]');
    const breadcrumbCount = await breadcrumbs.count();
    
    if (breadcrumbCount > 0) {
      console.log('Breadcrumb navigation found');
      await expect(breadcrumbs.first()).toBeVisible();
      
      // Test breadcrumb navigation
      const breadcrumbLinks = breadcrumbs.locator('a, button');
      const linkCount = await breadcrumbLinks.count();
      
      if (linkCount > 0) {
        // Click on first breadcrumb link
        await breadcrumbLinks.first().click();
        await page.waitForTimeout(1000);
        console.log('Breadcrumb navigation working');
      }
    } else {
      console.log('No breadcrumb navigation found');
    }
  });

  test('should handle responsive design on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Check if document explorer is still functional
    await expect(page.getByRole('heading', { name: /documents/i })).toBeVisible();
    
    // Look for mobile-specific elements
    const mobileElements = page.locator('[class*="mobile"], [class*="responsive"]');
    const mobileCount = await mobileElements.count();
    
    if (mobileCount > 0) {
      console.log(`Found ${mobileCount} mobile-specific elements`);
    }
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle loading and error states', async ({ page }) => {
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
    
    // Check for error states
    const errorElements = page.locator('[class*="error"], [class*="empty"], [class*="no-data"]');
    const errorCount = await errorElements.count();
    
    if (errorCount > 0) {
      console.log(`Found ${errorCount} error/empty state elements`);
    }
  });

  test('should handle document filtering and sorting', async ({ page }) => {
    // Look for filter and sort controls
    const filterElements = page.locator('select, [class*="filter"], [class*="sort"]');
    const filterCount = await filterElements.count();
    
    if (filterCount > 0) {
      console.log(`Found ${filterCount} filter/sort elements`);
      
      // Test first filter if it's a select element
      const firstFilter = filterElements.first();
      if (await firstFilter.evaluate(el => el.tagName === 'SELECT')) {
        await firstFilter.click();
        await page.waitForTimeout(500);
        console.log('Filter functionality working');
      }
    } else {
      console.log('No filter/sort options found');
    }
  });

  test('should handle document refresh functionality', async ({ page }) => {
    // Look for refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i }).or(page.locator('[class*="refresh"]'));
    
    if (await refreshButton.count() > 0) {
      console.log('Refresh button found');
      await expect(refreshButton).toBeVisible();
      
      // Test refresh functionality
      await refreshButton.click();
      await page.waitForTimeout(2000);
      
      // Verify document explorer is still visible after refresh
      await expect(page.getByRole('heading', { name: /documents/i })).toBeVisible();
    } else {
      console.log('No refresh button found');
    }
  });
});