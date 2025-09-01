import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  timeout: 30_000,
  testDir: 'e2e/definitive',
  globalSetup: require.resolve('./e2e/definitive/global.setup.ts'),
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3002',
    storageState: 'e2e/.auth/user.json',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'], 
        storageState: 'e2e/.auth/user.json',
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: process.env.BASE_URL || 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
});
