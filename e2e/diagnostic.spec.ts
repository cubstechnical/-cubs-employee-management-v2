import { test, expect } from '@playwright/test';

test.describe('Application State Diagnostic', () => {
  test('should check application state and form accessibility', async ({ page }) => {
    console.log('🔍 Starting application state diagnostic...');
    
    // 1. Check if we can access the application
    await page.goto('/');
    console.log('✅ Root page loaded');
    
    // 2. Check current URL and redirect behavior
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    // 3. Check if we're authenticated by looking for admin elements
    const adminElements = page.locator('text=/admin/i').or(page.locator('[href*="admin"]')).or(page.locator('[data-testid*="admin"]'));
    const adminCount = await adminElements.count();
    console.log('🔐 Admin elements found:', adminCount);
    
    // 4. Try to navigate to admin dashboard
    await page.goto('/admin/dashboard');
    await page.waitForTimeout(3000);
    
    const dashboardUrl = page.url();
    console.log('📍 Dashboard URL:', dashboardUrl);
    
    // 5. Check if dashboard loaded properly
    const bodyText = await page.locator('body').textContent();
    console.log('📄 Body text preview:', bodyText?.substring(0, 200));
    
    // 6. Check for loading states
    const loadingElements = page.locator('text=/loading/i').or(page.locator('[class*="loading"]')).or(page.locator('[class*="spinner"]'));
    const loadingCount = await loadingElements.count();
    console.log('⏳ Loading elements found:', loadingCount);
    
    // 7. Check for error messages
    const errorElements = page.locator('text=/error/i').or(page.locator('[class*="error"]')).or(page.locator('[role="alert"]'));
    const errorCount = await errorElements.count();
    console.log('❌ Error elements found:', errorCount);
    
    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorElements.nth(i).textContent();
        console.log(`Error ${i + 1}:`, errorText);
      }
    }
    
    // 8. Try to navigate to employees page
    await page.goto('/admin/employees');
    await page.waitForTimeout(3000);
    
    const employeesUrl = page.url();
    console.log('📍 Employees URL:', employeesUrl);
    
    // 9. Check for form elements and their state
    const formElements = page.locator('form, input, select, button');
    const formCount = await formElements.count();
    console.log('📝 Form elements found:', formCount);
    
    // 10. Check for disabled elements
    const disabledElements = page.locator('[disabled], [aria-disabled="true"]');
    const disabledCount = await disabledElements.count();
    console.log('🚫 Disabled elements found:', disabledCount);
    
    if (disabledCount > 0) {
      for (let i = 0; i < Math.min(disabledCount, 5); i++) {
        const disabledElement = disabledElements.nth(i);
        const tagName = await disabledElement.evaluate(el => el.tagName);
        const className = await disabledElement.getAttribute('class');
        const id = await disabledElement.getAttribute('id');
        console.log(`Disabled element ${i + 1}:`, { tagName, className, id });
      }
    }
    
    // 11. Check for authentication state
    const authElements = page.locator('text=/login/i').or(page.locator('text=/sign in/i')).or(page.locator('[href*="login"]'));
    const authCount = await authElements.count();
    console.log('🔑 Authentication elements found:', authCount);
    
    // 12. Take a screenshot for visual inspection
    await page.screenshot({ path: 'test-results/diagnostic-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved to test-results/diagnostic-screenshot.png');
    
    // Basic assertions to ensure the page is functional
    await expect(page.locator('body')).toBeVisible();
    console.log('✅ Diagnostic completed successfully');
  });
  
  test('should check employee form state specifically', async ({ page }) => {
    console.log('🔍 Checking employee form state...');
    
    // Navigate to employee form
    await page.goto('/admin/employees/new');
    await page.waitForTimeout(3000);
    
    console.log('📍 Employee form URL:', page.url());
    
    // Check for form elements
    const form = page.locator('form');
    const formCount = await form.count();
    console.log('📝 Forms found:', formCount);
    
    if (formCount > 0) {
      // Check form state
      const isDisabled = await form.first().getAttribute('disabled');
      console.log('🚫 Form disabled:', isDisabled);
      
      // Check input elements
      const inputs = page.locator('input, select, textarea');
      const inputCount = await inputs.count();
      console.log('📝 Input elements found:', inputCount);
      
      for (let i = 0; i < Math.min(inputCount, 10); i++) {
        const input = inputs.nth(i);
        const tagName = await input.evaluate(el => el.tagName);
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const disabled = await input.getAttribute('disabled');
        const placeholder = await input.getAttribute('placeholder');
        
        console.log(`Input ${i + 1}:`, { tagName, type, name, disabled, placeholder });
      }
      
      // Check for company select specifically
      const companySelect = page.locator('select[name*="company"], select[id*="company"], select[class*="company"]');
      const companySelectCount = await companySelect.count();
      console.log('🏢 Company selects found:', companySelectCount);
      
      if (companySelectCount > 0) {
        const isCompanyDisabled = await companySelect.first().getAttribute('disabled');
        console.log('🚫 Company select disabled:', isCompanyDisabled);
        
        // Check options
        const options = companySelect.first().locator('option');
        const optionCount = await options.count();
        console.log('📋 Company options found:', optionCount);
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/employee-form-screenshot.png', fullPage: true });
    console.log('📸 Employee form screenshot saved');
  });
});
