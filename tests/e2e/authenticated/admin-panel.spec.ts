import { test, expect } from '@playwright/test';

/**
 * Admin Panel Tests
 * 
 * These tests verify the admin-specific functionality.
 * Requires authentication with an admin account.
 */

test.describe('Admin Panel', () => {
    test('can access admin dashboard', async ({ page }) => {
        await page.goto('/admin/dashboard');
        await page.waitForLoadState('networkidle');

        if (page.url().includes('/login')) {
            test.skip(true, 'Auth state expired');
            return;
        }

        // Should see admin dashboard content
        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });

    test('can access user approvals', async ({ page }) => {
        await page.goto('/admin/approvals');
        await page.waitForLoadState('networkidle');

        if (page.url().includes('/login')) {
            test.skip(true, 'Auth state expired');
            return;
        }

        // Should see approvals page (or empty state)
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).toBeTruthy();
        expect(bodyText).not.toContain('Something went wrong');
    });

    test('can access admin employees view', async ({ page }) => {
        await page.goto('/admin/employees');
        await page.waitForLoadState('networkidle');

        if (page.url().includes('/login')) {
            test.skip(true, 'Auth state expired');
            return;
        }

        // Should see employees management
        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });

    test('can access admin documents view', async ({ page }) => {
        await page.goto('/admin/documents');
        await page.waitForLoadState('networkidle');

        if (page.url().includes('/login')) {
            test.skip(true, 'Auth state expired');
            return;
        }

        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });

    test('can access admin settings', async ({ page }) => {
        await page.goto('/admin/settings');
        await page.waitForLoadState('networkidle');

        if (page.url().includes('/login')) {
            test.skip(true, 'Auth state expired');
            return;
        }

        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });

    test('can access admin notifications', async ({ page }) => {
        await page.goto('/admin/notifications');
        await page.waitForLoadState('networkidle');

        if (page.url().includes('/login')) {
            test.skip(true, 'Auth state expired');
            return;
        }

        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });
});
