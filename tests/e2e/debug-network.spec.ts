import { test } from '@playwright/test';

test('Debug Network Requests', async ({ page }) => {
    // Log all network requests
    page.on('request', request =>
        console.log('>>', request.method(), request.url())
    );

    // Log console messages from the browser
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    await page.goto('/employees', { timeout: 15000 });
    await page.waitForTimeout(5000);
});
