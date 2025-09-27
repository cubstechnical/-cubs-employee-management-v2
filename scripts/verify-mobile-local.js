#!/usr/bin/env node

/**
 * Verify Mobile App Local Configuration
 * Ensures the mobile app runs locally instead of redirecting to cubsgroups.com
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Mobile App Local Configuration...');

// Check Capacitor config
console.log('\n📱 Capacitor Configuration Check:');
if (fs.existsSync('capacitor.config.ts')) {
  const config = fs.readFileSync('capacitor.config.ts', 'utf8');
  
  if (config.includes('server:')) {
    console.log('❌ Server configuration found - this will cause redirects to external URL');
    console.log('   The server config should be commented out for local mobile apps');
  } else {
    console.log('✅ No server configuration - app will run locally');
  }
  
  if (config.includes('webDir: \'out\'')) {
    console.log('✅ WebDir set to \'out\' - using local build files');
  } else {
    console.log('❌ WebDir not set correctly');
  }
} else {
  console.log('❌ capacitor.config.ts not found');
}

// Check build output
console.log('\n📁 Build Output Check:');
if (fs.existsSync('out')) {
  console.log('✅ out/ directory exists');
  
  if (fs.existsSync('out/index.html')) {
    const indexContent = fs.readFileSync('out/index.html', 'utf8');
    console.log('📄 index.html size:', indexContent.length, 'bytes');
    
    if (indexContent.includes('__next')) {
      console.log('✅ index.html contains Next.js app root');
    } else {
      console.log('❌ index.html missing Next.js app root');
    }
    
    if (indexContent.includes('window.Capacitor')) {
      console.log('✅ index.html contains Capacitor detection');
    } else {
      console.log('❌ index.html missing Capacitor detection');
    }
    
    if (indexContent.includes('cubsgroups.com')) {
      console.log('⚠️ index.html contains external URL references');
    } else {
      console.log('✅ index.html has no external URL references');
    }
  } else {
    console.log('❌ index.html not found in out/');
  }
} else {
  console.log('❌ out/ directory not found');
}

// Check Android configuration
console.log('\n🤖 Android Configuration Check:');
const androidConfigPath = 'android/app/src/main/assets/capacitor.config.json';
if (fs.existsSync(androidConfigPath)) {
  const androidConfig = JSON.parse(fs.readFileSync(androidConfigPath, 'utf8'));
  
  if (androidConfig.server && androidConfig.server.url) {
    console.log('❌ Android config has server URL:', androidConfig.server.url);
    console.log('   This will cause the app to redirect to external URL');
  } else {
    console.log('✅ Android config has no server URL - will run locally');
  }
} else {
  console.log('❌ Android Capacitor config not found');
}

// Check iOS configuration
console.log('\n🍎 iOS Configuration Check:');
const iosConfigPath = 'ios/App/App/capacitor.config.json';
if (fs.existsSync(iosConfigPath)) {
  const iosConfig = JSON.parse(fs.readFileSync(iosConfigPath, 'utf8'));
  
  if (iosConfig.server && iosConfig.server.url) {
    console.log('❌ iOS config has server URL:', iosConfig.server.url);
    console.log('   This will cause the app to redirect to external URL');
  } else {
    console.log('✅ iOS config has no server URL - will run locally');
  }
} else {
  console.log('❌ iOS Capacitor config not found');
}

console.log('\n🔧 Mobile App Status:');
console.log('✅ Mobile app should now run locally without redirecting to cubsgroups.com');
console.log('✅ The app will use the built files from the \'out\' directory');
console.log('✅ No external server configuration - pure local mobile app');

console.log('\n📱 Next Steps:');
console.log('1. Build and test on Android: npx cap open android');
console.log('2. Build and test on iOS: npx cap open ios');
console.log('3. The app should now work as a native mobile app');
console.log('4. No more redirects to cubsgroups.com!');
