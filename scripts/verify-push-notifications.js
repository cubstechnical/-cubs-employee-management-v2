#!/usr/bin/env node

/**
 * Push Notifications Verification Script
 * 
 * This script verifies that push notifications are properly configured.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Push Notifications Setup...\n');

const checks = [
  {
    name: 'Firebase Admin SDK',
    check: () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return packageJson.dependencies && packageJson.dependencies['firebase-admin'];
    }
  },
  {
    name: 'Android Configuration',
    check: () => {
      const configPath = path.join('android/app/google-services.json');
      return fs.existsSync(configPath);
    }
  },
  {
    name: 'iOS Configuration',
    check: () => {
      const configPath = path.join('ios/App/App/GoogleService-Info.plist');
      return fs.existsSync(configPath);
    }
  },
  {
    name: 'Environment Variables',
    check: () => {
      const envPath = path.join('.env');
      if (!fs.existsSync(envPath)) return false;
      const envContent = fs.readFileSync(envPath, 'utf8');
      return envContent.includes('FIREBASE_PROJECT_ID') && 
             envContent.includes('FIREBASE_CLIENT_EMAIL') && 
             envContent.includes('FIREBASE_PRIVATE_KEY');
    }
  },
  {
    name: 'Database Tables',
    check: () => {
      const sqlPath = path.join('sql/push_notifications_setup.sql');
      return fs.existsSync(sqlPath);
    }
  }
];

let allPassed = true;

checks.forEach(check => {
  try {
    const passed = check.check();
    console.log(`${passed ? '✅' : '❌'} ${check.name}`);
    if (!passed) allPassed = false;
  } catch (error) {
    console.log(`❌ ${check.name} - Error: ${error.message}`);
    allPassed = false;
  }
});

console.log('\n' + (allPassed ? '🎉 All checks passed!' : '⚠️  Some checks failed. Please review the setup.'));
