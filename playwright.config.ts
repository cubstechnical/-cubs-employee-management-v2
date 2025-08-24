import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  timeout: 30_000,
  testDir: 'e2e/definitive',
  globalSetup: require.resolve('./e2e/definitive/global.setup.ts'),
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3002',
    storageState: 'e2e/.auth/user.json',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/user.json' },
    },
  ],
  webServer: {
    command: 'npm run dev -w . -s',
    url: process.env.BASE_URL || 'http://localhost:3002',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
