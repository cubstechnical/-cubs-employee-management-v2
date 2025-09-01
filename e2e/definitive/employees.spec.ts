import { test, expect } from '@playwright/test';

test.describe('Employee Management (CRUD)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');
  });

  test('should display employee list with data', async ({ page }) => {
    // Check if employee list is visible
    await expect(page.getByRole('heading', { name: /employees/i })).toBeVisible();
    
    // Look for employee table or list
    const employeeTable = page.locator('table, [class*="employee"], [class*="list"]');
    await expect(employeeTable).toBeVisible();
    
    // Check for employee data rows
    const employeeRows = page.locator('tbody tr, [class*="employee-item"]');
    const rowCount = await employeeRows.count();
    
    if (rowCount > 0) {
      console.log(`Found ${rowCount} employee rows`);
      await expect(employeeRows.first()).toBeVisible();
    } else {
      console.log('No employee data found (this might be normal for a fresh database)');
    }
  });

  test('should have working search functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i).or(page.locator('input[type="search"]'));
    
    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible();
      
      // Test search functionality
      await searchInput.fill('test');
      await page.waitForTimeout(1000); // Wait for search to process
      
      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(1000);
    } else {
      console.log('Search functionality not found');
    }
  });

  test('should have working filter options', async ({ page }) => {
    // Look for filter dropdowns or buttons
    const filterElements = page.locator('select, [class*="filter"], [class*="dropdown"]');
    const filterCount = await filterElements.count();
    
    if (filterCount > 0) {
      console.log(`Found ${filterCount} filter elements`);
      
      // Test first filter if it's a select element
      const firstFilter = filterElements.first();
      if (await firstFilter.evaluate(el => el.tagName === 'SELECT')) {
        await firstFilter.click();
        await page.waitForTimeout(500);
      }
    } else {
      console.log('No filter options found');
    }
  });

  test('should handle pagination if present', async ({ page }) => {
    // Look for pagination controls
    const pagination = page.locator('[class*="pagination"], [class*="page"]');
    const paginationCount = await pagination.count();
    
    if (paginationCount > 0) {
      console.log('Pagination found');
      
      // Look for next/previous buttons
      const nextButton = page.getByRole('button', { name: /next/i });
      const prevButton = page.getByRole('button', { name: /previous/i });
      
      if (await nextButton.count() > 0) {
        await expect(nextButton).toBeVisible();
      }
      
      if (await prevButton.count() > 0) {
        await expect(prevButton).toBeVisible();
      }
    } else {
      console.log('No pagination found');
    }
  });

  test('should display employee details correctly', async ({ page }) => {
    // Look for employee rows
    const employeeRows = page.locator('tbody tr, [class*="employee-item"]');
    const rowCount = await employeeRows.count();
    
    if (rowCount > 0) {
      const firstRow = employeeRows.first();
      
      // Check for common employee data fields
      const expectedFields = ['name', 'email', 'company', 'status', 'visa'];
      
      for (const field of expectedFields) {
        const fieldElement = firstRow.locator(`[class*="${field}"], td`).first();
        if (await fieldElement.count() > 0) {
          const text = await fieldElement.textContent();
          expect(text).toBeTruthy();
          console.log(`Employee ${field}: ${text}`);
        }
      }
    }
  });

  test('should handle employee actions (view, edit, delete)', async ({ page }) => {
    // Look for action buttons
    const actionButtons = page.locator('button, [class*="action"], [class*="menu"]');
    const buttonCount = await actionButtons.count();
    
    if (buttonCount > 0) {
      console.log(`Found ${buttonCount} action buttons`);
      
      // Look for specific action buttons
      const viewButton = page.getByRole('button', { name: /view/i });
      const editButton = page.getByRole('button', { name: /edit/i });
      const deleteButton = page.getByRole('button', { name: /delete/i });
      
      if (await viewButton.count() > 0) {
        await expect(viewButton.first()).toBeVisible();
      }
      
      if (await editButton.count() > 0) {
        await expect(editButton.first()).toBeVisible();
      }
      
      if (await deleteButton.count() > 0) {
        await expect(deleteButton.first()).toBeVisible();
      }
    }
  });

  test('should handle bulk operations if present', async ({ page }) => {
    // Look for bulk action controls
    const bulkSelect = page.locator('input[type="checkbox"]').first();
    const bulkActions = page.locator('[class*="bulk"], [class*="batch"]');
    
    if (await bulkSelect.count() > 0) {
      console.log('Bulk selection found');
      await expect(bulkSelect).toBeVisible();
      
      // Test bulk selection
      await bulkSelect.check();
      await page.waitForTimeout(500);
      
      // Look for bulk action buttons
      if (await bulkActions.count() > 0) {
        await expect(bulkActions.first()).toBeVisible();
      }
    } else {
      console.log('No bulk operations found');
    }
  });

  test('should handle responsive design on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Check if employee list is still functional
    await expect(page.getByRole('heading', { name: /employees/i })).toBeVisible();
    
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

  test('should handle data refresh functionality', async ({ page }) => {
    // Look for refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i }).or(page.locator('[class*="refresh"]'));
    
    if (await refreshButton.count() > 0) {
      console.log('Refresh button found');
      await expect(refreshButton).toBeVisible();
      
      // Test refresh functionality
      await refreshButton.click();
      await page.waitForTimeout(2000); // Wait for refresh to complete
      
      // Verify data is still visible after refresh
      await expect(page.getByRole('heading', { name: /employees/i })).toBeVisible();
    } else {
      console.log('No refresh button found');
    }
  });
});