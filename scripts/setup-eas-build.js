#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up EAS Build for Capacitor project...\n');

// Check if EAS CLI is installed
try {
  execSync('eas --version', { stdio: 'pipe' });
  console.log('✅ EAS CLI is installed');
} catch (error) {
  console.log('❌ EAS CLI not found. Installing...');
  execSync('npm install -g eas-cli', { stdio: 'inherit' });
}

// Check if user is logged in to Expo
try {
  execSync('eas whoami', { stdio: 'pipe' });
  console.log('✅ User is logged in to Expo');
} catch (error) {
  console.log('❌ Not logged in to Expo. Please run: eas login');
  process.exit(1);
}

// Create necessary directories
const dirs = ['private_keys', 'credentials'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

console.log('\n📋 Next steps:');
console.log('1. Create an App Store Connect API Key:');
console.log('   - Go to https://appstoreconnect.apple.com/access/api');
console.log('   - Create a new API Key with App Manager access');
console.log('   - Download the .p8 file and save it to ./private_keys/AuthKey.p8');
console.log('   - Note the Key ID and Issuer ID');

console.log('\n2. Set up EAS Build credentials:');
console.log('   - Run: eas build:setup');
console.log('   - Or manually configure credentials with: eas credentials');

console.log('\n3. Configure environment variables in EAS dashboard:');
console.log('   - Go to https://expo.dev/settings/projects');
console.log('   - Find your project and add environment variables');

console.log('\n4. Build your app:');
console.log('   - npm run eas:build:ios:production');

console.log('\n🔗 Useful links:');
console.log('- EAS Build docs: https://docs.expo.dev/build/introduction/');
console.log('- iOS credentials: https://docs.expo.dev/app-signing/app-credentials/');
console.log('- App Store Connect: https://developer.apple.com/support/app-store-connect/');

console.log('\n✨ Setup complete! Ready to build with EAS.');
