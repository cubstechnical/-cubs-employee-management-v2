import { test, expect } from '@playwright/test';

/**
 * Authenticated Dashboard Tests
 * 
 * These tests require authentication. Run `npm run screenshots:login` first
 * to create the auth state file.
 * 
 * Run with: npx playwright test --project=chromium-authenticated
 */

test.describe('Dashboard Features', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to dashboard - auth state should be already loaded
        await page.goto('/dashboard');
        // Wait for any redirects to settle
        await page.waitForLoadState('networkidle');
    });

    test('dashboard loads with metrics', async ({ page }) => {
        // If redirected to login, auth state is invalid/expired
        if (page.url().includes('/login')) {
            test.skip(true, 'Auth state expired - run npm run screenshots:login');
            return;
        }

        // Should see dashboard content
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

        // Check for common dashboard elements
        const dashboardIndicators = [
            page.getByText(/total employees/i),
            page.getByText(/active/i),
            page.getByText(/documents/i),
        ];

        // At least one dashboard indicator should be visible
        let hasIndicator = false;
        for (const indicator of dashboardIndicators) {
            try {
                await indicator.waitFor({ timeout: 5000 });
                hasIndicator = true;
                break;
            } catch {
                // Continue checking
            }
        }

        expect(hasIndicator).toBe(true);
    });

    test('sidebar navigation works', async ({ page }) => {
        if (page.url().includes('/login')) {
            test.skip(true, 'Auth state expired');
            return;
        }

        // Look for sidebar navigation links
        const navLinks = page.locator('nav a, aside a');
        const count = await navLinks.count();
        expect(count).toBeGreaterThan(0);
    });
});

test.describe('Employee Management', () => {
    test('can navigate to employees list', async ({ page }) => {
        await page.goto('/employees');
        await page.waitForLoadState('networkidle');

        if (page.url().includes('/login')) {
            test.skip(true, 'Auth state expired');
            return;
        }

        // Should see employees content
        await expect(page.getByText(/employees/i).first()).toBeVisible({ timeout: 15000 });
    });

    test('add employee button exists', async ({ page }) => {
        await page.goto('/employees');
        await page.waitForLoadState('networkidle');

        if (page.url().includes('/login')) {
            test.skip(true, 'Auth state expired');
            return;
        }

        // Look for add employee button
        const addButton = page.getByRole('button', { name: /add/i }).or(
            page.getByRole('link', { name: /add/i })
        ).or(
            page.locator('a[href*="/new"], button:has-text("Add")')
        );

        await expect(addButton.first()).toBeVisible({ timeout: 10000 });
    });

    test('can navigate to new employee form', async ({ page }) => {
        await page.goto('/employees/new');
        await page.waitForLoadState('networkidle');

        if (page.url().includes('/login')) {
            test.skip(true, 'Auth state expired');
            return;
        }

        // Should see form elements
        const formInputs = page.locator('input[type="text"], input[type="email"], select');
        const inputCount = await formInputs.count();
        expect(inputCount).toBeGreaterThan(0);
    });
});

test.describe('Document Management', () => {
    test('can navigate to documents', async ({ page }) => {
        await page.goto('/documents');
        await page.waitForLoadState('networkidle');

        if (page.url().includes('/login')) {
            test.skip(true, 'Auth state expired');
            return;
        }

        // Should see documents content
        await expect(page.getByText(/documents/i).first()).toBeVisible({ timeout: 15000 });
    });

    test('upload button exists', async ({ page }) => {
        await page.goto('/documents');
        await page.waitForLoadState('networkidle');

        if (page.url().includes('/login')) {
            test.skip(true, 'Auth state expired');
            return;
        }

        // Look for upload button
        const uploadButton = page.getByRole('button', { name: /upload/i }).or(
            page.locator('button:has-text("Upload")')
        );

        await expect(uploadButton.first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Notifications', () => {
    test('can navigate to notifications', async ({ page }) => {
        await page.goto('/notifications');
        await page.waitForLoadState('networkidle');

        if (page.url().includes('/login')) {
            test.skip(true, 'Auth state expired');
            return;
        }

        // Should see notifications page
        await expect(page.getByText(/notification/i).first()).toBeVisible({ timeout: 15000 });
    });
});

test.describe('Settings', () => {
    test('can access settings page', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');

        if (page.url().includes('/login')) {
            test.skip(true, 'Auth state expired');
            return;
        }

        // Should see settings page
        await expect(page.getByText(/settings/i).first()).toBeVisible({ timeout: 15000 });
    });
});
