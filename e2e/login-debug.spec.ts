import { test, expect } from '@playwright/test';

test.describe('Login Debug', () => {
  test('should debug login process step by step', async ({ page }) => {
    console.log('🔍 Starting login debug...');
    
    // 1. Navigate to login page
    await page.goto('http://localhost:3002/login');
    console.log('✅ Login page loaded');
    
    // 2. Wait for page to fully load
    await page.waitForTimeout(3000);
    
    // 3. Check page title and content
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    const bodyText = await page.locator('body').textContent();
    console.log('📄 Body text preview:', bodyText?.substring(0, 300));
    
    // 4. Look for form elements
    const forms = page.locator('form');
    const formCount = await forms.count();
    console.log('📝 Forms found:', formCount);
    
    // 5. Look for input fields
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    console.log('📝 Input fields found:', inputCount);
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      console.log(`Input ${i + 1}:`, { type, placeholder, name, id });
    }
    
    // 6. Look for buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log('🔘 Buttons found:', buttonCount);
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const type = await button.getAttribute('type');
      console.log(`Button ${i + 1}:`, { text: text?.trim(), type });
    }
    
    // 7. Try to fill the form
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]').first();
    const passwordInput = page.locator('input[type="password"], input[placeholder*="password"], input[placeholder*="Password"]').first();
    
    if (await emailInput.count() > 0) {
      await emailInput.fill('info@cubstechnical.com');
      console.log('✅ Email filled');
    } else {
      console.log('❌ Email input not found');
    }
    
    if (await passwordInput.count() > 0) {
      await passwordInput.fill('Admin@123456');
      console.log('✅ Password filled');
    } else {
      console.log('❌ Password input not found');
    }
    
    // 8. Try to submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
    
    if (await submitButton.count() > 0) {
      console.log('🔘 Submit button found, clicking...');
      await submitButton.click();
      console.log('✅ Submit button clicked');
      
      // 9. Wait and check result
      await page.waitForTimeout(5000);
      const currentUrl = page.url();
      console.log('📍 URL after submit:', currentUrl);
      
      // 10. Check for error messages
      const errorElements = page.locator('[role="alert"], .error, .text-red-600, .text-red-500, .alert-error, [class*="error"]');
      const errorCount = await errorElements.count();
      console.log('❌ Error elements found:', errorCount);
      
      if (errorCount > 0) {
        for (let i = 0; i < errorCount; i++) {
          const errorText = await errorElements.nth(i).textContent();
          console.log(`Error ${i + 1}:`, errorText);
        }
      }
      
      // 11. Check for success indicators
      const successElements = page.locator('[class*="success"], [class*="Success"], .text-green-600, .text-green-500');
      const successCount = await successElements.count();
      console.log('✅ Success elements found:', successCount);
      
    } else {
      console.log('❌ Submit button not found');
    }
    
    // 12. Take screenshot
    await page.screenshot({ path: 'test-results/login-debug-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved');
  });
});

