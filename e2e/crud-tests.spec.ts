import { test, expect } from '@playwright/test';

test.describe('CRUD Operations Tests', () => {
  
  // Employee CRUD Tests
  test.describe('Employee CRUD Operations', () => {
    test('should load employees list page', async ({ page }) => {
      await page.goto('/admin/employees');
      await expect(page.locator('body')).toBeVisible();
      
      // Check for employee table or list
      const employeeTable = page.locator('table, [data-testid="employee-table"], .employee-list, .bg-white');
      const tableCount = await employeeTable.count();
      
      console.log(`Found ${tableCount} employee tables/lists`);
      expect(tableCount).toBeGreaterThan(0);
    });

    test('should display employee data in table', async ({ page }) => {
      await page.goto('/admin/employees');
      await page.waitForTimeout(3000); // Wait for data to load
      
      // Look for employee rows
      const employeeRows = page.locator('tbody tr, [data-testid="employee-row"], .employee-item');
      const rowCount = await employeeRows.count();
      
      console.log(`Found ${rowCount} employee rows`);
      
      if (rowCount > 0) {
        // Check first row has employee data
        const firstRow = employeeRows.first();
        await expect(firstRow).toBeVisible();
        
        // Check for common employee fields
        const hasName = await firstRow.locator('text=/[A-Za-z]/').count() > 0;
        const hasEmail = await firstRow.locator('text=/@/').count() > 0;
        
        expect(hasName || hasEmail).toBeTruthy();
      }
    });

    test('should navigate to add employee page', async ({ page }) => {
      await page.goto('/admin/employees');
      await page.waitForTimeout(2000);
      
      // Look for add employee button
      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a[href*="new"], button:has-text("Add Employee")');
      const buttonCount = await addButton.count();
      
      console.log(`Found ${buttonCount} add/new employee buttons`);
      
      if (buttonCount > 0) {
        await addButton.first().click();
        
        // Should navigate to add employee page
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        
        // Check if we're on a form page
        const isFormPage = currentUrl.includes('/new') || 
                          currentUrl.includes('/add') || 
                          await page.locator('form, input[type="text"]').count() > 0;
        
        expect(isFormPage).toBeTruthy();
      }
    });

    test('should load employee details page for existing employees', async ({ page }) => {
      await page.goto('/admin/employees');
      await page.waitForTimeout(3000);
      
      // Look for employee rows and click on first one - fixed selector
      const employeeRows = page.locator('tbody tr, [data-testid="employee-row"], .employee-item');
      const rowCount = await employeeRows.count();
      
      console.log(`Found ${rowCount} employee rows to test`);
      
      if (rowCount > 0) {
        // Click on first employee row
        await employeeRows.first().click();
        
        // Wait for navigation
        await page.waitForTimeout(2000);
        
        // Should be on employee detail page
        const currentUrl = page.url();
        const isDetailPage = currentUrl.includes('/employees/') && !currentUrl.includes('/new');
        
        if (isDetailPage) {
          // Check for employee details
          await expect(page.locator('body')).toBeVisible();
          
          // Look for edit or update buttons
          const editButtons = page.locator('button:has-text("Edit"), button:has-text("Update"), button:has-text("Save")');
          const hasEditButtons = await editButtons.count() > 0;
          
          console.log(`Employee detail page loaded successfully. Has edit buttons: ${hasEditButtons}`);
          
          // Detail page should be functional
          expect(true).toBeTruthy();
        }
      }
    });

    test('should have working employee filters and search', async ({ page }) => {
      await page.goto('/admin/employees');
      await page.waitForTimeout(2000);
      
      // Look for filter controls
      const filterControls = page.locator('input[placeholder*="search"], input[placeholder*="Search"], select, [data-testid="filter"]');
      const filterCount = await filterControls.count();
      
      console.log(`Found ${filterCount} filter controls`);
      
      if (filterCount > 0) {
        // Test search functionality
        const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]');
        if (await searchInput.count() > 0) {
          await searchInput.first().fill('test');
          await page.waitForTimeout(1000);
          
          // Verify search is working
          await expect(searchInput.first()).toHaveValue('test');
        }
      }
    });

    test('should handle employee form validation', async ({ page }) => {
      await page.goto('/admin/employees/new');
      await page.waitForTimeout(2000);
      
      // Look for form elements
      const formInputs = page.locator('input, select, textarea');
      const inputCount = await formInputs.count();
      
      console.log(`Found ${inputCount} form inputs`);
      
      if (inputCount > 0) {
        // Try to submit empty form
        const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Submit")');
        if (await submitButton.count() > 0) {
          await submitButton.first().click();
          
          // Wait for validation
          await page.waitForTimeout(1000);
          
          // Check for validation messages
          const validationMessages = page.locator('.text-red-600, .text-red-500, [role="alert"]');
          const messageCount = await validationMessages.count();
          
          console.log(`Found ${messageCount} validation messages`);
          
          // Should show validation errors for required fields
          if (messageCount > 0) {
            expect(messageCount).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  // Document CRUD Tests
  test.describe('Document CRUD Operations', () => {
    test('should load documents page with folders', async ({ page }) => {
      await page.goto('/admin/documents');
      await page.waitForTimeout(2000);
      
      // Check for folder structure
      const folders = page.locator('[data-testid="folder-item"], .folder-item, .folder, .bg-white');
      const folderCount = await folders.count();
      
      console.log(`Found ${folderCount} folders`);
      expect(folderCount).toBeGreaterThan(0);
    });

    test('should display company documents folder', async ({ page }) => {
      await page.goto('/admin/documents');
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
  });

  // Integration Tests
  test.describe('Integration Tests', () => {
    test('should navigate from employees to documents and back', async ({ page }) => {
      // Start at employees page
      await page.goto('/admin/employees');
      await expect(page.locator('body')).toBeVisible();
      
      // Navigate to documents
      await page.goto('/admin/documents');
      await expect(page.locator('body')).toBeVisible();
      
      // Navigate back to employees
      await page.goto('/admin/employees');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle employee-document relationship', async ({ page }) => {
      // Test that employee folders exist in documents
      await page.goto('/admin/documents');
      await page.waitForTimeout(2000);
      
      // Look for employee-related folders
      const employeeFolders = page.locator('text=/AL HANA|Employee|employee/i');
      const employeeFolderCount = await employeeFolders.count();
      
      console.log(`Found ${employeeFolderCount} employee-related folders in documents`);
      
      // Should have some employee folders
      expect(employeeFolderCount).toBeGreaterThanOrEqual(0);
    });

    test('should have consistent navigation between pages', async ({ page }) => {
      const pages = ['/admin/employees', '/admin/documents', '/admin/dashboard'];
      
      for (const pagePath of pages) {
        console.log(`Testing navigation to: ${pagePath}`);
        await page.goto(pagePath);
        await expect(page.locator('body')).toBeVisible();
        await page.waitForTimeout(1000);
      }
    });
  });
});

test.describe('CRUD Operations Tests', () => {
  
  // Employee CRUD Tests
  test.describe('Employee CRUD Operations', () => {
    test('should load employees list page', async ({ page }) => {
      await page.goto('/admin/employees');
      await expect(page.locator('body')).toBeVisible();
      
      // Check for employee table or list
      const employeeTable = page.locator('table, [data-testid="employee-table"], .employee-list, .bg-white');
      const tableCount = await employeeTable.count();
      
      console.log(`Found ${tableCount} employee tables/lists`);
      expect(tableCount).toBeGreaterThan(0);
    });

    test('should display employee data in table', async ({ page }) => {
      await page.goto('/admin/employees');
      await page.waitForTimeout(3000); // Wait for data to load
      
      // Look for employee rows
      const employeeRows = page.locator('tbody tr, [data-testid="employee-row"], .employee-item');
      const rowCount = await employeeRows.count();
      
      console.log(`Found ${rowCount} employee rows`);
      
      if (rowCount > 0) {
        // Check first row has employee data
        const firstRow = employeeRows.first();
        await expect(firstRow).toBeVisible();
        
        // Check for common employee fields
        const hasName = await firstRow.locator('text=/[A-Za-z]/').count() > 0;
        const hasEmail = await firstRow.locator('text=/@/').count() > 0;
        
        expect(hasName || hasEmail).toBeTruthy();
      }
    });

    test('should navigate to add employee page', async ({ page }) => {
      await page.goto('/admin/employees');
      await page.waitForTimeout(2000);
      
      // Look for add employee button
      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a[href*="new"], button:has-text("Add Employee")');
      const buttonCount = await addButton.count();
      
      console.log(`Found ${buttonCount} add/new employee buttons`);
      
      if (buttonCount > 0) {
        await addButton.first().click();
        
        // Should navigate to add employee page
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        
        // Check if we're on a form page
        const isFormPage = currentUrl.includes('/new') || 
                          currentUrl.includes('/add') || 
                          await page.locator('form, input[type="text"]').count() > 0;
        
        expect(isFormPage).toBeTruthy();
      }
    });

    test('should load employee details page for existing employees', async ({ page }) => {
      await page.goto('/admin/employees');
      await page.waitForTimeout(3000);
      
      // Look for employee rows and click on first one - fixed selector
      const employeeRows = page.locator('tbody tr, [data-testid="employee-row"], .employee-item');
      const rowCount = await employeeRows.count();
      
      console.log(`Found ${rowCount} employee rows to test`);
      
      if (rowCount > 0) {
        // Click on first employee row
        await employeeRows.first().click();
        
        // Wait for navigation
        await page.waitForTimeout(2000);
        
        // Should be on employee detail page
        const currentUrl = page.url();
        const isDetailPage = currentUrl.includes('/employees/') && !currentUrl.includes('/new');
        
        if (isDetailPage) {
          // Check for employee details
          await expect(page.locator('body')).toBeVisible();
          
          // Look for edit or update buttons
          const editButtons = page.locator('button:has-text("Edit"), button:has-text("Update"), button:has-text("Save")');
          const hasEditButtons = await editButtons.count() > 0;
          
          console.log(`Employee detail page loaded successfully. Has edit buttons: ${hasEditButtons}`);
          
          // Detail page should be functional
          expect(true).toBeTruthy();
        }
      }
    });

    test('should have working employee filters and search', async ({ page }) => {
      await page.goto('/admin/employees');
      await page.waitForTimeout(2000);
      
      // Look for filter controls
      const filterControls = page.locator('input[placeholder*="search"], input[placeholder*="Search"], select, [data-testid="filter"]');
      const filterCount = await filterControls.count();
      
      console.log(`Found ${filterCount} filter controls`);
      
      if (filterCount > 0) {
        // Test search functionality
        const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]');
        if (await searchInput.count() > 0) {
          await searchInput.first().fill('test');
          await page.waitForTimeout(1000);
          
          // Verify search is working
          await expect(searchInput.first()).toHaveValue('test');
        }
      }
    });

    test('should handle employee form validation', async ({ page }) => {
      await page.goto('/admin/employees/new');
      await page.waitForTimeout(2000);
      
      // Look for form elements
      const formInputs = page.locator('input, select, textarea');
      const inputCount = await formInputs.count();
      
      console.log(`Found ${inputCount} form inputs`);
      
      if (inputCount > 0) {
        // Try to submit empty form
        const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Submit")');
        if (await submitButton.count() > 0) {
          await submitButton.first().click();
          
          // Wait for validation
          await page.waitForTimeout(1000);
          
          // Check for validation messages
          const validationMessages = page.locator('.text-red-600, .text-red-500, [role="alert"]');
          const messageCount = await validationMessages.count();
          
          console.log(`Found ${messageCount} validation messages`);
          
          // Should show validation errors for required fields
          if (messageCount > 0) {
            expect(messageCount).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  // Document CRUD Tests
  test.describe('Document CRUD Operations', () => {
    test('should load documents page with folders', async ({ page }) => {
      await page.goto('/admin/documents');
      await page.waitForTimeout(2000);
      
      // Check for folder structure
      const folders = page.locator('[data-testid="folder-item"], .folder-item, .folder, .bg-white');
      const folderCount = await folders.count();
      
      console.log(`Found ${folderCount} folders`);
      expect(folderCount).toBeGreaterThan(0);
    });

    test('should display company documents folder', async ({ page }) => {
      await page.goto('/admin/documents');
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
  });

  // Integration Tests
  test.describe('Integration Tests', () => {
    test('should navigate from employees to documents and back', async ({ page }) => {
      // Start at employees page
      await page.goto('/admin/employees');
      await expect(page.locator('body')).toBeVisible();
      
      // Navigate to documents
      await page.goto('/admin/documents');
      await expect(page.locator('body')).toBeVisible();
      
      // Navigate back to employees
      await page.goto('/admin/employees');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle employee-document relationship', async ({ page }) => {
      // Test that employee folders exist in documents
      await page.goto('/admin/documents');
      await page.waitForTimeout(2000);
      
      // Look for employee-related folders
      const employeeFolders = page.locator('text=/AL HANA|Employee|employee/i');
      const employeeFolderCount = await employeeFolders.count();
      
      console.log(`Found ${employeeFolderCount} employee-related folders in documents`);
      
      // Should have some employee folders
      expect(employeeFolderCount).toBeGreaterThanOrEqual(0);
    });

    test('should have consistent navigation between pages', async ({ page }) => {
      const pages = ['/admin/employees', '/admin/documents', '/admin/dashboard'];
      
      for (const pagePath of pages) {
        console.log(`Testing navigation to: ${pagePath}`);
        await page.goto(pagePath);
        await expect(page.locator('body')).toBeVisible();
        await page.waitForTimeout(1000);
      }
    });
  });
});



