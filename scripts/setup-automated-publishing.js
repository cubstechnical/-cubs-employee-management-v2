#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Automated iOS Publishing Setup for Codemagic\n');

// Check if user has necessary files
console.log('📋 Checking your setup...\n');

const checks = [
  { file: 'codemagic.yaml', desc: 'Codemagic workflow configuration' },
  { file: 'AUTOMATED_PUBLISHING_SETUP.md', desc: 'Publishing setup guide' },
  { file: 'codemagic-env-template', desc: 'Environment variables template' }
];

let allGood = true;

checks.forEach(check => {
  if (fs.existsSync(check.file)) {
    console.log(`✅ ${check.desc}: Found`);
  } else {
    console.log(`❌ ${check.desc}: Missing`);
    allGood = false;
  }
});

if (!allGood) {
  console.log('\n❌ Some required files are missing. Please ensure:');
  console.log('- Your codemagic.yaml is properly configured');
  console.log('- You have the setup guide available');
  process.exit(1);
}

console.log('\n🎉 Your Codemagic setup supports automated publishing!\n');

console.log('📝 Automated Publishing Setup Checklist:\n');

console.log('✅ STEP 1: Create App Store Connect API Key');
console.log('   • Go to: https://appstoreconnect.apple.com/access/api');
console.log('   • Create new API Key with "App Manager" access');
console.log('   • Download the .p8 file');
console.log('   • Note the Key ID and Issuer ID\n');

console.log('✅ STEP 2: Configure Codemagic Environment Variables');
console.log('   • Go to your Codemagic app → Environment Variables');
console.log('   • Add APP_STORE_CONNECT_API_KEY (paste entire .p8 content)');
console.log('   • Add APP_STORE_CONNECT_KEY_ID (your Key ID)');
console.log('   • Add APP_STORE_CONNECT_ISSUER_ID (your Issuer ID)\n');

console.log('✅ STEP 3: Set Up TestFlight Beta Group (Optional)');
console.log('   • Go to App Store Connect → TestFlight');
console.log('   • Create "Internal Testers" group');
console.log('   • Add your test users\n');

console.log('✅ STEP 4: Test Automated Publishing');
console.log('   • Push code to trigger build');
console.log('   • Or manually start build in Codemagic');
console.log('   • Monitor build logs');
console.log('   • Check TestFlight for new build\n');

console.log('🎯 What Happens Automatically:\n');
console.log('   1. Code push → Codemagic build starts');
console.log('   2. Next.js build → Capacitor sync → iOS archive');
console.log('   3. IPA export → Auto-upload to App Store Connect');
console.log('   4. Submit to TestFlight → Email notifications');
console.log('   5. Build available in TestFlight within 10-15 minutes\n');

console.log('📊 Build Workflow:');
console.log('   • Build Time: 15-30 minutes');
console.log('   • Publishing Time: 2-3 minutes');
console.log('   • Total Time: ~20-35 minutes');
console.log('   • Notifications: Email on success/failure\n');

console.log('🔧 Manual Override Available:');
console.log('   • If auto-publishing fails, download IPA manually');
console.log('   • Upload to App Store Connect manually');
console.log('   • Full control when needed\n');

console.log('📚 Documentation:');
console.log('• Complete Guide: AUTOMATED_PUBLISHING_SETUP.md');
console.log('• Environment Template: codemagic-env-template');
console.log('• Workflow Config: codemagic.yaml\n');

console.log('💡 Pro Tips:');
console.log('• Free tier: 500 builds/month');
console.log('• Multiple builds can run in parallel');
console.log('• Get notifications for every build');
console.log('• No Mac computer required for any step\n');

console.log('🎉 Ready for fully automated iOS publishing! 🚀');

if (fs.existsSync('AUTOMATED_PUBLISHING_SETUP.md')) {
  console.log('\n📖 Open AUTOMATED_PUBLISHING_SETUP.md for detailed step-by-step instructions');
}
