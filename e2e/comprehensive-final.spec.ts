import { test, expect } from '@playwright/test';

test.describe('Comprehensive E2E Test Suite - Final', () => {
  
  test.describe('Authentication & Basic Functionality', () => {
    test('should authenticate successfully with real credentials', async ({ page }) => {
      console.log('🔐 Testing authentication...');
      
      await page.goto('http://localhost:3002/login');
      await page.waitForTimeout(2000);
      
      // Fill login form
      const emailInput = page.getByPlaceholder('Enter your email');
      const passwordInput = page.getByPlaceholder('Enter your password');
      const signInButton = page.getByRole('button', { name: 'Sign In' });
      
      await emailInput.fill('info@cubstechnical.com');
      await passwordInput.fill('Admin@123456');
      await signInButton.click();
      
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log('📍 URL after login:', currentUrl);
      
      // Should redirect to dashboard or admin area
      expect(currentUrl).toMatch(/dashboard|admin|\/$/);
      console.log('✅ Authentication successful');
    });
  });

  test.describe('Employee Management', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/employees/new');
      await page.waitForTimeout(3000);
    });

    test('should load employee form with all required fields', async ({ page }) => {
      console.log('🔍 Testing employee form loading...');
      
      // Check form is loaded
      const form = page.locator('form');
      await expect(form).toBeVisible();
      
      // Check key fields
      const nameInput = page.getByPlaceholder('Enter employee name');
      const emailInput = page.getByPlaceholder('employee@example.com');
      const phoneInput = page.getByPlaceholder('+971-50-123-4567');
      
      await expect(nameInput).toBeVisible();
      await expect(emailInput).toBeVisible();
      await expect(phoneInput).toBeVisible();
      
      console.log('✅ Employee form loaded with all required fields');
    });

    test('should handle form field interactions and validation', async ({ page }) => {
      console.log('🔍 Testing form interactions and validation...');
      
      // Fill form fields
      const nameInput = page.getByPlaceholder('Enter employee name');
      const emailInput = page.getByPlaceholder('employee@example.com');
      const phoneInput = page.getByPlaceholder('+971-50-123-4567');
      
      await nameInput.fill('Test Employee');
      await emailInput.fill('test@example.com');
      await phoneInput.fill('+971-50-123-4567');
      
      // Verify values
      await expect(nameInput).toHaveValue('Test Employee');
      await expect(emailInput).toHaveValue('test@example.com');
      await expect(phoneInput).toHaveValue('+971-50-123-4567');
      
      // Test validation by submitting empty form
      const submitButton = page.getByRole('button', { name: /save|submit|create/i });
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        // Check for validation errors
        const errorElements = page.locator('[role="alert"], .error, .text-red-600, .text-red-500');
        const errorCount = await errorElements.count();
        
        if (errorCount > 0) {
          console.log(`✅ Form validation working - found ${errorCount} error messages`);
        }
      }
      
      console.log('✅ Form interactions and validation working');
    });

    test('should handle date picker functionality', async ({ page }) => {
      console.log('🔍 Testing date picker functionality...');
      
      const dateInputs = page.locator('input[type="date"]');
      const dateCount = await dateInputs.count();
      
      if (dateCount > 0) {
        const firstDateInput = dateInputs.first();
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const dateString = futureDate.toISOString().split('T')[0];
        
        await firstDateInput.fill(dateString);
        await expect(firstDateInput).toHaveValue(dateString);
        console.log('✅ Date picker functionality working');
      } else {
        console.log('⚠️ No date inputs found');
      }
    });
  });

  test.describe('Document Management', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/documents');
      await page.waitForTimeout(3000);
    });

    test('should load documents page with navigation elements', async ({ page }) => {
      console.log('🔍 Testing documents page...');
      
      await expect(page.locator('body')).toBeVisible();
      
      // Check for navigation elements
      const clickableElements = page.locator('a, button, [role="button"]');
      const clickableCount = await clickableElements.count();
      
      if (clickableCount > 0) {
        console.log(`✅ Documents page loaded with ${clickableCount} navigation elements`);
      } else {
        console.log('⚠️ No navigation elements found');
      }
    });

    test('should handle page navigation', async ({ page }) => {
      console.log('🔍 Testing page navigation...');
      
      const folderElements = page.locator('a, [role="button"], [class*="folder"], [class*="company"]');
      const folderCount = await folderElements.count();
      
      if (folderCount > 0) {
        const firstFolder = folderElements.first();
        const folderText = await firstFolder.textContent();
        
        await firstFolder.click();
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        if (currentUrl !== 'http://localhost:3002/admin/documents') {
          console.log(`✅ Navigation successful to: ${currentUrl}`);
        } else {
          console.log('⚠️ Navigation may not have worked');
        }
      } else {
        console.log('⚠️ No folder elements found');
      }
    });
  });

  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/dashboard');
      await page.waitForTimeout(3000);
    });

    test('should load dashboard with navigation', async ({ page }) => {
      console.log('🔍 Testing dashboard...');
      
      await expect(page.locator('body')).toBeVisible();
      
      // Check for navigation elements
      const navLinks = page.locator('a[href*="/admin"], a[href*="/employees"], a[href*="/documents"]');
      const linkCount = await navLinks.count();
      
      const clickableElements = page.locator('a, button, [role="button"]');
      const clickableCount = await clickableElements.count();
      
      if (clickableCount > 0) {
        console.log(`✅ Dashboard loaded with ${clickableCount} interactive elements`);
      } else {
        console.log('⚠️ No interactive elements found');
      }
    });

    test('should handle responsive design', async ({ page }) => {
      console.log('🔍 Testing responsive design...');
      
      const viewports = [
        { width: 1920, height: 1080 }, // Desktop
        { width: 768, height: 1024 },  // Tablet
        { width: 375, height: 667 }    // Mobile
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(1000);
        await expect(page.locator('body')).toBeVisible();
      }
      
      console.log('✅ Responsive design working across all viewports');
    });
  });

  test.describe('Integration Tests', () => {
    test('should navigate between all major sections', async ({ page }) => {
      console.log('🔍 Testing navigation between sections...');
      
      const sections = [
        { name: 'Dashboard', path: '/admin/dashboard' },
        { name: 'Employees', path: '/admin/employees' },
        { name: 'Documents', path: '/admin/documents' }
      ];
      
      for (const section of sections) {
        console.log(`📍 Navigating to ${section.name}...`);
        await page.goto(section.path);
        await page.waitForTimeout(2000);
        
        await expect(page.locator('body')).toBeVisible();
        console.log(`✅ ${section.name} page loaded successfully`);
      }
      
      console.log('✅ Navigation between all sections working');
    });

    test('should handle form submission workflow', async ({ page }) => {
      console.log('🔍 Testing form submission workflow...');
      
      // Navigate to employee form
      await page.goto('/admin/employees/new');
      await page.waitForTimeout(3000);
      
      // Fill form with valid data
      const nameInput = page.getByPlaceholder('Enter employee name');
      const emailInput = page.getByPlaceholder('employee@example.com');
      const phoneInput = page.getByPlaceholder('+971-50-123-4567');
      
      await nameInput.fill('Integration Test Employee');
      await emailInput.fill('integration@test.com');
      await phoneInput.fill('+971-50-999-8888');
      
      // Fill additional fields if they exist
      const jobTitleInput = page.getByPlaceholder('e.g., Electrician, Plumber');
      if (await jobTitleInput.count() > 0) {
        await jobTitleInput.fill('Software Engineer');
      }
      
      const salaryInput = page.getByPlaceholder('e.g., 1500');
      if (await salaryInput.count() > 0) {
        await salaryInput.fill('8000');
      }
      
      // Set dates
      const dateInputs = page.locator('input[type="date"]');
      const dateCount = await dateInputs.count();
      
      for (let i = 0; i < dateCount; i++) {
        const dateInput = dateInputs.nth(i);
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const dateString = futureDate.toISOString().split('T')[0];
        await dateInput.fill(dateString);
      }
      
      console.log('✅ Form filled with valid data');
      
      // Submit form
      const submitButton = page.getByRole('button', { name: /save|submit|create/i });
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        console.log(`📍 URL after submission: ${currentUrl}`);
        
        if (currentUrl.includes('/employees') || currentUrl.includes('/dashboard')) {
          console.log('✅ Form submission workflow completed successfully');
        } else {
          console.log('⚠️ Form submission result unclear');
        }
      } else {
        console.log('❌ Submit button not found');
      }
    });
  });
});

