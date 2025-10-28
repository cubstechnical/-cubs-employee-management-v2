#!/usr/bin/env node

/**
 * Test Runner Script for CUBS Employee Management
 * Runs all tests and shows comprehensive results
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 CUBS Employee Management - Comprehensive Test Runner\n');

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
      timeout: 300000 // 5 minute timeout
    });

    if (output.includes('PASS') || output.includes('✓') || output.includes('All tests passed')) {
      log(`✅ ${description} completed successfully!`, colors.green);
      return { success: true, output };
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

async function runAllTests() {
  const results = {
    basic: false,
    unit: false,
    integration: false,
    e2e: false,
    coverage: false,
  };

  log('=' .repeat(60), colors.blue);
  log('🧪 STARTING COMPREHENSIVE TEST SUITE', colors.bold + colors.blue);
  log('='.repeat(60), colors.blue);

  // Test 1: Basic Jest functionality
  log('\n1️⃣ Testing Basic Jest Setup...', colors.bold);
  results.basic = runTest('npx jest tests/unit/basic.test.ts', 'Basic Jest Test').success;

  // Test 2: Unit Tests
  log('\n2️⃣ Running Unit Tests...', colors.bold);
  results.unit = runTest('npx jest tests/unit/ --verbose --coverage', 'Unit Tests with Coverage').success;

  // Test 3: Integration Tests
  log('\n3️⃣ Running Integration Tests...', colors.bold);
  results.integration = runTest('npx jest tests/integration/ --verbose', 'Integration Tests').success;

  // Test 4: E2E Tests
  log('\n4️⃣ Running End-to-End Tests...', colors.bold);
  results.e2e = runTest('npx playwright test --timeout=60000', 'E2E Tests').success;

  // Test 5: Coverage Report
  log('\n5️⃣ Generating Coverage Report...', colors.bold);
  results.coverage = runTest('npx jest tests/unit/ tests/integration/ --coverage', 'Coverage Report').success;

  // Summary
  log('\n' + '='.repeat(60), colors.blue);
  log('📊 TEST RESULTS SUMMARY', colors.bold + colors.blue);
  log('='.repeat(60), colors.blue);

  const summary = [];
  Object.entries(results).forEach(([testType, passed]) => {
    const status = passed ? colors.green + 'PASS' : colors.red + 'FAIL';
    const icon = passed ? '✅' : '❌';
    const result = `${icon} ${testType.toUpperCase()}: ${status}`;
    log(result, passed ? colors.green : colors.red);
    summary.push(result);
  });

  const allPassed = Object.values(results).every(Boolean);

  if (allPassed) {
    log('\n🎉 ALL TESTS PASSED! The application is ready for deployment.', colors.green + colors.bold);

    // Show coverage summary if available
    try {
      if (fs.existsSync('coverage/coverage-summary.json')) {
        const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
        log('\n📈 Coverage Summary:', colors.blue);
        log(`   Statements: ${coverage.total.statements.pct}%`, colors.blue);
        log(`   Branches: ${coverage.total.branches.pct}%`, colors.blue);
        log(`   Functions: ${coverage.total.functions.pct}%`, colors.blue);
        log(`   Lines: ${coverage.total.lines.pct}%`, colors.blue);
      }
    } catch (error) {
      log('\n📈 Coverage report generated successfully!', colors.green);
    }

    log('\n📋 Next Steps:', colors.yellow);
    log('   1. Review test results in detail', colors.yellow);
    log('   2. Check coverage reports in coverage/lcov-report/', colors.yellow);
    log('   3. Review E2E test reports in playwright-report/', colors.yellow);
    log('   4. Deploy to production with confidence!', colors.yellow);

  } else {
    log('\n⚠️  SOME TESTS FAILED. Please review the issues before deployment.', colors.yellow + colors.bold);
    log('\n🔧 Troubleshooting:', colors.yellow);
    log('   1. Check detailed error messages above', colors.yellow);
    log('   2. Review test configuration in jest.config.js', colors.yellow);
    log('   3. Verify all dependencies are installed', colors.yellow);
    log('   4. Check if development server is running for E2E tests', colors.yellow);
  }

  // Save test results
  const testResults = {
    timestamp: new Date().toISOString(),
    results,
    summary,
    allPassed
  };

  fs.writeFileSync('test-results.json', JSON.stringify(testResults, null, 2));
  log(`\n💾 Test results saved to test-results.json`, colors.blue);

  return allPassed;
}

// Main execution
async function main() {
  try {
    const success = await runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    log(`\n💥 Unexpected error: ${error.message}`, colors.red + colors.bold);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runAllTests };
