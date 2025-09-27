#!/usr/bin/env node

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
