#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Codemagic Setup Helper for iOS Builds\n');

// Check if user has necessary files
console.log('📋 Checking your setup...\n');

const checks = [
  { file: 'package.json', desc: 'Package configuration' },
  { file: 'capacitor.config.ts', desc: 'Capacitor configuration' },
  { file: 'codemagic.yaml', desc: 'Codemagic workflow configuration' },
  { file: 'ios/App/App.xcodeproj', desc: 'iOS Xcode project', type: 'directory' }
];

let allGood = true;

checks.forEach(check => {
  if (check.type === 'directory') {
    if (fs.existsSync(check.file)) {
      console.log(`✅ ${check.desc}: Found`);
    } else {
      console.log(`❌ ${check.desc}: Missing`);
      allGood = false;
    }
  } else {
    if (fs.existsSync(check.file)) {
      console.log(`✅ ${check.desc}: Found`);
    } else {
      console.log(`❌ ${check.desc}: Missing`);
      allGood = false;
    }
  }
});

if (!allGood) {
  console.log('\n❌ Some required files are missing. Please ensure:');
  console.log('- You have run: npx cap add ios');
  console.log('- Your project is properly configured');
  process.exit(1);
}

console.log('\n🎉 Your project is ready for Codemagic!\n');

console.log('📝 Next Steps:\n');

console.log('1. 📱 Create Codemagic Account:');
console.log('   • Go to: https://codemagic.io');
console.log('   • Sign up for a free account\n');

console.log('2. 🔗 Connect Your Repository:');
console.log('   • Click "Add Application"');
console.log('   • Connect your Git repository');
console.log('   • Select this repository\n');

console.log('3. ⚙️ Configure Build Settings:');
console.log('   • Workflow: ios-capacitor-build');
console.log('   • Branch: main (or your default branch)');
console.log('   • Build triggers: Push + Manual\n');

console.log('4. 🌍 Environment Variables (Optional):');
console.log('   • NODE_ENV=production');
console.log('   • CI=true');
console.log('   • Add App Store Connect keys for publishing\n');

console.log('5. 🚀 Start Your First Build:');
console.log('   • Click "Start Build"');
console.log('   • Select "ios-capacitor-build" workflow');
console.log('   • Wait 15-30 minutes');
console.log('   • Download the IPA file\n');

console.log('6. 📤 Upload to App Store:');
console.log('   • Go to: https://appstoreconnect.apple.com');
console.log('   • TestFlight → iOS Builds → Upload IPA');
console.log('   • Wait 10-15 minutes for processing\n');

console.log('📚 Documentation:');
console.log('• Setup Guide: CODEMAGIC_SETUP_GUIDE.md');
console.log('• Environment Template: codemagic-env-template');
console.log('• Workflow Config: codemagic.yaml\n');

console.log('💡 Pro Tips:');
console.log('• iOS builds take 15-30 minutes');
console.log('• You get 500 free builds per month');
console.log('• No Mac computer required!');
console.log('• Builds run on Codemagic\'s macOS servers\n');

console.log('🎯 Ready to build your iOS app without a Mac! 🚀');

if (fs.existsSync('CODEMAGIC_SETUP_GUIDE.md')) {
  console.log('\n📖 Open CODEMAGIC_SETUP_GUIDE.md for detailed instructions');
}
