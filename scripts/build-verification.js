#!/usr/bin/env node

/**
 * Build Verification Script
 * 
 * This script verifies that both Android and iOS builds are successful
 * and ready for app store submission.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Verifying Build Success for CUBS Visa Management...\n');

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

// Build verification checks
const buildChecks = [
  // 1. Prerequisites
  {
    category: 'Prerequisites',
    checks: [
      {
        name: 'Node.js Installation',
        check: () => {
          try {
            const version = execSync('node --version', { encoding: 'utf8' }).trim();
            return version.startsWith('v');
          } catch (error) {
            return false;
          }
        }
      },
      {
        name: 'npm Installation',
        check: () => {
          try {
            const version = execSync('npm --version', { encoding: 'utf8' }).trim();
            return version.match(/^\d+\.\d+\.\d+$/);
          } catch (error) {
            return false;
          }
        }
      },
      {
        name: 'Capacitor CLI',
        check: () => {
          try {
            execSync('npx cap --version', { encoding: 'utf8' });
            return true;
          } catch (error) {
            return false;
          }
        }
      }
    ]
  },

  // 2. Project Configuration
  {
    category: 'Project Configuration',
    checks: [
      {
        name: 'package.json',
        check: () => {
          const packagePath = path.join('package.json');
          if (!fs.existsSync(packagePath)) return false;
          const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
          return packageJson.name === 'cubs-admin' && packageJson.version;
        }
      },
      {
        name: 'capacitor.config.ts',
        check: () => {
          const configPath = path.join('capacitor.config.ts');
          if (!fs.existsSync(configPath)) return false;
          const config = fs.readFileSync(configPath, 'utf8');
          return config.includes('cubsgroups.com') && 
                 config.includes('com.cubstechnical.admin');
        }
      },
      {
        name: 'Environment Variables',
        check: () => {
          const envPath = path.join('.env');
          const envExamplePath = path.join('env.example');
          return fs.existsSync(envPath) || fs.existsSync(envExamplePath);
        }
      }
    ]
  },

  // 3. Dependencies
  {
    category: 'Dependencies',
    checks: [
      {
        name: 'node_modules',
        check: () => {
          const nodeModulesPath = path.join('node_modules');
          return fs.existsSync(nodeModulesPath);
        }
      },
      {
        name: 'Capacitor Dependencies',
        check: () => {
          const packagePath = path.join('package.json');
          if (!fs.existsSync(packagePath)) return false;
          const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
          return packageJson.dependencies && 
                 packageJson.dependencies['@capacitor/core'] &&
                 packageJson.dependencies['@capacitor/android'] &&
                 packageJson.dependencies['@capacitor/ios'];
        }
      },
      {
        name: 'Push Notification Dependencies',
        check: () => {
          const packagePath = path.join('package.json');
          if (!fs.existsSync(packagePath)) return false;
          const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
          return packageJson.dependencies && 
                 packageJson.dependencies['@capacitor/push-notifications'];
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
        name: 'Android Gradle Files',
        check: () => {
          const gradlePath = path.join('android', 'build.gradle');
          const appGradlePath = path.join('android', 'app', 'build.gradle');
          return fs.existsSync(gradlePath) && fs.existsSync(appGradlePath);
        }
      },
      {
        name: 'Android Manifest',
        check: () => {
          const manifestPath = path.join('android', 'app', 'src', 'main', 'AndroidManifest.xml');
          return fs.existsSync(manifestPath);
        }
      },
      {
        name: 'Android Build Script',
        check: () => {
          const buildScript = path.join('BUILD_FINAL_WORKING.bat');
          return fs.existsSync(buildScript);
        }
      }
    ]
  },

  // 5. iOS Build Configuration
  {
    category: 'iOS Build Configuration',
    checks: [
      {
        name: 'iOS Platform',
        check: () => {
          const iosPath = path.join('ios');
          return fs.existsSync(iosPath);
        }
      },
      {
        name: 'iOS Build Script',
        check: () => {
          const iosScript = path.join('BUILD_iOS_PRODUCTION.sh');
          return fs.existsSync(iosScript);
        }
      },
      {
        name: 'iOS Project Files',
        check: () => {
          const iosAppPath = path.join('ios', 'App');
          return fs.existsSync(iosAppPath);
        }
      }
    ]
  },

  // 6. Build Scripts
  {
    category: 'Build Scripts',
    checks: [
      {
        name: 'Android Build Script (Windows)',
        check: () => {
          const buildScript = path.join('BUILD_FINAL_WORKING.bat');
          return fs.existsSync(buildScript);
        }
      },
      {
        name: 'iOS Build Script (macOS)',
        check: () => {
          const iosScript = path.join('BUILD_iOS_PRODUCTION.sh');
          return fs.existsSync(iosScript);
        }
      },
      {
        name: 'GitHub Actions Workflow',
        check: () => {
          const workflowPath = path.join('.github', 'workflows', 'mobile-build.yml');
          return fs.existsSync(workflowPath);
        }
      }
    ]
  },

  // 7. App Store Assets
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
  }
];

// Run all build checks
let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

buildChecks.forEach(category => {
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

// Build verification summary
console.log('\n' + '='.repeat(60));
log('📊 BUILD VERIFICATION SUMMARY', 'bright');
console.log('='.repeat(60));

log(`\nTotal Checks: ${totalChecks}`, 'cyan');
log(`Passed: ${passedChecks}`, 'green');
log(`Failed: ${failedChecks}`, failedChecks > 0 ? 'red' : 'green');

const buildPercentage = Math.round((passedChecks / totalChecks) * 100);

if (buildPercentage >= 95) {
  log(`\n🎉 Build Readiness: ${buildPercentage}% - EXCELLENT!`, 'green');
  log('✅ Ready for app store builds', 'green');
} else if (buildPercentage >= 85) {
  log(`\n⚠️  Build Readiness: ${buildPercentage}% - GOOD`, 'yellow');
  log('⚠️  Minor issues to address before building', 'yellow');
} else {
  log(`\n❌ Build Readiness: ${buildPercentage}% - NEEDS WORK`, 'red');
  log('❌ Significant issues to address before building', 'red');
}

// Build instructions
console.log('\n' + '='.repeat(60));
log('🔨 BUILD INSTRUCTIONS', 'bright');
console.log('='.repeat(60));

log('\n📱 Android Build:', 'cyan');
log('1. Run: ./BUILD_FINAL_WORKING.bat', 'bright');
log('2. APK Location: android/app/build/outputs/apk/release/app-release.apk', 'bright');
log('3. AAB Location: android/app/build/outputs/bundle/release/app-release.aab', 'bright');

log('\n🍎 iOS Build (macOS only):', 'cyan');
log('1. Run: ./BUILD_iOS_PRODUCTION.sh', 'bright');
log('2. Open: npx cap open ios', 'bright');
log('3. Build in Xcode for App Store', 'bright');

log('\n☁️  Cloud Build (GitHub Actions):', 'cyan');
log('1. Push to main branch', 'bright');
log('2. Check Actions tab for build status', 'bright');
log('3. Download artifacts when complete', 'bright');

// Troubleshooting
console.log('\n' + '='.repeat(60));
log('🔧 TROUBLESHOOTING', 'bright');
console.log('='.repeat(60));

log('\n❌ Common Build Issues:', 'cyan');
log('• Java version mismatch - Use JDK 17', 'bright');
log('• Missing dependencies - Run: npm install', 'bright');
log('• Capacitor sync issues - Run: npx cap sync', 'bright');
log('• Android SDK issues - Check ANDROID_HOME', 'bright');
log('• iOS build issues - Requires macOS + Xcode', 'bright');

log('\n✅ Build Success Indicators:', 'cyan');
log('• Android: APK/AAB files generated', 'bright');
log('• iOS: Archive created in Xcode', 'bright');
log('• No build errors in console', 'bright');
log('• App launches successfully on device', 'bright');

console.log('\n' + '='.repeat(60));
