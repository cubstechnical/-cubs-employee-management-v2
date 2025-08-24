#!/usr/bin/env node

/**
 * Push Notifications Setup Script
 * 
 * This script helps set up push notifications for the CUBS Visa Management app.
 * It will:
 * 1. Install required dependencies
 * 2. Create necessary directories
 * 3. Generate configuration files
 * 4. Update environment variables
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Push Notifications for CUBS Visa Management...\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Step 1: Check prerequisites
logStep(1, 'Checking prerequisites...');

try {
  // Check if Node.js is installed
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  logSuccess(`Node.js version: ${nodeVersion}`);

  // Check if npm is installed
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  logSuccess(`npm version: ${npmVersion}`);

  // Check if Capacitor is installed
  try {
    execSync('npx cap --version', { encoding: 'utf8' });
    logSuccess('Capacitor CLI is installed');
  } catch (error) {
    logWarning('Capacitor CLI not found. Installing...');
    execSync('npm install @capacitor/cli', { stdio: 'inherit' });
    logSuccess('Capacitor CLI installed');
  }

} catch (error) {
  logError('Failed to check prerequisites');
  process.exit(1);
}

// Step 2: Install Firebase Admin SDK
logStep(2, 'Installing Firebase Admin SDK...');

try {
  execSync('npm install firebase-admin', { stdio: 'inherit' });
  logSuccess('Firebase Admin SDK installed');
} catch (error) {
  logError('Failed to install Firebase Admin SDK');
  process.exit(1);
}

// Step 3: Create necessary directories
logStep(3, 'Creating necessary directories...');

const directories = [
  'android/app',
  'ios/App/App',
  'docs',
  'sql'
];

directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    logSuccess(`Created directory: ${dir}`);
  } else {
    logInfo(`Directory already exists: ${dir}`);
  }
});

// Step 4: Create Firebase configuration template
logStep(4, 'Creating Firebase configuration templates...');

// Android google-services.json template
const androidConfigTemplate = {
  project_info: {
    project_number: "YOUR_PROJECT_NUMBER",
    project_id: "cubs-visa-management",
    storage_bucket: "cubs-visa-management.appspot.com"
  },
  client: [
    {
      client_info: {
        mobilesdk_app_id: "1:YOUR_PROJECT_NUMBER:android:YOUR_APP_ID",
        android_client_info: {
          package_name: "com.cubstechnical.admin"
        }
      },
      oauth_client: [],
      api_key: [
        {
          current_key: "YOUR_API_KEY"
        }
      ],
      services: {
        appinvite_service: {
          other_platform_oauth_client: []
        }
      }
    }
  ],
  configuration_version: "1"
};

// iOS GoogleService-Info.plist template
const iosConfigTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>API_KEY</key>
	<string>YOUR_API_KEY</string>
	<key>GCM_SENDER_ID</key>
	<string>YOUR_PROJECT_NUMBER</string>
	<key>PLIST_VERSION</key>
	<string>1</string>
	<key>BUNDLE_ID</key>
	<string>com.cubstechnical.admin</string>
	<key>PROJECT_ID</key>
	<string>cubs-visa-management</string>
	<key>STORAGE_BUCKET</key>
	<string>cubs-visa-management.appspot.com</string>
	<key>IS_ADS_ENABLED</key>
	<false></false>
	<key>IS_ANALYTICS_ENABLED</key>
	<false></false>
	<key>IS_APPINVITE_ENABLED</key>
	<true></true>
	<key>IS_GCM_ENABLED</key>
	<true></true>
	<key>IS_SIGNIN_ENABLED</key>
	<true></true>
	<key>GOOGLE_APP_ID</key>
	<string>1:YOUR_PROJECT_NUMBER:ios:YOUR_APP_ID</string>
</dict>
</plist>`;

// Write configuration templates
const androidConfigPath = path.join(process.cwd(), 'android/app/google-services.json.template');
const iosConfigPath = path.join(process.cwd(), 'ios/App/App/GoogleService-Info.plist.template');

fs.writeFileSync(androidConfigPath, JSON.stringify(androidConfigTemplate, null, 2));
fs.writeFileSync(iosConfigPath, iosConfigTemplate);

logSuccess('Created Android configuration template: android/app/google-services.json.template');
logSuccess('Created iOS configuration template: ios/App/App/GoogleService-Info.plist.template');

// Step 5: Update environment variables template
logStep(5, 'Updating environment variables template...');

const envPath = path.join(process.cwd(), 'env.example');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Add Firebase environment variables if they don't exist
const firebaseVars = `
# Firebase Admin SDK
FIREBASE_PROJECT_ID=cubs-visa-management
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@cubs-visa-management.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYour Private Key Here\\n-----END PRIVATE KEY-----\\n"
`;

if (!envContent.includes('FIREBASE_PROJECT_ID')) {
  envContent += firebaseVars;
  fs.writeFileSync(envPath, envContent);
  logSuccess('Added Firebase environment variables to env.example');
} else {
  logInfo('Firebase environment variables already exist in env.example');
}

// Step 6: Create setup verification script
logStep(6, 'Creating setup verification script...');

const verificationScript = `#!/usr/bin/env node

/**
 * Push Notifications Verification Script
 * 
 * This script verifies that push notifications are properly configured.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Push Notifications Setup...\\n');

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
    console.log(\`\${passed ? '✅' : '❌'} \${check.name}\`);
    if (!passed) allPassed = false;
  } catch (error) {
    console.log(\`❌ \${check.name} - Error: \${error.message}\`);
    allPassed = false;
  }
});

console.log('\\n' + (allPassed ? '🎉 All checks passed!' : '⚠️  Some checks failed. Please review the setup.'));
`;

const verificationPath = path.join(process.cwd(), 'scripts/verify-push-notifications.js');
fs.writeFileSync(verificationPath, verificationScript);
fs.chmodSync(verificationPath, '755');

logSuccess('Created verification script: scripts/verify-push-notifications.js');

// Step 7: Create test script
logStep(7, 'Creating test script...');

const testScript = `#!/usr/bin/env node

/**
 * Push Notifications Test Script
 * 
 * This script tests the push notification functionality.
 */

const { PushNotificationService } = require('../lib/services/pushNotifications');

async function testPushNotifications() {
  console.log('🧪 Testing Push Notifications...\\n');

  try {
    // Test initialization
    console.log('1. Testing initialization...');
    await PushNotificationService.initialize();
    console.log('✅ Initialization successful');

    // Test device token
    console.log('\\n2. Testing device token...');
    const token = PushNotificationService.getDeviceToken();
    if (token) {
      console.log('✅ Device token available:', token.substring(0, 20) + '...');
    } else {
      console.log('⚠️  No device token available (this is normal in web environment)');
    }

    // Test availability
    console.log('\\n3. Testing availability...');
    const available = PushNotificationService.isAvailable();
    console.log(\`\${available ? '✅' : '⚠️'} Push notifications \${available ? 'available' : 'not available'}\`);

    console.log('\\n🎉 Push notification tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPushNotifications();
`;

const testPath = path.join(process.cwd(), 'scripts/test-push-notifications.js');
fs.writeFileSync(testPath, testScript);
fs.chmodSync(testPath, '755');

logSuccess('Created test script: scripts/test-push-notifications.js');

// Step 8: Update package.json scripts
logStep(8, 'Updating package.json scripts...');

try {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const newScripts = {
    'push:setup': 'node scripts/setup-push-notifications.js',
    'push:verify': 'node scripts/verify-push-notifications.js',
    'push:test': 'node scripts/test-push-notifications.js',
    'push:install': 'npm install firebase-admin && node scripts/setup-push-notifications.js'
  };

  packageJson.scripts = { ...packageJson.scripts, ...newScripts };
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  logSuccess('Added push notification scripts to package.json');
} catch (error) {
  logError('Failed to update package.json');
}

// Final summary
console.log('\n' + '='.repeat(60));
log('🎉 Push Notifications Setup Complete!', 'green');
console.log('='.repeat(60));

log('\n📋 Next Steps:', 'bright');
log('1. Create a Firebase project at https://console.firebase.google.com/', 'cyan');
log('2. Download google-services.json and place it in android/app/', 'cyan');
log('3. Download GoogleService-Info.plist and place it in ios/App/App/', 'cyan');
log('4. Get Firebase service account credentials and update .env file', 'cyan');
log('5. Run the SQL script in sql/push_notifications_setup.sql', 'cyan');
log('6. Test with: npm run push:test', 'cyan');

log('\n📚 Documentation:', 'bright');
log('• Setup Guide: docs/PUSH_NOTIFICATIONS_SETUP.md', 'cyan');
log('• SQL Script: sql/push_notifications_setup.sql', 'cyan');
log('• Verification: npm run push:verify', 'cyan');

log('\n🔧 Available Commands:', 'bright');
log('• npm run push:setup    - Run this setup script', 'cyan');
log('• npm run push:verify   - Verify the setup', 'cyan');
log('• npm run push:test     - Test push notifications', 'cyan');
log('• npm run push:install  - Install dependencies and setup', 'cyan');

console.log('\n' + '='.repeat(60));
