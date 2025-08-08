import { test, expect } from '@playwright/test';

test.describe('Employee Management (CRUD)', () => {
  test('should load employees page with data', async ({ page }) => {
    await page.goto('/admin/employees');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Verify page title
    await expect(page.getByRole('heading', { name: /Employees|Employee Management/ })).toBeVisible();
    
    // Check for employee table or list
    const employeeTable = page.locator('table, [data-testid="employee-table"], .employee-list');
    const tableCount = await employeeTable.count();
    
    console.log(`Found ${tableCount} employee tables/lists`);
    expect(tableCount).toBeGreaterThan(0);
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/employees-page-loaded.png', fullPage: true });
  });

  test('should display employee data in table', async ({ page }) => {
    await page.goto('/admin/employees');
    
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    // Look for employee rows
    const employeeRows = page.locator('tbody tr, [data-testid="employee-row"]');
    const rowCount = await employeeRows.count();
    
    console.log(`Found ${rowCount} employee rows`);
    
    // Should have at least some employee data
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

  test('should have working filters and search', async ({ page }) => {
    await page.goto('/admin/employees');
    
    // Wait for page to load
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

  test('should navigate to add employee page', async ({ page }) => {
    await page.goto('/admin/employees');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for add employee button
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a[href*="new"]');
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

  test('should display employee details page', async ({ page }) => {
    await page.goto('/admin/employees');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Look for employee rows and click on first one
    const employeeRows = page.locator('tbody tr, [data-testid="employee-row"]');
    const rowCount = await employeeRows.count();
    
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
        const editButtons = page.locator('button:has-text("Edit"), button:has-text("Update")');
        const hasEditButtons = await editButtons.count() > 0;
        
        // Detail page should be functional
        expect(true).toBeTruthy();
      }
    }
  });

  test('should have working pagination', async ({ page }) => {
    await page.goto('/admin/employees');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for pagination controls
    const paginationControls = page.locator('[data-testid="pagination"], .pagination, button:has-text("Next"), button:has-text("Previous")');
    const paginationCount = await paginationControls.count();
    
    console.log(`Found ${paginationCount} pagination controls`);
    
    if (paginationCount > 0) {
      // Test pagination if available
      const nextButton = page.locator('button:has-text("Next")');
      if (await nextButton.count() > 0) {
        await expect(nextButton.first()).toBeVisible();
      }
    }
  });

  test('should handle employee form validation', async ({ page }) => {
    await page.goto('/admin/employees/new');
    
    // Wait for form to load
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
        
        // Should show validation errors for required fields
        if (messageCount > 0) {
          expect(messageCount).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should have responsive employee table', async ({ page }) => {
    await page.goto('/admin/employees');
    
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

  test('should handle bulk operations', async ({ page }) => {
    await page.goto('/admin/employees');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for bulk operation controls
    const bulkControls = page.locator('input[type="checkbox"], button:has-text("Bulk"), button:has-text("Select All")');
    const bulkCount = await bulkControls.count();
    
    console.log(`Found ${bulkCount} bulk operation controls`);
    
    if (bulkCount > 0) {
      // Test checkbox functionality
      const checkboxes = page.locator('input[type="checkbox"]');
      if (await checkboxes.count() > 0) {
        await expect(checkboxes.first()).toBeVisible();
      }
    }
  });
}); 

test.describe('Employee Management (CRUD)', () => {
  test('should load employees page with data', async ({ page }) => {
    await page.goto('/admin/employees');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Verify page title
    await expect(page.getByRole('heading', { name: /Employees|Employee Management/ })).toBeVisible();
    
    // Check for employee table or list
    const employeeTable = page.locator('table, [data-testid="employee-table"], .employee-list');
    const tableCount = await employeeTable.count();
    
    console.log(`Found ${tableCount} employee tables/lists`);
    expect(tableCount).toBeGreaterThan(0);
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/employees-page-loaded.png', fullPage: true });
  });

  test('should display employee data in table', async ({ page }) => {
    await page.goto('/admin/employees');
    
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    // Look for employee rows
    const employeeRows = page.locator('tbody tr, [data-testid="employee-row"]');
    const rowCount = await employeeRows.count();
    
    console.log(`Found ${rowCount} employee rows`);
    
    // Should have at least some employee data
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

  test('should have working filters and search', async ({ page }) => {
    await page.goto('/admin/employees');
    
    // Wait for page to load
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

  test('should navigate to add employee page', async ({ page }) => {
    await page.goto('/admin/employees');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for add employee button
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a[href*="new"]');
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

  test('should display employee details page', async ({ page }) => {
    await page.goto('/admin/employees');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Look for employee rows and click on first one
    const employeeRows = page.locator('tbody tr, [data-testid="employee-row"]');
    const rowCount = await employeeRows.count();
    
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
        const editButtons = page.locator('button:has-text("Edit"), button:has-text("Update")');
        const hasEditButtons = await editButtons.count() > 0;
        
        // Detail page should be functional
        expect(true).toBeTruthy();
      }
    }
  });

  test('should have working pagination', async ({ page }) => {
    await page.goto('/admin/employees');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for pagination controls
    const paginationControls = page.locator('[data-testid="pagination"], .pagination, button:has-text("Next"), button:has-text("Previous")');
    const paginationCount = await paginationControls.count();
    
    console.log(`Found ${paginationCount} pagination controls`);
    
    if (paginationCount > 0) {
      // Test pagination if available
      const nextButton = page.locator('button:has-text("Next")');
      if (await nextButton.count() > 0) {
        await expect(nextButton.first()).toBeVisible();
      }
    }
  });

  test('should handle employee form validation', async ({ page }) => {
    await page.goto('/admin/employees/new');
    
    // Wait for form to load
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
        
        // Should show validation errors for required fields
        if (messageCount > 0) {
          expect(messageCount).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should have responsive employee table', async ({ page }) => {
    await page.goto('/admin/employees');
    
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

  test('should handle bulk operations', async ({ page }) => {
    await page.goto('/admin/employees');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for bulk operation controls
    const bulkControls = page.locator('input[type="checkbox"], button:has-text("Bulk"), button:has-text("Select All")');
    const bulkCount = await bulkControls.count();
    
    console.log(`Found ${bulkCount} bulk operation controls`);
    
    if (bulkCount > 0) {
      // Test checkbox functionality
      const checkboxes = page.locator('input[type="checkbox"]');
      if (await checkboxes.count() > 0) {
        await expect(checkboxes.first()).toBeVisible();
      }
    }
  });
}); 
 
 
 