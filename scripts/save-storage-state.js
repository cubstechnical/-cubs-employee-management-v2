/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { webkit, devices } = require('playwright');

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
const OUT_DIR = path.join(process.cwd(), 'app-store-assets');
const STORAGE_STATE_PATH = path.join(OUT_DIR, 'storageState.json');

async function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  await ensureDir(OUT_DIR);

  console.log('\n▶ Opened a headed browser. Please log in manually.');
  console.log('   URL:', `${BASE_URL}/login`);
  console.log('   This window will wait up to 5 minutes for a successful login...');

  const browser = await webkit.launch({ headless: false });
  const context = await browser.newContext({
    ...devices['iPhone 12 Pro Max'],
    viewport: { width: 1284, height: 2778 },
    deviceScaleFactor: 1,
    locale: 'en-GB',
  });

  const page = await context.newPage();

  // Diagnostics
  page.on('console', (msg) => {
    if (['warning', 'error'].includes(msg.type())) {
      console.log(`🧩 console.${msg.type()}:`, msg.text());
    }
  });
  page.on('requestfailed', (req) => {
    console.log('🚫 request failed:', req.method(), req.url(), req.failure()?.errorText);
  });

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

  // Wait until navigated away from /login or specific dashboard routes
  const deadline = Date.now() + 5 * 60 * 1000; // 5 minutes
  let isLoggedIn = false;

  while (Date.now() < deadline) {
    try {
      await page.waitForURL(/\/(dashboard|admin\/dashboard|employees|documents)\/?(.*)?$/, { timeout: 5000 });
      isLoggedIn = !page.url().includes('/login');
      if (isLoggedIn) break;
    } catch (_) {
      // still on login, keep waiting
    }
    await sleep(1500);
  }

  if (!isLoggedIn) {
    console.error('❌ Did not detect a successful login within 5 minutes. Close the window and try again.');
    await browser.close();
    process.exit(1);
  }

  // Save storage state
  await context.storageState({ path: STORAGE_STATE_PATH });
  console.log('✅ Saved session to', path.relative(process.cwd(), STORAGE_STATE_PATH));

  await browser.close();
  process.exit(0);
})().catch(async (e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
