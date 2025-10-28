#!/usr/bin/env node

/**
 * Android Mobile Testing Script for CUBS Employee Management
 * Tests responsive design, touch interactions, and Android-specific features
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📱 CUBS Employee Management - Android Mobile Testing\n');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runTest(command, description) {
  try {
    log(`📋 Running ${description}...`, colors.blue);
    const output = execSync(command, {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..'),
      timeout: 120000 // 2 minute timeout for mobile tests
    });

    if (output.includes('PASS') || output.includes('✓') || output.includes('All tests passed')) {
      log(`✅ ${description} completed successfully!`, colors.green);
      return { success: true, output };
    } else if (output.includes('FAIL') || output.includes('✗') || output.includes('failed')) {
      log(`❌ ${description} failed:`, colors.red);
      log(output, colors.red);
      return { success: false, output };
    } else {
      log(`⚠️  ${description} completed with warnings`, colors.yellow);
      return { success: true, output };
    }
  } catch (error) {
    log(`❌ ${description} failed:`, colors.red);
    log(error.stdout || error.message, colors.red);
    return { success: false, output: error.stdout || error.message };
  }
}

async function testMobileApp() {
  const results = {
    server: false,
    responsive: false,
    touch: false,
    playwrightMobile: false,
    capacitor: false,
    androidConfig: false,
  };

  log('=' .repeat(70), colors.blue);
  log('📱 ANDROID MOBILE APP TESTING', colors.bold + colors.blue);
  log('='.repeat(70), colors.blue);

  log('\n📱 Testing Mobile Compatibility:', colors.yellow);
  log(`   Server: http://localhost:3000`, colors.yellow);
  log(`   Target: Android Mobile`, colors.yellow);

  // Test 1: Check if server is running
  log('\n1️⃣ Checking Development Server...', colors.bold);
  try {
    const serverCheck = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login', {
      encoding: 'utf8',
      timeout: 10000
    });

    if (serverCheck === '200') {
      results.server = true;
      log(`✅ Server is running (HTTP ${serverCheck})`, colors.green);
    } else {
      log(`⚠️  Server responded with HTTP ${serverCheck}`, colors.yellow);
    }
  } catch (error) {
    log(`❌ Server not accessible: ${error.message}`, colors.red);
  }

  // Test 2: Check Capacitor configuration
  log('\n2️⃣ Verifying Capacitor Android Configuration...', colors.bold);
  try {
    const capacitorConfig = fs.readFileSync('capacitor.config.ts', 'utf8');
    if (capacitorConfig.includes('com.cubstechnical.employee') &&
        capacitorConfig.includes('androidScheme') &&
        capacitorConfig.includes('KeyboardResize')) {
      results.capacitor = true;
      log(`✅ Capacitor Android configuration valid`, colors.green);
    } else {
      log(`❌ Capacitor configuration incomplete`, colors.red);
    }
  } catch (error) {
    log(`❌ Could not read Capacitor config: ${error.message}`, colors.red);
  }

  // Test 3: Check Android project structure
  log('\n3️⃣ Verifying Android Project Structure...', colors.bold);
  try {
    if (fs.existsSync('android/app/build.gradle') &&
        fs.existsSync('android/capacitor.settings.gradle')) {
      results.androidConfig = true;
      log(`✅ Android project structure valid`, colors.green);

      // Check Android version compatibility
      const buildGradle = fs.readFileSync('android/app/build.gradle', 'utf8');
      if (buildGradle.includes('minSdkVersion 24') && buildGradle.includes('targetSdkVersion 35')) {
        log(`✅ Android SDK versions compatible (min: 24, target: 35)`, colors.green);
      }
    } else {
      log(`❌ Android project structure incomplete`, colors.red);
    }
  } catch (error) {
    log(`❌ Could not verify Android project: ${error.message}`, colors.red);
  }

  // Test 4: Responsive design tests
  if (results.server) {
    log('\n4️⃣ Testing Responsive Design...', colors.bold);
    results.responsive = runTest('npx playwright test tests/e2e/mobile-responsive.spec.ts', 'Responsive Design Tests').success;
  } else {
    log('\n4️⃣ Skipping responsive tests (server not running)', colors.yellow);
  }

  // Test 5: Touch interactions tests
  if (results.server) {
    log('\n5️⃣ Testing Touch Interactions...', colors.bold);
    results.touch = runTest('npx playwright test tests/e2e/touch-interactions.spec.ts', 'Touch Interaction Tests').success;
  } else {
    log('\n5️⃣ Skipping touch tests (server not running)', colors.yellow);
  }

  // Test 6: Mobile Playwright tests
  if (results.server) {
    log('\n6️⃣ Running Mobile Playwright Tests...', colors.bold);
    results.playwrightMobile = runTest('npx playwright test tests/e2e/comprehensive-crud.spec.ts --project="Mobile Chrome"', 'Mobile Chrome E2E Tests').success;
  } else {
    log('\n6️⃣ Skipping mobile Playwright tests (server not running)', colors.yellow);
  }

  // Test 7: Check mobile-specific features
  log('\n7️⃣ Verifying Mobile-Specific Features...', colors.bold);
  try {
    // Check for mobile viewport configurations in Playwright
    const playwrightConfig = fs.readFileSync('playwright.config.ts', 'utf8');
    if (playwrightConfig.includes('Mobile Chrome') &&
        playwrightConfig.includes('Mobile Safari') &&
        playwrightConfig.includes('Pixel 5')) {
      log(`✅ Mobile viewport configurations found`, colors.green);
    } else {
      log(`❌ Mobile viewport configurations missing`, colors.red);
    }

    // Check for mobile CSS optimizations
    const tailwindConfig = fs.readFileSync('tailwind.config.js', 'utf8');
    if (tailwindConfig.includes('mobile') || tailwindConfig.includes('sm:')) {
      log(`✅ Mobile CSS optimizations detected`, colors.green);
    } else {
      log(`⚠️  Mobile CSS optimizations may be limited`, colors.yellow);
    }
  } catch (error) {
    log(`❌ Could not verify mobile features: ${error.message}`, colors.red);
  }

  // Summary
  log('\n' + '='.repeat(70), colors.blue);
  log('📊 ANDROID MOBILE TEST RESULTS', colors.bold + colors.blue);
  log('='.repeat(70), colors.blue);

  const summary = [];
  Object.entries(results).forEach(([testType, passed]) => {
    const status = passed ? colors.green + 'PASS' : colors.red + 'FAIL';
    const icon = passed ? '✅' : '❌';
    const result = `${icon} ${testType.toUpperCase()}: ${status}`;
    log(result, passed ? colors.green : colors.red);
    summary.push(result);
  });

  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;

  if (passedCount === totalCount) {
    log(`\n🎉 ALL MOBILE TESTS PASSED! (${passedCount}/${totalCount})`, colors.green + colors.bold);
    log('\n📱 Application is ready for Android deployment!', colors.green + colors.bold);
  } else {
    log(`\n⚠️  SOME MOBILE TESTS FAILED (${passedCount}/${totalCount} passed)`, colors.yellow + colors.bold);
    log('\n🔧 Check the detailed output above for mobile compatibility issues.', colors.yellow);
  }

  // Save mobile test results
  const mobileTestResults = {
    timestamp: new Date().toISOString(),
    platform: 'Android Mobile',
    server: 'http://localhost:3000',
    results,
    summary,
    passedCount,
    totalCount,
    serverStatus: results.server,
    androidConfig: {
      appId: 'com.cubstechnical.employee',
      minSdk: 24,
      targetSdk: 35,
      versionCode: 3,
      versionName: '1.4.0'
    }
  };

  fs.writeFileSync('mobile-test-results.json', JSON.stringify(mobileTestResults, null, 2));
  log(`\n💾 Mobile test results saved to mobile-test-results.json`, colors.blue);

  // Android-specific recommendations
  log('\n📱 Android-Specific Recommendations:', colors.yellow);
  if (results.capacitor) {
    log('   ✅ Capacitor configuration is properly set up', colors.green);
    log('   ✅ Ready for Android app generation: npx cap build android', colors.green);
  } else {
    log('   ❌ Fix Capacitor configuration before Android build', colors.red);
  }

  if (results.androidConfig) {
    log('   ✅ Android project structure is complete', colors.green);
    log('   ✅ SDK versions are compatible (Android 7.0+ support)', colors.green);
  } else {
    log('   ❌ Android project setup may be incomplete', colors.red);
  }

  if (results.responsive) {
    log('   ✅ Responsive design working correctly', colors.green);
    log('   ✅ Mobile layouts adapt properly', colors.green);
  } else {
    log('   ❌ Responsive design needs improvement', colors.red);
  }

  if (results.touch) {
    log('   ✅ Touch interactions working smoothly', colors.green);
    log('   ✅ Mobile gestures supported', colors.green);
  } else {
    log('   ❌ Touch interactions need optimization', colors.red);
  }

  return passedCount === totalCount;
}

// Main execution
async function main() {
  try {
    log('\n🔍 Starting comprehensive Android mobile testing...\n');
    const success = await testMobileApp();

    if (success) {
      log('\n📱 ANDROID APP READY FOR DEPLOYMENT!', colors.green + colors.bold);
      process.exit(0);
    } else {
      log('\n⚠️  MOBILE ISSUES FOUND - Review before Android deployment', colors.yellow + colors.bold);
      process.exit(1);
    }
  } catch (error) {
    log(`\n💥 Unexpected error: ${error.message}`, colors.red + colors.bold);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testMobileApp };
