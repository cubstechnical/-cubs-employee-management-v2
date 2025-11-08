/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { webkit, devices } = require('playwright');

// Output base
const OUT_DIR = path.join(process.cwd(), 'app-store-assets');
const STORAGE_STATE_PATH = path.join(OUT_DIR, 'storageState.json');

// Apple-accepted sizes for iPhone and iPad
const DEVICE_CONFIGS = [
  {
    type: 'iphone',
    folder: 'iphone',
    sizes: [
      { name: '1284x2778', width: 1284, height: 2778 }, // iPhone 6.5" portrait
      { name: '2778x1284', width: 2778, height: 1284 }, // iPhone 6.5" landscape
    ],
    device: 'iPhone 12 Pro Max',
  },
  {
    type: 'ipad',
    folder: 'ipad',
    sizes: [
      { name: '2048x2732', width: 2048, height: 2732 }, // iPad Pro 13" portrait
      { name: '2732x2048', width: 2732, height: 2048 }, // iPad Pro 13" landscape
    ],
    device: 'iPad Pro 12.9',
  },
];

// Target routes to capture (order matters: first 3 are most important)
const TARGETS = [
  { key: '01-dashboard', url: '/dashboard' },
  { key: '02-employees', url: '/employees' },
  { key: '03-documents', url: '/documents' },
  { key: '00-login', url: '/login' },
];

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
const EMAIL = process.env.APPLE_REVIEW_EMAIL || process.env.LOGIN_EMAIL;
const PASSWORD = process.env.APPLE_REVIEW_PASSWORD || process.env.LOGIN_PASSWORD;

async function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function loginIfPossible(page) {
  if (!EMAIL || !PASSWORD) {
    console.log('ℹ️ No login credentials provided; capturing public/login screens only.');
    return false;
  }

  try {
    // Attach diagnostics
    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log(`🧩 console.${type}:`, msg.text());
      }
    });
    page.on('requestfailed', (req) => {
      console.log('🚫 request failed:', req.method(), req.url(), req.failure()?.errorText);
    });
    page.on('response', (res) => {
      const status = res.status();
      if (status >= 400) {
        console.log('⚠️ response error:', status, res.url());
      }
    });

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });

    // Fill form (matches your login page inputs)
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);

    // Click Sign In
    const signInButton = await page.locator('button:has-text("Sign In")');
    if (await signInButton.count()) {
      await signInButton.first().click();
    } else {
      // Fallback by role/name
      await page.getByRole('button', { name: /sign in/i }).click();
    }

    // Wait for redirect or dashboard route
    const redirected = await Promise.race([
      page.waitForURL(/\/(dashboard|admin\/dashboard)/, { timeout: 12000 }).then(() => true).catch(() => false),
      (async () => { await page.waitForLoadState('networkidle'); await sleep(2000); return !page.url().includes('/login'); })()
    ]);

    const current = page.url();
    if (!redirected || current.includes('/login')) {
      console.warn('⚠️ Still on /login, login may have failed. Taking diagnostic screenshot...');
      const diagDir = path.join(process.cwd(), 'app-store-assets', '_diagnostics');
      await ensureDir(diagDir);
      const diagPath = path.join(diagDir, 'login-failure.png');
      await page.screenshot({ path: diagPath, fullPage: true });
      console.log('🖼️ Saved diagnostic screenshot at', diagPath);
      return false;
    }

    console.log('✅ Logged in successfully');
    return true;
  } catch (err) {
    console.warn('⚠️ Login attempt failed:', err?.message || err);
    return false;
  }
}

async function captureAll() {
  await ensureDir(OUT_DIR);

  for (const deviceConfig of DEVICE_CONFIGS) {
    const deviceOutDir = path.join(OUT_DIR, deviceConfig.folder);
    await ensureDir(deviceOutDir);

    console.log(`\n━━━ Capturing ${deviceConfig.type.toUpperCase()} Screenshots ━━━`);

    for (const size of deviceConfig.sizes) {
      console.log(`\n=== Size: ${size.name} (${size.width}x${size.height}) ===`);

      const hasStorage = fs.existsSync(STORAGE_STATE_PATH);
      if (hasStorage) {
        console.log(`🔐 Using saved session from ${path.relative(process.cwd(), STORAGE_STATE_PATH)}`);
      } else {
        console.log('ℹ️ No saved session found. The script will attempt automated login.');
      }

      const browser = await webkit.launch({ headless: true });
      const context = await browser.newContext({
        ...devices[deviceConfig.device],
        viewport: { width: size.width, height: size.height },
        deviceScaleFactor: 1,
        locale: 'en-GB',
        storageState: hasStorage ? STORAGE_STATE_PATH : undefined,
      });

      try {
        const page = await context.newPage();

        // Try to log in once per size (only if no storage state)
        const loggedIn = hasStorage ? true : await loginIfPossible(page);

        for (const target of TARGETS) {
          const fileBase = `${target.key}-${size.name}.png`;
          const filePath = path.join(deviceOutDir, fileBase);

          try {
            const url = `${BASE_URL}${target.url}`;
            await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

            // Gentle wait for charts/async UI
            await sleep(1500);

            // If this is a protected route and not logged in, skip with notice
            if (!loggedIn && /\/admin\//.test(target.url)) {
              console.log(`⏭️ Skipping protected route without login: ${target.url}`);
              continue;
            }

            await page.screenshot({ path: filePath, fullPage: false });
            console.log(`📸 Saved: ${path.relative(process.cwd(), filePath)}`);
          } catch (err) {
            console.warn(`⚠️ Failed to capture ${target.url} @ ${size.name}:`, err?.message || err);
          }
        }

        await context.close();
        await browser.close();
      } catch (err) {
        console.error(`❌ Context error for size ${size.name}:`, err?.message || err);
        try { await context?.close(); } catch {}
        try { await browser?.close(); } catch {}
      }
    }
  }

  console.log('\n✅ Finished capturing App Store screenshots.');
  console.log(`📁 Output directories:`);
  console.log(`   - iPhone: ${path.relative(process.cwd(), path.join(OUT_DIR, 'iphone'))}`);
  console.log(`   - iPad: ${path.relative(process.cwd(), path.join(OUT_DIR, 'ipad'))}`);
  console.log('Note: If protected pages were skipped, set APPLE_REVIEW_EMAIL and APPLE_REVIEW_PASSWORD.');
}

captureAll().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
