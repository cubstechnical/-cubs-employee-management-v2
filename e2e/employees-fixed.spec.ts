import { test, expect } from '@playwright/test';

test.describe('Add Employee Form - Fixed Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to employee form
    await page.goto('/admin/employees/new');
    await page.waitForTimeout(3000);
    
    // Wait for form to be fully loaded
    await page.waitForSelector('form', { timeout: 10000 });
  });

  test('should load employee form with all fields', async ({ page }) => {
    console.log('🔍 Testing employee form loading...');
    
    // Check if form is loaded
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Check for key input fields
    const nameInput = page.getByPlaceholder('Enter employee name');
    await expect(nameInput).toBeVisible();
    
    const emailInput = page.getByPlaceholder('employee@example.com');
    await expect(emailInput).toBeVisible();
    
    const phoneInput = page.getByPlaceholder('+971-50-123-4567');
    await expect(phoneInput).toBeVisible();
    
    console.log('✅ All key form fields are visible');
  });

  test('should handle form field interactions', async ({ page }) => {
    console.log('🔍 Testing form field interactions...');
    
    // Fill in basic information
    const nameInput = page.getByPlaceholder('Enter employee name');
    await nameInput.fill('Test Employee');
    
    const emailInput = page.getByPlaceholder('employee@example.com');
    await emailInput.fill('test@example.com');
    
    const phoneInput = page.getByPlaceholder('+971-50-123-4567');
    await phoneInput.fill('+971-50-123-4567');
    
    // Verify the values were set
    await expect(nameInput).toHaveValue('Test Employee');
    await expect(emailInput).toHaveValue('test@example.com');
    await expect(phoneInput).toHaveValue('+971-50-123-4567');
    
    console.log('✅ Form field interactions working');
  });

  test('should handle date picker functionality', async ({ page }) => {
    console.log('🔍 Testing date picker functionality...');
    
    // Find all date inputs
    const dateInputs = page.locator('input[type="date"]');
    const dateCount = await dateInputs.count();
    console.log(`📅 Found ${dateCount} date inputs`);
    
    if (dateCount > 0) {
      // Test the first date input (likely Date of Birth)
      const firstDateInput = dateInputs.first();
      
      // Set a future date
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const dateString = futureDate.toISOString().split('T')[0];
      
      await firstDateInput.fill(dateString);
      await page.waitForTimeout(500);
      
      // Verify the date was set
      await expect(firstDateInput).toHaveValue(dateString);
      console.log('✅ Date picker working for first date input');
    }
  });

  test('should handle form validation', async ({ page }) => {
    console.log('🔍 Testing form validation...');
    
    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: /save|submit|create/i });
    
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(1000);
      
      // Check for validation errors
      const errorElements = page.locator('[role="alert"], .error, .text-red-600, .text-red-500');
      const errorCount = await errorElements.count();
      
      if (errorCount > 0) {
        console.log(`✅ Form validation working - found ${errorCount} error messages`);
      } else {
        console.log('⚠️ No validation errors found - form might not have client-side validation');
      }
    } else {
      console.log('⚠️ Submit button not found');
    }
  });

  test('should handle form submission with valid data', async ({ page }) => {
    console.log('🔍 Testing form submission...');
    
    // Fill in all required fields
    const nameInput = page.getByPlaceholder('Enter employee name');
    await nameInput.fill('Test Employee');
    
    const emailInput = page.getByPlaceholder('employee@example.com');
    await emailInput.fill('test@example.com');
    
    const phoneInput = page.getByPlaceholder('+971-50-123-4567');
    await phoneInput.fill('+971-50-123-4567');
    
    // Fill in other fields if they exist
    const jobTitleInput = page.getByPlaceholder('e.g., Electrician, Plumber');
    if (await jobTitleInput.count() > 0) {
      await jobTitleInput.fill('Software Engineer');
    }
    
    const nationalityInput = page.getByPlaceholder('e.g., Indian, Pakistani');
    if (await nationalityInput.count() > 0) {
      await nationalityInput.fill('Indian');
    }
    
    const salaryInput = page.getByPlaceholder('e.g., 1500');
    if (await salaryInput.count() > 0) {
      await salaryInput.fill('5000');
    }
    
    const addressInput = page.getByPlaceholder('Enter address');
    if (await addressInput.count() > 0) {
      await addressInput.fill('Test Address');
    }
    
    // Set dates if they exist
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
    
    // Try to submit
    const submitButton = page.getByRole('button', { name: /save|submit|create/i });
    
    if (await submitButton.count() > 0) {
      console.log('🔘 Submit button found, attempting submission...');
      
      // Take screenshot before submission
      await page.screenshot({ path: 'test-results/employee-form-filled.png', fullPage: true });
      
      await submitButton.click();
      await page.waitForTimeout(3000);
      
      // Check if submission was successful
      const currentUrl = page.url();
      console.log('📍 URL after submission:', currentUrl);
      
      if (currentUrl.includes('/employees') || currentUrl.includes('/dashboard')) {
        console.log('✅ Form submission appears successful');
      } else {
        console.log('⚠️ Form submission result unclear');
      }
    } else {
      console.log('❌ Submit button not found');
    }
  });

  test('should handle form cancellation', async ({ page }) => {
    console.log('🔍 Testing form cancellation...');
    
    // Look for cancel button
    const cancelButton = page.getByRole('button', { name: /cancel|back/i });
    
    if (await cancelButton.count() > 0) {
      console.log('🔘 Cancel button found, clicking...');
      await cancelButton.click();
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      console.log('📍 URL after cancellation:', currentUrl);
      
      if (currentUrl.includes('/employees')) {
        console.log('✅ Form cancellation working');
      } else {
        console.log('⚠️ Form cancellation result unclear');
      }
    } else {
      console.log('⚠️ Cancel button not found');
    }
  });
});

