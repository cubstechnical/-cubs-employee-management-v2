#!/usr/bin/env node

/**
 * App Store Readiness Verification Script
 * 
 * This script verifies that the CUBS Visa Management app is ready for
 * app store submission for both Android and iOS platforms.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Verifying App Store Readiness for CUBS Visa Management...\n');

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

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

// App Store Readiness Checks
const checks = [
  // 1. Core App Configuration
  {
    category: 'Core App Configuration',
    checks: [
      {
        name: 'App Name',
        check: () => {
          const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
          return packageJson.name === 'cubs-admin';
        }
      },
      {
        name: 'App Version',
        check: () => {
          const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
          return packageJson.version && packageJson.version !== '0.0.0';
        }
      },
      {
        name: 'Capacitor Configuration',
        check: () => {
          const configPath = path.join('capacitor.config.ts');
          if (!fs.existsSync(configPath)) return false;
          const config = fs.readFileSync(configPath, 'utf8');
          return config.includes('cubsgroups.com') && 
                 config.includes('com.cubstechnical.admin') &&
                 config.includes('CUBS Visa Management');
        }
      },
      {
        name: 'Production URL Configuration',
        check: () => {
          const configPath = path.join('capacitor.config.ts');
          if (!fs.existsSync(configPath)) return false;
          const config = fs.readFileSync(configPath, 'utf8');
          return config.includes('https://cubsgroups.com');
        }
      }
    ]
  },

  // 2. Legal & Privacy Compliance
  {
    category: 'Legal & Privacy Compliance',
    checks: [
      {
        name: 'Privacy Policy',
        check: () => {
          const privacyPath = path.join('app', 'privacy', 'page.tsx');
          return fs.existsSync(privacyPath);
        }
      },
      {
        name: 'Terms of Service',
        check: () => {
          const termsPath = path.join('app', 'terms', 'page.tsx');
          return fs.existsSync(termsPath);
        }
      },
      {
        name: 'Data Safety Form Answers',
        check: () => {
          const dataSafetyPath = path.join('DATA_SAFETY_FORM_ANSWERS.md');
          return fs.existsSync(dataSafetyPath);
        }
      }
    ]
  },

  // 3. App Store Assets
  {
    category: 'App Store Assets',
    checks: [
      {
        name: 'App Icons',
        check: () => {
          const iconsPath = path.join('public', 'assets', 'generated-icons');
          return fs.existsSync(iconsPath) && fs.readdirSync(iconsPath).length > 0;
        }
      },
      {
        name: 'Screenshots',
        check: () => {
          const screenshotsPath = path.join('public', 'assets', 'screenshots');
          return fs.existsSync(screenshotsPath) && fs.readdirSync(screenshotsPath).length > 0;
        }
      },
      {
        name: 'App Manifest',
        check: () => {
          const manifestPath = path.join('public', 'manifest.webmanifest');
          return fs.existsSync(manifestPath);
        }
      }
    ]
  },

  // 4. Android Build Configuration
  {
    category: 'Android Build Configuration',
    checks: [
      {
        name: 'Android Platform',
        check: () => {
          const androidPath = path.join('android');
          return fs.existsSync(androidPath);
        }
      },
      {
        name: 'Android Build Script',
        check: () => {
          const buildScript = path.join('BUILD_FINAL_WORKING.bat');
          return fs.existsSync(buildScript);
        }
      },
      {
        name: 'Android Gradle Configuration',
        check: () => {
          const gradlePath = path.join('android', 'build.gradle');
          return fs.existsSync(gradlePath);
        }
      },
      {
        name: 'Android App Gradle',
        check: () => {
          const appGradlePath = path.join('android', 'app', 'build.gradle');
          return fs.existsSync(appGradlePath);
        }
      }
    ]
  },

  // 5. iOS Build Configuration
  {
    category: 'iOS Build Configuration',
    checks: [
      {
        name: 'iOS Build Script',
        check: () => {
          const iosScript = path.join('BUILD_iOS_PRODUCTION.sh');
          return fs.existsSync(iosScript);
        }
      },
      {
        name: 'iOS Platform Directory',
        check: () => {
          const iosPath = path.join('ios');
          return fs.existsSync(iosPath);
        }
      }
    ]
  },

  // 6. Push Notifications
  {
    category: 'Push Notifications',
    checks: [
      {
        name: 'Push Notification Service',
        check: () => {
          const pushServicePath = path.join('lib', 'services', 'pushNotifications.ts');
          return fs.existsSync(pushServicePath);
        }
      },
      {
        name: 'Push Notification API',
        check: () => {
          const pushApiPath = path.join('app', 'api', 'push-notifications', 'send', 'route.ts');
          return fs.existsSync(pushApiPath);
        }
      },
      {
        name: 'Push Notification Database Script',
        check: () => {
          const sqlPath = path.join('sql', 'push_notifications_setup.sql');
          return fs.existsSync(sqlPath);
        }
      }
    ]
  },

  // 7. Core Features
  {
    category: 'Core Features',
    checks: [
      {
        name: 'Authentication System',
        check: () => {
          const authPath = path.join('lib', 'services', 'auth.ts');
          return fs.existsSync(authPath);
        }
      },
      {
        name: 'Employee Management',
        check: () => {
          const employeePath = path.join('lib', 'services', 'employees.ts');
          return fs.existsSync(employeePath);
        }
      },
      {
        name: 'Visa Notifications',
        check: () => {
          const visaPath = path.join('lib', 'services', 'visaNotifications.ts');
          return fs.existsSync(visaPath);
        }
      },
      {
        name: 'Document Management',
        check: () => {
          const docsPath = path.join('app', 'api', 'documents');
          return fs.existsSync(docsPath);
        }
      }
    ]
  },

  // 8. Demo Credentials
  {
    category: 'Demo Credentials',
    checks: [
      {
        name: 'Demo Credentials Documentation',
        check: () => {
          const demoPath = path.join('DEMO_CREDENTIALS_FOR_REVIEWERS.md');
          return fs.existsSync(demoPath);
        }
      },
      {
        name: 'Admin Account Available',
        check: () => {
          const demoPath = path.join('DEMO_CREDENTIALS_FOR_REVIEWERS.md');
          if (!fs.existsSync(demoPath)) return false;
          const content = fs.readFileSync(demoPath, 'utf8');
          return content.includes('info@cubstechnical.com') && content.includes('Admin@123456');
        }
      }
    ]
  }
];

// Run all checks
let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

checks.forEach(category => {
  logStep(category.category, '');
  
  category.checks.forEach(check => {
    totalChecks++;
    try {
      const passed = check.check();
      if (passed) {
        logSuccess(check.name);
        passedChecks++;
      } else {
        logError(check.name);
        failedChecks++;
      }
    } catch (error) {
      logError(`${check.name} - Error: ${error.message}`);
      failedChecks++;
    }
  });
});

// Summary
console.log('\n' + '='.repeat(60));
log('📊 APP STORE READINESS SUMMARY', 'bright');
console.log('='.repeat(60));

log(`\nTotal Checks: ${totalChecks}`, 'cyan');
log(`Passed: ${passedChecks}`, 'green');
log(`Failed: ${failedChecks}`, failedChecks > 0 ? 'red' : 'green');

const readinessPercentage = Math.round((passedChecks / totalChecks) * 100);

if (readinessPercentage >= 95) {
  log(`\n🎉 App Store Readiness: ${readinessPercentage}% - EXCELLENT!`, 'green');
  log('✅ Ready for app store submission', 'green');
} else if (readinessPercentage >= 85) {
  log(`\n⚠️  App Store Readiness: ${readinessPercentage}% - GOOD`, 'yellow');
  log('⚠️  Minor issues to address before submission', 'yellow');
} else {
  log(`\n❌ App Store Readiness: ${readinessPercentage}% - NEEDS WORK`, 'red');
  log('❌ Significant issues to address before submission', 'red');
}

// Recommendations
console.log('\n' + '='.repeat(60));
log('📋 RECOMMENDATIONS FOR REVIEWERS', 'bright');
console.log('='.repeat(60));

log('\n🔑 Demo Credentials:', 'cyan');
log('Email: info@cubstechnical.com', 'bright');
log('Password: Admin@123456', 'bright');

log('\n📱 Key Features to Test:', 'cyan');
log('• User registration and approval workflow', 'bright');
log('• Employee management (add, edit, delete)', 'bright');
log('• Document upload and management', 'bright');
log('• Visa expiry notifications', 'bright');
log('• Push notifications (if configured)', 'bright');

log('\n🌐 Production URL:', 'cyan');
log('https://cubsgroups.com', 'bright');

log('\n📚 Documentation:', 'cyan');
log('• Setup Guide: docs/PUSH_NOTIFICATIONS_SETUP.md', 'bright');
log('• Demo Credentials: DEMO_CREDENTIALS_FOR_REVIEWERS.md', 'bright');
log('• Data Safety: DATA_SAFETY_FORM_ANSWERS.md', 'bright');

console.log('\n' + '='.repeat(60));
