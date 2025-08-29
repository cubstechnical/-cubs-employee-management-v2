#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying EAS Build Configuration...\n');

let allChecksPass = true;

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: Found`);
    return true;
  } else {
    console.log(`❌ ${description}: Missing`);
    allChecksPass = false;
    return false;
  }
}

function checkCommand(command, description) {
  try {
    execSync(command, { stdio: 'pipe' });
    console.log(`✅ ${description}: Available`);
    return true;
  } catch (error) {
    console.log(`❌ ${description}: Not available`);
    allChecksPass = false;
    return false;
  }
}

// Check configuration files
console.log('📁 Configuration Files:');
checkFile('app.json', 'Expo app configuration');
checkFile('eas.json', 'EAS Build configuration');
checkFile('capacitor.config.ts', 'Capacitor configuration');
checkFile('metro.config.js', 'Metro bundler configuration');
checkFile('package.json', 'Package configuration');

console.log('\n🛠️  CLI Tools:');
checkCommand('expo --version', 'Expo CLI');
checkCommand('eas --version', 'EAS CLI');
checkCommand('cap --version', 'Capacitor CLI');

console.log('\n👤 Authentication:');
try {
  const whoami = execSync('eas whoami', { encoding: 'utf8' }).trim();
  console.log(`✅ Expo Account: ${whoami}`);
} catch (error) {
  console.log('❌ Expo Account: Not logged in');
  console.log('   Run: eas login');
  allChecksPass = false;
}

console.log('\n📦 Dependencies:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = ['expo', 'react-native', '@capacitor/ios', '@capacitor/android'];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies && packageJson.dependencies[dep]) {
    console.log(`✅ ${dep}: Installed`);
  } else {
    console.log(`❌ ${dep}: Missing`);
    allChecksPass = false;
  }
});

console.log('\n📱 Build Scripts:');
const buildScripts = [
  'eas:build',
  'eas:build:ios',
  'eas:build:ios:production',
  'eas:build:android',
  'eas:build:android:production'
];

buildScripts.forEach(script => {
  if (packageJson.scripts && packageJson.scripts[script]) {
    console.log(`✅ ${script}: Configured`);
  } else {
    console.log(`❌ ${script}: Missing`);
    allChecksPass = false;
  }
});

console.log('\n🔐 Credentials Setup:');
if (fs.existsSync('private_keys/AuthKey.p8')) {
  console.log('✅ App Store Connect API Key: Found');
} else {
  console.log('⚠️  App Store Connect API Key: Not found (required for production builds)');
  console.log('   Place your AuthKey.p8 file in ./private_keys/');
}

console.log('\n📋 Summary:');
if (allChecksPass) {
  console.log('🎉 All checks passed! Your EAS Build setup is ready.');
  console.log('\n🚀 Next steps:');
  console.log('1. Configure iOS credentials: npm run eas:configure:ios');
  console.log('2. Test development build: npm run eas:build:preview');
  console.log('3. Build for production: npm run eas:build:ios:production');
  console.log('4. Submit to App Store: npm run eas:submit:ios');
} else {
  console.log('⚠️  Some checks failed. Please fix the issues above before building.');
  console.log('\n🔧 Quick fixes:');
  console.log('- Install missing dependencies: npm install');
  console.log('- Login to Expo: eas login');
  console.log('- Configure credentials: npm run eas:configure:ios');
}

console.log('\n📖 For help, see: EAS_BUILD_SETUP_GUIDE.md');

process.exit(allChecksPass ? 0 : 1);
