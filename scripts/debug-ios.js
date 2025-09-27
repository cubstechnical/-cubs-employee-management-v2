#!/usr/bin/env node

/**
 * iOS Debug Script
 * Helps debug iOS white page issues
 */

const fs = require('fs');
const path = require('path');

console.log('🐛 iOS Debug Information:');

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
  }
} else {
  console.log('❌ out/ directory not found');
}

// Check Capacitor config
console.log('\n📱 Capacitor Config Check:');
if (fs.existsSync('capacitor.config.ts')) {
  console.log('✅ capacitor.config.ts exists');
} else {
  console.log('❌ capacitor.config.ts not found');
}

// Check iOS directory
console.log('\n🍎 iOS Directory Check:');
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
console.log('\n📦 Package.json Scripts:');
if (fs.existsSync('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const scripts = packageJson.scripts || {};
  
  console.log('Available scripts:');
  Object.keys(scripts).forEach(script => {
    console.log(`  - ${script}: ${scripts[script]}`);
  });
}

console.log('\n🔧 Common iOS White Page Fixes:');
console.log('1. Run: npm run build:ios');
console.log('2. Check: npx cap sync ios');
console.log('3. Open: npx cap open ios');
console.log('4. In Xcode: Product > Clean Build Folder');
console.log('5. In Xcode: Product > Build');
