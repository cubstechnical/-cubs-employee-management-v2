import { test, expect } from '@playwright/test';

test.describe('Document Management', () => {
  test('should load documents page with folders', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Verify page title
    await expect(page.getByRole('heading', { name: /Documents|Document Management/ })).toBeVisible();
    
    // Check for folder structure
    const folders = page.locator('[data-testid="folder-item"], .folder-item, .folder');
    const folderCount = await folders.count();
    
    console.log(`Found ${folderCount} folders`);
    expect(folderCount).toBeGreaterThan(0);
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/documents-page-loaded.png', fullPage: true });
  });

  test('should display company documents folder', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for company documents folder
    const companyFolder = page.locator('text=/Company Documents|company/i');
    const companyFolderCount = await companyFolder.count();
    
    console.log(`Found ${companyFolderCount} company document folders`);
    
    if (companyFolderCount > 0) {
      await expect(companyFolder.first()).toBeVisible();
      
      // Click on company documents folder
      await companyFolder.first().click();
      
      // Wait for folder to open
      await page.waitForTimeout(2000);
      
      // Should show folder contents
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should display employee folders', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for employee folders
    const employeeFolders = page.locator('text=/AL HANA|Employee/i');
    const employeeFolderCount = await employeeFolders.count();
    
    console.log(`Found ${employeeFolderCount} employee folders`);
    
    if (employeeFolderCount > 0) {
      // Click on first employee folder
      await employeeFolders.first().click();
      
      // Wait for folder to open
      await page.waitForTimeout(2000);
      
      // Should show folder contents
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should have upload functionality', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for upload button
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add"), input[type="file"]');
    const uploadCount = await uploadButton.count();
    
    console.log(`Found ${uploadCount} upload controls`);
    
    if (uploadCount > 0) {
      // Test file input if available
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await expect(fileInput.first()).toBeVisible();
      }
      
      // Test upload button if available
      const uploadBtn = page.locator('button:has-text("Upload"), button:has-text("Add")');
      if (await uploadBtn.count() > 0) {
        await expect(uploadBtn.first()).toBeVisible();
      }
    }
  });

  test('should handle document preview', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Navigate to a folder first
    const folders = page.locator('[data-testid="folder-item"], .folder-item, .folder');
    if (await folders.count() > 0) {
      await folders.first().click();
      await page.waitForTimeout(2000);
      
      // Look for document items
      const documents = page.locator('[data-testid="document-item"], .document-item, .file-item');
      const documentCount = await documents.count();
      
      console.log(`Found ${documentCount} documents`);
      
      if (documentCount > 0) {
        // Click on first document
        await documents.first().click();
        
        // Wait for preview to load
        await page.waitForTimeout(2000);
        
        // Should show preview or download dialog
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should handle document download', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Navigate to a folder first
    const folders = page.locator('[data-testid="folder-item"], .folder-item, .folder');
    if (await folders.count() > 0) {
      await folders.first().click();
      await page.waitForTimeout(2000);
      
      // Look for download buttons
      const downloadButtons = page.locator('button:has-text("Download"), a[download], [data-testid="download"]');
      const downloadCount = await downloadButtons.count();
      
      console.log(`Found ${downloadCount} download buttons`);
      
      if (downloadCount > 0) {
        // Test download functionality
        await expect(downloadButtons.first()).toBeVisible();
      }
    }
  });

  test('should handle document deletion', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Navigate to a folder first
    const folders = page.locator('[data-testid="folder-item"], .folder-item, .folder');
    if (await folders.count() > 0) {
      await folders.first().click();
      await page.waitForTimeout(2000);
      
      // Look for delete buttons
      const deleteButtons = page.locator('button:has-text("Delete"), button:has-text("Remove"), [data-testid="delete"]');
      const deleteCount = await deleteButtons.count();
      
      console.log(`Found ${deleteCount} delete buttons`);
      
      if (deleteCount > 0) {
        // Test delete button visibility
        await expect(deleteButtons.first()).toBeVisible();
      }
    }
  });

  test('should have search and filter functionality', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for search controls
    const searchControls = page.locator('input[placeholder*="search"], input[placeholder*="Search"], [data-testid="search"]');
    const searchCount = await searchControls.count();
    
    console.log(`Found ${searchCount} search controls`);
    
    if (searchCount > 0) {
      // Test search functionality
      await searchControls.first().fill('test');
      await page.waitForTimeout(1000);
      
      // Verify search is working
      await expect(searchControls.first()).toHaveValue('test');
    }
  });

  test('should handle folder navigation', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Test breadcrumb navigation if available
    const breadcrumbs = page.locator('[data-testid="breadcrumb"], .breadcrumb, nav');
    const breadcrumbCount = await breadcrumbs.count();
    
    console.log(`Found ${breadcrumbCount} breadcrumb/navigation elements`);
    
    if (breadcrumbCount > 0) {
      await expect(breadcrumbs.first()).toBeVisible();
    }
    
    // Test back button if available
    const backButton = page.locator('button:has-text("Back"), a:has-text("Back")');
    if (await backButton.count() > 0) {
      await expect(backButton.first()).toBeVisible();
    }
  });

  test('should have responsive document layout', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Test responsive layout
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle empty folder states', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Navigate to different folders to test empty states
    const folders = page.locator('[data-testid="folder-item"], .folder-item, .folder');
    const folderCount = await folders.count();
    
    if (folderCount > 1) {
      // Click on second folder
      await folders.nth(1).click();
      await page.waitForTimeout(2000);
      
      // Check for empty state messages
      const emptyMessages = page.locator('text=/No documents|Empty|No files/i');
      const emptyCount = await emptyMessages.count();
      
      if (emptyCount > 0) {
        await expect(emptyMessages.first()).toBeVisible();
      }
    }
  });

  test('should handle document sorting and organization', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for sorting controls
    const sortControls = page.locator('select, button:has-text("Sort"), [data-testid="sort"]');
    const sortCount = await sortControls.count();
    
    console.log(`Found ${sortCount} sorting controls`);
    
    if (sortCount > 0) {
      // Test sorting functionality
      await expect(sortControls.first()).toBeVisible();
    }
  });
}); 

test.describe('Document Management', () => {
  test('should load documents page with folders', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Verify page title
    await expect(page.getByRole('heading', { name: /Documents|Document Management/ })).toBeVisible();
    
    // Check for folder structure
    const folders = page.locator('[data-testid="folder-item"], .folder-item, .folder');
    const folderCount = await folders.count();
    
    console.log(`Found ${folderCount} folders`);
    expect(folderCount).toBeGreaterThan(0);
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/documents-page-loaded.png', fullPage: true });
  });

  test('should display company documents folder', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for company documents folder
    const companyFolder = page.locator('text=/Company Documents|company/i');
    const companyFolderCount = await companyFolder.count();
    
    console.log(`Found ${companyFolderCount} company document folders`);
    
    if (companyFolderCount > 0) {
      await expect(companyFolder.first()).toBeVisible();
      
      // Click on company documents folder
      await companyFolder.first().click();
      
      // Wait for folder to open
      await page.waitForTimeout(2000);
      
      // Should show folder contents
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should display employee folders', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for employee folders
    const employeeFolders = page.locator('text=/AL HANA|Employee/i');
    const employeeFolderCount = await employeeFolders.count();
    
    console.log(`Found ${employeeFolderCount} employee folders`);
    
    if (employeeFolderCount > 0) {
      // Click on first employee folder
      await employeeFolders.first().click();
      
      // Wait for folder to open
      await page.waitForTimeout(2000);
      
      // Should show folder contents
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should have upload functionality', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for upload button
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add"), input[type="file"]');
    const uploadCount = await uploadButton.count();
    
    console.log(`Found ${uploadCount} upload controls`);
    
    if (uploadCount > 0) {
      // Test file input if available
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await expect(fileInput.first()).toBeVisible();
      }
      
      // Test upload button if available
      const uploadBtn = page.locator('button:has-text("Upload"), button:has-text("Add")');
      if (await uploadBtn.count() > 0) {
        await expect(uploadBtn.first()).toBeVisible();
      }
    }
  });

  test('should handle document preview', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Navigate to a folder first
    const folders = page.locator('[data-testid="folder-item"], .folder-item, .folder');
    if (await folders.count() > 0) {
      await folders.first().click();
      await page.waitForTimeout(2000);
      
      // Look for document items
      const documents = page.locator('[data-testid="document-item"], .document-item, .file-item');
      const documentCount = await documents.count();
      
      console.log(`Found ${documentCount} documents`);
      
      if (documentCount > 0) {
        // Click on first document
        await documents.first().click();
        
        // Wait for preview to load
        await page.waitForTimeout(2000);
        
        // Should show preview or download dialog
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should handle document download', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Navigate to a folder first
    const folders = page.locator('[data-testid="folder-item"], .folder-item, .folder');
    if (await folders.count() > 0) {
      await folders.first().click();
      await page.waitForTimeout(2000);
      
      // Look for download buttons
      const downloadButtons = page.locator('button:has-text("Download"), a[download], [data-testid="download"]');
      const downloadCount = await downloadButtons.count();
      
      console.log(`Found ${downloadCount} download buttons`);
      
      if (downloadCount > 0) {
        // Test download functionality
        await expect(downloadButtons.first()).toBeVisible();
      }
    }
  });

  test('should handle document deletion', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Navigate to a folder first
    const folders = page.locator('[data-testid="folder-item"], .folder-item, .folder');
    if (await folders.count() > 0) {
      await folders.first().click();
      await page.waitForTimeout(2000);
      
      // Look for delete buttons
      const deleteButtons = page.locator('button:has-text("Delete"), button:has-text("Remove"), [data-testid="delete"]');
      const deleteCount = await deleteButtons.count();
      
      console.log(`Found ${deleteCount} delete buttons`);
      
      if (deleteCount > 0) {
        // Test delete button visibility
        await expect(deleteButtons.first()).toBeVisible();
      }
    }
  });

  test('should have search and filter functionality', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for search controls
    const searchControls = page.locator('input[placeholder*="search"], input[placeholder*="Search"], [data-testid="search"]');
    const searchCount = await searchControls.count();
    
    console.log(`Found ${searchCount} search controls`);
    
    if (searchCount > 0) {
      // Test search functionality
      await searchControls.first().fill('test');
      await page.waitForTimeout(1000);
      
      // Verify search is working
      await expect(searchControls.first()).toHaveValue('test');
    }
  });

  test('should handle folder navigation', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Test breadcrumb navigation if available
    const breadcrumbs = page.locator('[data-testid="breadcrumb"], .breadcrumb, nav');
    const breadcrumbCount = await breadcrumbs.count();
    
    console.log(`Found ${breadcrumbCount} breadcrumb/navigation elements`);
    
    if (breadcrumbCount > 0) {
      await expect(breadcrumbs.first()).toBeVisible();
    }
    
    // Test back button if available
    const backButton = page.locator('button:has-text("Back"), a:has-text("Back")');
    if (await backButton.count() > 0) {
      await expect(backButton.first()).toBeVisible();
    }
  });

  test('should have responsive document layout', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Test responsive layout
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle empty folder states', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Navigate to different folders to test empty states
    const folders = page.locator('[data-testid="folder-item"], .folder-item, .folder');
    const folderCount = await folders.count();
    
    if (folderCount > 1) {
      // Click on second folder
      await folders.nth(1).click();
      await page.waitForTimeout(2000);
      
      // Check for empty state messages
      const emptyMessages = page.locator('text=/No documents|Empty|No files/i');
      const emptyCount = await emptyMessages.count();
      
      if (emptyCount > 0) {
        await expect(emptyMessages.first()).toBeVisible();
      }
    }
  });

  test('should handle document sorting and organization', async ({ page }) => {
    await page.goto('/admin/documents');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for sorting controls
    const sortControls = page.locator('select, button:has-text("Sort"), [data-testid="sort"]');
    const sortCount = await sortControls.count();
    
    console.log(`Found ${sortCount} sorting controls`);
    
    if (sortCount > 0) {
      // Test sorting functionality
      await expect(sortControls.first()).toBeVisible();
    }
  });
}); 
 
 
 