#!/usr/bin/env node

/**
 * Fix iOS White Page Issue
 * This script addresses common causes of white blank pages in iOS Capacitor apps
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing iOS White Page Issue...');

// 1. Check and fix Capacitor configuration
function fixCapacitorConfig() {
  console.log('📱 Checking Capacitor configuration...');
  
  const capacitorConfigPath = 'capacitor.config.ts';
  if (fs.existsSync(capacitorConfigPath)) {
    let config = fs.readFileSync(capacitorConfigPath, 'utf8');
    
    // Ensure proper iOS configuration
    if (!config.includes('ios: {')) {
      config = config.replace(
        'export default config;',
        `  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#111827',
    allowsLinkPreview: false,
    handleApplicationNotifications: true,
    scheme: 'CUBS Employee Management',
  },
export default config;`
      );
    }
    
    fs.writeFileSync(capacitorConfigPath, config);
    console.log('✅ Capacitor config updated');
  }
}

// 2. Create iOS-specific error handling
function createIOSErrorHandler() {
  console.log('🛡️ Creating iOS error handler...');
  
  const errorHandlerPath = 'lib/utils/iosErrorHandler.ts';
  const errorHandlerContent = `'use client';

// iOS-specific error handling for Capacitor apps
export class IOSErrorHandler {
  private static isInitialized = false;

  static init() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    
    this.isInitialized = true;
    
    // Global error handler for iOS
    window.addEventListener('error', (event) => {
      console.error('iOS Error:', event.error);
      this.handleError(event.error);
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('iOS Unhandled Promise Rejection:', event.reason);
      this.handleError(event.reason);
    });

    // Capacitor-specific error handling
    if (window.Capacitor) {
      window.Capacitor.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          console.log('📱 App became active');
          this.checkAppHealth();
        }
      });
    }
  }

  private static handleError(error: any) {
    console.error('🚨 iOS Error Handler:', error);
    
    // Try to recover from common iOS errors
    if (error?.message?.includes('Cannot read properties')) {
      console.log('🔄 Attempting to recover from property access error...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  private static checkAppHealth() {
    // Check if the app is properly loaded
    const rootElement = document.getElementById('__next');
    if (!rootElement || rootElement.children.length === 0) {
      console.warn('⚠️ App root not found, attempting recovery...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }
}

// Initialize on import
if (typeof window !== 'undefined') {
  IOSErrorHandler.init();
}
`;

  fs.writeFileSync(errorHandlerPath, errorHandlerContent);
  console.log('✅ iOS error handler created');
}

// 3. Create iOS-specific loading screen
function createIOSLoadingScreen() {
  console.log('📱 Creating iOS loading screen...');
  
  const loadingScreenPath = 'components/ios/IOSLoadingScreen.tsx';
  const loadingScreenContent = `'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface IOSLoadingScreenProps {
  children: React.ReactNode;
}

export default function IOSLoadingScreen({ children }: IOSLoadingScreenProps) {
  const [isIOSReady, setIsIOSReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');

  useEffect(() => {
    const initializeIOS = async () => {
      try {
        setLoadingMessage('Checking iOS environment...');
        
        // Check if running on iOS
        const isIOS = Capacitor.getPlatform() === 'ios';
        if (!isIOS) {
          setIsIOSReady(true);
          return;
        }

        setLoadingMessage('Loading iOS dependencies...');
        
        // Wait for Capacitor to be ready
        if (window.Capacitor) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setLoadingMessage('Finalizing setup...');
        await new Promise(resolve => setTimeout(resolve, 500));

        setIsIOSReady(true);
      } catch (error) {
        console.error('iOS initialization error:', error);
        // Still show the app even if initialization fails
        setIsIOSReady(true);
      }
    };

    initializeIOS();
  }, []);

  if (!isIOSReady) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3194f] mx-auto"></div>
          <p className="text-white text-lg font-medium">{loadingMessage}</p>
          <p className="text-gray-400 text-sm">Please wait...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
`;

  // Create directory if it doesn't exist
  const iosDir = path.dirname(loadingScreenPath);
  if (!fs.existsSync(iosDir)) {
    fs.mkdirSync(iosDir, { recursive: true });
  }

  fs.writeFileSync(loadingScreenPath, loadingScreenContent);
  console.log('✅ iOS loading screen created');
}

// 4. Update root layout with iOS error handling
function updateRootLayout() {
  console.log('🏗️ Updating root layout for iOS...');
  
  const layoutPath = 'app/layout.tsx';
  if (fs.existsSync(layoutPath)) {
    let layout = fs.readFileSync(layoutPath, 'utf8');
    
    // Add iOS error handler import
    if (!layout.includes('iosErrorHandler')) {
      layout = layout.replace(
        "import { ThemeProvider } from '@/lib/theme'",
        "import { ThemeProvider } from '@/lib/theme'\nimport '@/lib/utils/iosErrorHandler'"
      );
    }
    
    // Add iOS loading screen wrapper
    if (!layout.includes('IOSLoadingScreen')) {
      layout = layout.replace(
        "import { ThemeProvider } from '@/lib/theme'",
        "import { ThemeProvider } from '@/lib/theme'\nimport IOSLoadingScreen from '@/components/ios/IOSLoadingScreen'"
      );
      
      // Wrap the main content with IOSLoadingScreen
      layout = layout.replace(
        '<OptimizedLayout>',
        '<IOSLoadingScreen><OptimizedLayout>'
      );
      
      layout = layout.replace(
        '</OptimizedLayout>',
        '</OptimizedLayout></IOSLoadingScreen>'
      );
    }
    
    fs.writeFileSync(layoutPath, layout);
    console.log('✅ Root layout updated for iOS');
  }
}

// 5. Create iOS-specific build script
function createIOSBuildScript() {
  console.log('🔨 Creating iOS build script...');
  
  const buildScriptPath = 'scripts/build-ios.js';
  const buildScriptContent = `#!/usr/bin/env node

/**
 * iOS-specific build script
 * Ensures proper build for iOS Capacitor apps
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🍎 Building for iOS...');

try {
  // 1. Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('out')) {
    execSync('rm -rf out', { stdio: 'inherit' });
  }
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next', { stdio: 'inherit' });
  }

  // 2. Build Next.js app
  console.log('🏗️ Building Next.js app...');
  execSync('npm run build', { stdio: 'inherit' });

  // 3. Verify build output
  console.log('✅ Verifying build output...');
  if (!fs.existsSync('out/index.html')) {
    throw new Error('Build output not found');
  }

  // 4. Copy iOS-specific files
  console.log('📱 Copying iOS-specific files...');
  const iosFiles = [
    'lib/utils/iosErrorHandler.ts',
    'components/ios/IOSLoadingScreen.tsx'
  ];

  iosFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const destPath = path.join('out', file);
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(file, destPath);
    }
  });

  // 5. Update Capacitor
  console.log('🔄 Updating Capacitor...');
  execSync('npx cap sync ios', { stdio: 'inherit' });

  console.log('✅ iOS build completed successfully!');
  console.log('📱 You can now build the iOS app in Xcode');

} catch (error) {
  console.error('❌ iOS build failed:', error);
  process.exit(1);
}
`;

  fs.writeFileSync(buildScriptPath, buildScriptContent);
  
  // Make it executable
  try {
    execSync(`chmod +x ${buildScriptPath}`);
  } catch (e) {
    // Ignore chmod errors on Windows
  }
  
  console.log('✅ iOS build script created');
}

// 6. Create iOS debugging script
function createIOSDebugScript() {
  console.log('🐛 Creating iOS debug script...');
  
  const debugScriptPath = 'scripts/debug-ios.js';
  const debugScriptContent = `#!/usr/bin/env node

/**
 * iOS Debug Script
 * Helps debug iOS white page issues
 */

const fs = require('fs');
const path = require('path');

console.log('🐛 iOS Debug Information:');

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
  }
} else {
  console.log('❌ out/ directory not found');
}

// Check Capacitor config
console.log('\\n📱 Capacitor Config Check:');
if (fs.existsSync('capacitor.config.ts')) {
  console.log('✅ capacitor.config.ts exists');
} else {
  console.log('❌ capacitor.config.ts not found');
}

// Check iOS directory
console.log('\\n🍎 iOS Directory Check:');
if (fs.existsSync('ios')) {
  console.log('✅ ios/ directory exists');
  
  if (fs.existsSync('ios/App/App/capacitor.config.json')) {
    console.log('✅ iOS Capacitor config exists');
  } else {
    console.log('❌ iOS Capacitor config not found');
  }
} else {
  console.log('❌ ios/ directory not found');
}

// Check package.json scripts
console.log('\\n📦 Package.json Scripts:');
if (fs.existsSync('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const scripts = packageJson.scripts || {};
  
  console.log('Available scripts:');
  Object.keys(scripts).forEach(script => {
    console.log(\`  - \${script}: \${scripts[script]}\`);
  });
}

console.log('\\n🔧 Common iOS White Page Fixes:');
console.log('1. Run: npm run build:ios');
console.log('2. Check: npx cap sync ios');
console.log('3. Open: npx cap open ios');
console.log('4. In Xcode: Product > Clean Build Folder');
console.log('5. In Xcode: Product > Build');
`;

  fs.writeFileSync(debugScriptPath, debugScriptContent);
  console.log('✅ iOS debug script created');
}

// 7. Update package.json with iOS scripts
function updatePackageJson() {
  console.log('📦 Updating package.json with iOS scripts...');
  
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    // Add iOS-specific scripts
    packageJson.scripts['build:ios'] = 'node scripts/build-ios.js';
    packageJson.scripts['debug:ios'] = 'node scripts/debug-ios.js';
    packageJson.scripts['fix:ios'] = 'node scripts/fix-ios-white-page.js';
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('✅ Package.json updated with iOS scripts');
  }
}

// Run all fixes
console.log('🚀 Starting iOS white page fixes...');

try {
  fixCapacitorConfig();
  createIOSErrorHandler();
  createIOSLoadingScreen();
  updateRootLayout();
  createIOSBuildScript();
  createIOSDebugScript();
  updatePackageJson();
  
  console.log('\\n✅ iOS white page fixes completed!');
  console.log('\\n📱 Next steps:');
  console.log('1. Run: npm run build:ios');
  console.log('2. Run: npx cap sync ios');
  console.log('3. Run: npx cap open ios');
  console.log('4. In Xcode: Clean Build Folder and rebuild');
  console.log('\\n🐛 If still having issues, run: npm run debug:ios');
  
} catch (error) {
  console.error('❌ Error applying iOS fixes:', error);
  process.exit(1);
}
