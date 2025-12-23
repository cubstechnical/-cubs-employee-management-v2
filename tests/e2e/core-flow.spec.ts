import { test, expect } from '@playwright/test';

// --- MOCK DATA ---

const MOCK_USER = {
    id: 'test-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'playwright@test.local',
    email_confirmed_at: new Date().toISOString(),
    user_metadata: {
        full_name: 'Playwright Tester',
    },
    app_metadata: {
        provider: 'email',
    }
};

const MOCK_SESSION = {
    access_token: 'mock-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'mock-refresh-token',
    user: MOCK_USER
};

const MOCK_PROFILE = {
    id: 'test-user-id',
    email: 'playwright@test.local',
    full_name: 'Playwright Tester',
    role: 'admin',
    approved_by: 'master-admin-id', // Approved
};

const MOCK_EMPLOYEE = {
    id: 'emp-123',
    employee_id: 'EMP-001',
    name: 'Playwright Test User',
    company_name: 'CUBS Technical',
    trade: 'Software Tester',
    nationality: 'Digital Nomad',
    is_active: true,
    visa_expiry_date: new Date(Date.now() + 86400000 * 60).toISOString(), // 60 days in future
    email_id: 'playwright@test.local',
    passport_number: 'MOCK-PASS-123',
    labourcard_number: 'MOCK-LC-123',
    eid: '784-1234-1234567-1'
};

const MOCK_COMPANIES = [
    { company_name: 'CUBS Technical' },
    { company_name: 'Another Company' }
];

test.describe('Comprehensive Mocked App Functionality', () => {

    // Global Setup: Intercept ALL network requests to Supabase/API
    test.beforeEach(async ({ page }) => {

        // 0. Inject Session into LocalStorage (Critical for AuthService.getSession())
        // Calculate storage key based on Supabase URL or default
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        // Extract subdomain (project ref) from url: https://<project-ref>.supabase.co
        const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\./)?.[1];
        const storageKey = projectRef ? `sb-${projectRef}-auth-token` : 'supabase-auth-token';

        // Also inject a fallback key just in case
        await page.addInitScript(({ key, session }) => {
            // Set the calculated key
            window.localStorage.setItem(key, JSON.stringify(session));
            // Set generic key just in case
            window.localStorage.setItem('supabase-auth-token', JSON.stringify(session));

            console.log(`[Test Setup] Injected session into localStorage with key: ${key}`);
        }, { key: storageKey, session: MOCK_SESSION });

        // 1. Auth & Session Mocking
        // GET User (for session validation checks)
        await page.route('**/auth/v1/user', async route => {
            console.log('🔹 Mocking GET User');
            await route.fulfill({ status: 200, body: JSON.stringify(MOCK_USER) });
        });

        // POST Token (for Sign In) matches .../auth/v1/token?grant_type=password
        await page.route('**/auth/v1/token*', async route => {
            console.log('🔹 Mocking POST Token (Login)');
            await route.fulfill({ status: 200, body: JSON.stringify(MOCK_SESSION) });
        });

        // 2. Profile & Approval Mocking (Critical for middleware/layout)
        await page.route('**/rest/v1/profiles*', async route => {
            // If querying specific ID
            if (route.request().url().includes('eq.id')) {
                await route.fulfill({ status: 200, body: JSON.stringify(MOCK_PROFILE) });
            } else {
                await route.fulfill({ status: 200, body: JSON.stringify([MOCK_PROFILE]) });
            }
        });

        // 3. Employee Data Mocking
        await page.route('**/rest/v1/employee_table*', async route => {
            const method = route.request().method();
            const url = route.request().url();

            if (method === 'GET') {
                // Count query (approximate check)
                if (url.includes('count=exact')) {
                    await route.fulfill({
                        status: 200,
                        body: JSON.stringify([MOCK_EMPLOYEE]),
                        headers: { 'content-range': '0-1/1' }
                    });
                } else if (url.includes('select=company_name')) {
                    await route.fulfill({ status: 200, body: JSON.stringify(MOCK_COMPANIES) });
                } else {
                    await route.fulfill({ status: 200, body: JSON.stringify([MOCK_EMPLOYEE]) });
                }
            }
            else if (method === 'POST') {
                await route.fulfill({ status: 201, body: JSON.stringify(MOCK_EMPLOYEE) });
            }
            else if (method === 'DELETE') {
                await route.fulfill({ status: 204 });
            }
            else if (method === 'PATCH') {
                await route.fulfill({ status: 200, body: JSON.stringify(MOCK_EMPLOYEE) });
            }
        });

        // 4. Document & Upload Mocking
        await page.route('**/rest/v1/documents*', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify([]) });
        });

        // 5. Safety Interceptions (Email/Notifications)
        await page.route('**/api/send-email', async route => {
            console.log('🛡️ BLOCKED: /api/send-email');
            await route.fulfill({ status: 200, body: JSON.stringify({ success: true, message: 'Intercepted' }) });
        });

        await page.route('**/api/visa-notifications', async route => {
            console.log('🛡️ BLOCKED: /api/visa-notifications');
            await route.fulfill({ status: 200, body: JSON.stringify({ success: true, message: 'Intercepted' }) });
        });
    });

    test('Employee Management Flow (Mocked)', async ({ page }) => {
        // 1. Visit Employees Page - Should be logged in now via InitScript
        await page.goto('/employees');

        // If still redirected to login, try manual login
        if (page.url().includes('/login')) {
            console.log('⚠️ Still Redirected to Login despite LocalStorage injection. Attempting form login...');
            await page.getByPlaceholder('Enter your email').fill('playwright@test.local');
            await page.getByPlaceholder('Enter your password').fill('password123');
            await page.getByRole('button', { name: 'Sign In' }).click();
            await page.waitForTimeout(2000);
            if (page.url().includes('/login')) {
                await page.goto('/employees');
            }
        }

        // 2. Verify List (Should see our mock employee)
        // Wait for the skeleton content to disappear/real content to show
        await expect(page.getByText('Employees').first()).toBeVisible({ timeout: 15000 });

        // Verify content text
        await expect(page.getByText(MOCK_EMPLOYEE.name)).toBeVisible();

        // 3. Add New Employee (UI Flow)
        await page.getByRole('button', { name: 'Add Employee' }).click();
        await expect(page).toHaveURL(/.*\/employees\/new/);

        await page.getByPlaceholder('Enter full name').fill('New Mock Employee');
        await page.getByPlaceholder('Enter trade/position').fill('Tester');
        await page.getByPlaceholder('Enter nationality').fill('Global');

        // Mock the Select (Wait for it to populate from our MOCKED companies)
        const companySelect = page.locator('select[name="company_name"]');
        await companySelect.waitFor({ state: 'visible' });
        await companySelect.selectOption('CUBS Technical');

        await page.getByRole('button', { name: 'Save Employee' }).click();

        // Should redirect back to list
        await expect(page).toHaveURL(/.*\/employees/);
    });

    test('Document Page (Mocked)', async ({ page }) => {
        await page.goto('/documents');

        // Handle Login if redirected
        if (page.url().includes('/login')) {
            await page.getByPlaceholder('Enter your email').fill('playwright@test.local');
            await page.getByPlaceholder('Enter your password').fill('password123');
            await page.getByRole('button', { name: 'Sign In' }).click();
            await page.waitForTimeout(2000);
            if (page.url().includes('/login')) {
                await page.goto('/documents');
            }
        }

        await expect(page.getByText('Documents').first()).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('button', { name: 'Upload' })).toBeVisible();
    });

    test('Notification Page Safety Check', async ({ page }) => {
        await page.goto('/notifications');
        if (page.url().includes('/login')) {
            await page.getByPlaceholder('Enter your email').fill('playwright@test.local');
            await page.getByPlaceholder('Enter your password').fill('password123');
            await page.getByRole('button', { name: 'Sign In' }).click();
            await page.waitForTimeout(2000);
            if (page.url().includes('/login')) {
                await page.goto('/notifications');
            }
        }
        // Just verify page load; network interceptions in beforeEach prevent actual emails
        await expect(page.getByText('Notifications')).toBeVisible();
    });

});
