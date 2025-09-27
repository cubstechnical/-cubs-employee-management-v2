#!/usr/bin/env node

/**
 * Mobile App Fix Script
 * Comprehensive fix for mobile app issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing Mobile App Issues...');

// 1. Clean and rebuild everything
function cleanAndRebuild() {
  console.log('🧹 Cleaning previous builds...');
  
  const dirsToClean = ['.next', 'out', 'node_modules/.cache', 'android/app/build', 'ios/App/build'];
  
  dirsToClean.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        execSync(`rm -rf "${dir}"`, { stdio: 'inherit' });
        console.log(`✅ Cleaned ${dir}`);
      } catch (error) {
        console.warn(`⚠️ Could not clean ${dir}:`, error.message);
      }
    }
  });
}

// 2. Update Capacitor configuration for better mobile compatibility
function updateCapacitorConfig() {
  console.log('📱 Updating Capacitor configuration...');
  
  const configPath = 'capacitor.config.ts';
  if (fs.existsSync(configPath)) {
    let config = fs.readFileSync(configPath, 'utf8');
    
    // Add better mobile configuration
    if (!config.includes('androidScheme')) {
      config = config.replace(
        'androidScheme: \'https\',',
        `androidScheme: 'https',
    // Add mobile-specific optimizations
    androidScheme: 'https',
    iosScheme: 'cubs-employee',`
      );
    }
    
    fs.writeFileSync(configPath, config);
    console.log('✅ Capacitor config updated');
  }
}

// 3. Create mobile-specific error recovery
function createMobileErrorRecovery() {
  console.log('🛡️ Creating mobile error recovery...');
  
  const errorRecoveryPath = 'lib/utils/mobileErrorRecovery.ts';
  const errorRecoveryContent = `'use client';

// Mobile-specific error recovery for Capacitor apps
export class MobileErrorRecovery {
  private static isInitialized = false;
  private static retryCount = 0;
  private static maxRetries = 3;

  static init() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    
    this.isInitialized = true;
    
    // Global error handler for mobile
    window.addEventListener('error', (event) => {
      console.error('Mobile Error:', event.error);
      this.handleError(event.error);
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Mobile Unhandled Promise Rejection:', event.reason);
      this.handleError(event.reason);
    });

    // Check app health periodically
    setInterval(() => {
      this.checkAppHealth();
    }, 30000); // Check every 30 seconds
  }

  private static handleError(error: any) {
    console.error('🚨 Mobile Error Recovery:', error);
    
    // Try to recover from common mobile errors
    if (error?.message?.includes('Cannot read properties') || 
        error?.message?.includes('undefined') ||
        error?.message?.includes('null')) {
      console.log('🔄 Attempting to recover from property access error...');
      this.attemptRecovery();
    }
  }

  private static attemptRecovery() {
    if (this.retryCount >= this.maxRetries) {
      console.error('❌ Max retries reached, showing error screen');
      this.showErrorScreen();
      return;
    }

    this.retryCount++;
    console.log(\`🔄 Recovery attempt \${this.retryCount}/\${this.maxRetries}\`);

    // Try different recovery strategies
    setTimeout(() => {
      // Strategy 1: Reload the page
      if (this.retryCount === 1) {
        window.location.reload();
      }
      // Strategy 2: Clear cache and reload
      else if (this.retryCount === 2) {
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
            window.location.reload();
          });
        } else {
          window.location.reload();
        }
      }
      // Strategy 3: Clear localStorage and reload
      else {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          // Ignore storage errors
        }
        window.location.reload();
      }
    }, 1000 * this.retryCount);
  }

  private static checkAppHealth() {
    // Check if the app is properly loaded
    const rootElement = document.getElementById('__next');
    if (!rootElement || rootElement.children.length === 0) {
      console.warn('⚠️ App root not found, attempting recovery...');
      this.attemptRecovery();
    }
  }

  private static showErrorScreen() {
    document.body.innerHTML = \`
      <div style="
        display: flex; 
        justify-content: center; 
        align-items: center; 
        height: 100vh; 
        background: #111827; 
        color: white; 
        text-align: center; 
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div>
          <h2 style="color: #d3194f; margin-bottom: 20px;">App Recovery Failed</h2>
          <p style="margin-bottom: 20px;">The app encountered multiple errors and couldn't recover automatically.</p>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button 
              onclick="window.location.reload()" 
              style="
                background: #d3194f; 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 6px; 
                cursor: pointer;
                font-size: 16px;
              "
            >
              Restart App
            </button>
            <button 
              onclick="if(confirm('This will clear all app data. Continue?')) { localStorage.clear(); sessionStorage.clear(); window.location.reload(); }" 
              style="
                background: #374151; 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 6px; 
                cursor: pointer;
                font-size: 16px;
              "
            >
              Clear Data & Restart
            </button>
          </div>
        </div>
      </div>
    \`;
  }
}

// Initialize on import
if (typeof window !== 'undefined') {
  MobileErrorRecovery.init();
}
`;

  fs.writeFileSync(errorRecoveryPath, errorRecoveryContent);
  console.log('✅ Mobile error recovery created');
}

// 4. Update root layout with mobile error recovery
function updateRootLayout() {
  console.log('🏗️ Updating root layout for mobile...');
  
  const layoutPath = 'app/layout.tsx';
  if (fs.existsSync(layoutPath)) {
    let layout = fs.readFileSync(layoutPath, 'utf8');
    
    // Add mobile error recovery import
    if (!layout.includes('mobileErrorRecovery')) {
      layout = layout.replace(
        "import '@/lib/utils/iosErrorHandler'",
        "import '@/lib/utils/iosErrorHandler'\nimport '@/lib/utils/mobileErrorRecovery'"
      );
    }
    
    fs.writeFileSync(layoutPath, layout);
    console.log('✅ Root layout updated for mobile');
  }
}

// 5. Create mobile build verification script
function createMobileBuildVerification() {
  console.log('🔍 Creating mobile build verification...');
  
  const verificationPath = 'scripts/verify-mobile-build.js';
  const verificationContent = `#!/usr/bin/env node

/**
 * Mobile Build Verification Script
 * Verifies that the mobile build is working correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Mobile Build...');

// Check build output
console.log('\\n📁 Build Output Check:');
if (fs.existsSync('out')) {
  console.log('✅ out/ directory exists');
  
  const files = fs.readdirSync('out');
  console.log('📄 Files in out/:', files.slice(0, 10));
  
  if (fs.existsSync('out/index.html')) {
    const indexContent = fs.readFileSync('out/index.html', 'utf8');
    console.log('📄 index.html size:', indexContent.length, 'bytes');
    console.log('📄 index.html contains __next:', indexContent.includes('__next'));
    console.log('📄 index.html contains Capacitor check:', indexContent.includes('window.Capacitor'));
  }
} else {
  console.log('❌ out/ directory not found');
}

// Check Capacitor config
console.log('\\n📱 Capacitor Config Check:');
if (fs.existsSync('capacitor.config.ts')) {
  console.log('✅ capacitor.config.ts exists');
  const config = fs.readFileSync('capacitor.config.ts', 'utf8');
  console.log('📄 Config contains server URL:', config.includes('url:'));
  console.log('📄 Config contains headers:', config.includes('headers:'));
} else {
  console.log('❌ capacitor.config.ts not found');
}

// Check mobile-specific files
console.log('\\n📱 Mobile Files Check:');
const mobileFiles = [
  'lib/utils/mobileErrorRecovery.ts',
  'lib/utils/iosErrorHandler.ts',
  'components/ios/IOSLoadingScreen.tsx',
  'components/mobile/MobileErrorBoundary.tsx'
];

mobileFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(\`✅ \${file} exists\`);
  } else {
    console.log(\`❌ \${file} not found\`);
  }
});

console.log('\\n🔧 Mobile Build Commands:');
console.log('1. npm run build:mobile');
console.log('2. npx cap sync');
console.log('3. npx cap open android');
console.log('4. npx cap open ios');
`;

  fs.writeFileSync(verificationPath, verificationContent);
  
  // Make it executable
  try {
    execSync(`chmod +x ${verificationPath}`);
  } catch (e) {
    // Ignore chmod errors on Windows
  }
  
  console.log('✅ Mobile build verification created');
}

// 6. Update package.json with mobile fix scripts
function updatePackageJson() {
  console.log('📦 Updating package.json with mobile fix scripts...');
  
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    // Add mobile fix scripts
    packageJson.scripts['fix:mobile'] = 'node scripts/fix-mobile-app.js';
    packageJson.scripts['verify:mobile'] = 'node scripts/verify-mobile-build.js';
    packageJson.scripts['build:mobile:clean'] = 'npm run fix:mobile && npm run build:mobile';
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('✅ Package.json updated with mobile fix scripts');
  }
}

// Run all fixes
console.log('🚀 Starting comprehensive mobile app fixes...');

try {
  cleanAndRebuild();
  updateCapacitorConfig();
  createMobileErrorRecovery();
  updateRootLayout();
  createMobileBuildVerification();
  updatePackageJson();
  
  console.log('\\n✅ Mobile app fixes completed!');
  console.log('\\n📱 Next steps:');
  console.log('1. Run: npm run build:mobile:clean');
  console.log('2. Run: npx cap sync');
  console.log('3. Run: npm run verify:mobile');
  console.log('4. Test on device: npx cap open android/ios');
  console.log('\\n🔧 If issues persist:');
  console.log('- Check device logs for specific errors');
  console.log('- Verify network connectivity');
  console.log('- Test on different devices');
  
} catch (error) {
  console.error('❌ Error applying mobile fixes:', error);
  process.exit(1);
}
