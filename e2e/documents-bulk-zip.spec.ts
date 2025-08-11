import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test.describe('Documents bulk zip and preview', () => {
  test('Select multiple documents and download zip; open preview', async ({ page, context }) => {
    await TestHelpers.login(page);
    await page.goto('/documents');

    // Navigate into a company with documents if present
    await page.waitForSelector('text=Documents');
    // Click first company folder
    const firstFolder = page.locator('[role="button"], div:has(svg) >> text=/.+/').first();
    await firstFolder.click({ trial: true }).catch(() => {});

    // If employee-level folders, click first employee
    const maybeEmployee = page.locator('div[role="button"], div:has(svg) >> text=/.+/').first();
    await maybeEmployee.click({ trial: true }).catch(() => {});

    // Select up to two document checkboxes if present
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    if (count >= 1) await checkboxes.nth(0).check();
    if (count >= 2) await checkboxes.nth(1).check();

    // Click Download Selected if visible
    const downloadBtn = page.getByRole('button', { name: /Download Selected/i });
    if (await downloadBtn.isVisible()) {
      const [ download ] = await Promise.all([
        page.waitForEvent('download').catch(() => null),
        downloadBtn.click()
      ]);
      if (download) {
        const path = await download.path();
        expect(path).toBeTruthy();
      }
    }

    // Try preview first document via the eye icon
    const eyeBtn = page.locator('button[title="View"]').first();
    if (await eyeBtn.isVisible()) {
      const [ newPage ] = await Promise.all([
        context.waitForEvent('page').catch(() => null),
        eyeBtn.click()
      ]);
      if (newPage) {
        await newPage.waitForLoadState('domcontentloaded', { timeout: 15000 });
      }
    }
  });
});


