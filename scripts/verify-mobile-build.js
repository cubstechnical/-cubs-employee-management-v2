#!/usr/bin/env node

/**
 * Mobile Build Verification Script
 * Verifies that the mobile build is working correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Mobile Build...');

// Check build output
console.log('\n📁 Build Output Check:');
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
console.log('\n📱 Capacitor Config Check:');
if (fs.existsSync('capacitor.config.ts')) {
  console.log('✅ capacitor.config.ts exists');
  const config = fs.readFileSync('capacitor.config.ts', 'utf8');
  console.log('📄 Config contains server URL:', config.includes('url:'));
  console.log('📄 Config contains headers:', config.includes('headers:'));
} else {
  console.log('❌ capacitor.config.ts not found');
}

// Check mobile-specific files
console.log('\n📱 Mobile Files Check:');
const mobileFiles = [
  'lib/utils/mobileErrorRecovery.ts',
  'lib/utils/iosErrorHandler.ts',
  'components/ios/IOSLoadingScreen.tsx',
  'components/mobile/MobileErrorBoundary.tsx'
];

mobileFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} not found`);
  }
});

console.log('\n🔧 Mobile Build Commands:');
console.log('1. npm run build:mobile');
console.log('2. npx cap sync');
console.log('3. npx cap open android');
console.log('4. npx cap open ios');
