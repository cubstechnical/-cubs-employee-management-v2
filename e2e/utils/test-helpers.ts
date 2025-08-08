import { Page, expect } from '@playwright/test';

export class TestHelpers {
  static async login(page: Page, email: string = 'info@cubstechnical.com', password: string = 'password123') {
    await page.goto('/login');
    await page.getByPlaceholder('Enter your email').fill(email);
    await page.getByPlaceholder('Enter your password').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
  }

  static async waitForPageLoad(page: Page, timeout: number = 10000) {
    await page.waitForLoadState('networkidle', { timeout });
  }

  static async waitForElement(page: Page, selector: string, timeout: number = 10000) {
    await page.waitForSelector(selector, { timeout });
  }

  static async waitForText(page: Page, text: string, timeout: number = 10000) {
    await page.waitForSelector(`text=${text}`, { timeout });
  }

  static async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  }

  static async fillFormField(page: Page, placeholder: string, value: string) {
    await page.getByPlaceholder(placeholder).fill(value);
  }

  static async selectDropdownOption(page: Page, name: string, value: string) {
    await page.selectOption(`select[name="${name}"]`, value);
  }

  static async clickButton(page: Page, text: string) {
    await page.getByRole('button', { name: text }).click();
  }

  static async clickLink(page: Page, text: string) {
    await page.getByRole('link', { name: text }).click();
  }

  static async expectToBeVisible(page: Page, text: string) {
    await expect(page.getByText(text)).toBeVisible();
  }

  static async expectToHaveURL(page: Page, url: string) {
    await expect(page).toHaveURL(url);
  }

  static async expectElementToBeVisible(page: Page, selector: string) {
    await expect(page.locator(selector)).toBeVisible();
  }

  static async expectElementToHaveText(page: Page, selector: string, text: string) {
    await expect(page.locator(selector)).toHaveText(text);
  }

  static async waitForContentLoad(page: Page, timeout: number = 2000) {
    await page.waitForTimeout(timeout);
    await expect(page.locator('body')).not.toHaveText('Loading...');
  }
}

export const testData = {
  validUser: {
    email: 'info@cubstechnical.com',
    password: 'password123'
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'wrongpassword'
  },
  testEmployee: {
    name: 'Test Employee',
    company: 'AL HANA TOURS & TRAVELS',
    email: 'test@example.com',
    mobile: '+971501234567'
  }
}; 
 
 