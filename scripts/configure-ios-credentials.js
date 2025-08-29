#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function configureIOSCredentials() {
  console.log('🍎 iOS Credentials Setup for EAS Build\n');

  // Check if user is logged in
  try {
    execSync('eas whoami', { stdio: 'pipe' });
  } catch (error) {
    console.log('❌ Please login to Expo first:');
    console.log('   eas login\n');
    process.exit(1);
  }

  console.log('📋 This script will help you configure iOS credentials for EAS Build.\n');

  // Check for existing credentials
  try {
    console.log('🔍 Checking existing credentials...');
    execSync('eas credentials --platform ios', { stdio: 'inherit' });
    console.log('\n✅ iOS credentials are already configured!');
    return;
  } catch (error) {
    console.log('📝 No existing iOS credentials found. Let\'s set them up...\n');
  }

  console.log('🔑 You\'ll need:');
  console.log('1. Apple Developer account with App Manager access');
  console.log('2. App Store Connect API Key (.p8 file)');
  console.log('3. Your app\'s bundle identifier\n');

  const hasAppleDevAccount = await question('Do you have an Apple Developer account? (y/n): ');
  if (hasAppleDevAccount.toLowerCase() !== 'y') {
    console.log('\n📖 Please create an Apple Developer account first:');
    console.log('   https://developer.apple.com/programs/enroll/\n');
    process.exit(1);
  }

  const hasAppStoreConnectKey = await question('Do you have an App Store Connect API Key (.p8 file)? (y/n): ');
  if (hasAppStoreConnectKey.toLowerCase() !== 'y') {
    console.log('\n🔐 Create an App Store Connect API Key:');
    console.log('1. Go to: https://appstoreconnect.apple.com/access/api');
    console.log('2. Click "Keys" tab');
    console.log('3. Click "+" to create a new key');
    console.log('4. Name: "EAS Build Key"');
    console.log('5. Access: "App Manager"');
    console.log('6. Download the .p8 file');
    console.log('7. Save as: ./private_keys/AuthKey.p8\n');
    process.exit(1);
  }

  console.log('\n🚀 Starting EAS credentials setup...\n');

  try {
    // Create private_keys directory if it doesn't exist
    if (!fs.existsSync('private_keys')) {
      fs.mkdirSync('private_keys', { recursive: true });
    }

    // Run EAS credentials setup
    console.log('📱 Setting up iOS credentials...');
    execSync('eas credentials --platform ios', { stdio: 'inherit' });

    console.log('\n✅ iOS credentials configured successfully!');
    console.log('\n🎯 Next steps:');
    console.log('1. Test your build: npm run eas:build:ios');
    console.log('2. For production: npm run eas:build:ios:production');
    console.log('3. Submit to App Store: npm run eas:submit:ios');

  } catch (error) {
    console.log('\n❌ Failed to configure credentials. Please try manually:');
    console.log('   eas credentials --platform ios');
    console.log('\n🔗 For help, see: https://docs.expo.dev/app-signing/app-credentials/');
    process.exit(1);
  }

  rl.close();
}

configureIOSCredentials().catch(console.error);
