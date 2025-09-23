#!/usr/bin/env node

/**
 * CUBS Employee Management System - Production Readiness Test Suite
 * 
 * This script runs the complete test suite and generates a comprehensive
 * report for production deployment readiness.
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 CUBS Employee Management System - Production Readiness Test Suite\n')

const testResults = {
  unit: { passed: 0, failed: 0, total: 0, errors: [] },
  integration: { passed: 0, failed: 0, total: 0, errors: [] },
  e2e: { passed: 0, failed: 0, total: 0, errors: [] },
  coverage: { percentage: 0, details: {} },
  security: { issues: [], passed: true },
  performance: { passed: true, metrics: {} },
  accessibility: { passed: true, issues: [] },
}

function runCommand(command, description) {
  console.log(`\n🔍 ${description}...`)
  console.log('='.repeat(60))
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 300000 // 5 minutes timeout
    })
    console.log('✅ Success')
    return { success: true, output }
  } catch (error) {
    console.log('❌ Failed')
    console.log(error.message)
    return { success: false, error: error.message }
  }
}

function parseJestOutput(output) {
  const lines = output.split('\n')
  let passed = 0, failed = 0, total = 0
  
  for (const line of lines) {
    if (line.includes('Tests:')) {
      const match = line.match(/(\d+) passed|(\d+) failed|(\d+) total/)
      if (match) {
        if (match[1]) passed = parseInt(match[1])
        if (match[2]) failed = parseInt(match[2])
        if (match[3]) total = parseInt(match[3])
      }
    }
  }
  
  return { passed, failed, total }
}

function parseCoverageOutput(output) {
  const lines = output.split('\n')
  let percentage = 0
  
  for (const line of lines) {
    if (line.includes('All files')) {
      const match = line.match(/(\d+(?:\.\d+)?)%/)
      if (match) {
        percentage = parseFloat(match[1])
      }
    }
  }
  
  return percentage
}

async function runUnitTests() {
  const result = runCommand('npm run test:unit', 'Running Unit Tests')
  
  if (result.success) {
    const stats = parseJestOutput(result.output)
    testResults.unit = { ...stats, errors: [] }
    console.log(`   📊 ${stats.passed} passed, ${stats.failed} failed, ${stats.total} total`)
  } else {
    testResults.unit.errors.push(result.error)
    testResults.unit.failed = 1
  }
}

async function runIntegrationTests() {
  const result = runCommand('npm run test:integration', 'Running Integration Tests')
  
  if (result.success) {
    const stats = parseJestOutput(result.output)
    testResults.integration = { ...stats, errors: [] }
    console.log(`   📊 ${stats.passed} passed, ${stats.failed} failed, ${stats.total} total`)
  } else {
    testResults.integration.errors.push(result.error)
    testResults.integration.failed = 1
  }
}

async function runE2ETests() {
  const result = runCommand('npm run test:e2e', 'Running End-to-End Tests')
  
  if (result.success) {
    const stats = parseJestOutput(result.output)
    testResults.e2e = { ...stats, errors: [] }
    console.log(`   📊 ${stats.passed} passed, ${stats.failed} failed, ${stats.total} total`)
  } else {
    testResults.e2e.errors.push(result.error)
    testResults.e2e.failed = 1
  }
}

async function runCoverageTests() {
  const result = runCommand('npm run test:coverage', 'Running Coverage Analysis')
  
  if (result.success) {
    const percentage = parseCoverageOutput(result.output)
    testResults.coverage.percentage = percentage
    console.log(`   📊 Coverage: ${percentage}%`)
  } else {
    testResults.coverage.percentage = 0
    testResults.coverage.errors = [result.error]
  }
}

async function runSecurityChecks() {
  console.log('\n🔒 Running Security Checks...')
  console.log('='.repeat(60))
  
  // Check for common security issues
  const securityIssues = []
  
  // Check for hardcoded secrets
  const filesToCheck = [
    'app/**/*.tsx',
    'app/**/*.ts',
    'lib/**/*.ts',
    'components/**/*.tsx',
  ]
  
  for (const pattern of filesToCheck) {
    try {
      const result = execSync(`grep -r "password\\|secret\\|key" ${pattern} || true`, { encoding: 'utf8' })
      if (result.trim()) {
        securityIssues.push('Potential hardcoded secrets found')
      }
    } catch (error) {
      // Ignore grep errors
    }
  }
  
  // Check for SQL injection patterns
  try {
    const result = execSync(`grep -r "\\$\\{.*\\}" app/ lib/ || true`, { encoding: 'utf8' })
    if (result.trim()) {
      securityIssues.push('Potential SQL injection patterns found')
    }
  } catch (error) {
    // Ignore grep errors
  }
  
  testResults.security.issues = securityIssues
  testResults.security.passed = securityIssues.length === 0
  
  if (testResults.security.passed) {
    console.log('✅ No security issues found')
  } else {
    console.log('❌ Security issues found:')
    securityIssues.forEach(issue => console.log(`   • ${issue}`))
  }
}

async function runPerformanceChecks() {
  console.log('\n⚡ Running Performance Checks...')
  console.log('='.repeat(60))
  
  // Check bundle size
  try {
    const result = runCommand('npm run build', 'Building Application')
    if (result.success) {
      console.log('✅ Build successful')
      testResults.performance.passed = true
    } else {
      console.log('❌ Build failed')
      testResults.performance.passed = false
    }
  } catch (error) {
    console.log('❌ Build failed')
    testResults.performance.passed = false
  }
}

async function runAccessibilityChecks() {
  console.log('\n♿ Running Accessibility Checks...')
  console.log('='.repeat(60))
  
  // Basic accessibility checks
  const accessibilityIssues = []
  
  // Check for alt attributes on images
  try {
    const result = execSync(`grep -r "<img" app/ components/ | grep -v "alt=" || true`, { encoding: 'utf8' })
    if (result.trim()) {
      accessibilityIssues.push('Images missing alt attributes')
    }
  } catch (error) {
    // Ignore grep errors
  }
  
  // Check for proper heading structure
  try {
    const result = execSync(`grep -r "<h[1-6]" app/ components/ || true`, { encoding: 'utf8' })
    if (!result.trim()) {
      accessibilityIssues.push('No heading elements found')
    }
  } catch (error) {
    // Ignore grep errors
  }
  
  testResults.accessibility.issues = accessibilityIssues
  testResults.accessibility.passed = accessibilityIssues.length === 0
  
  if (testResults.accessibility.passed) {
    console.log('✅ No accessibility issues found')
  } else {
    console.log('❌ Accessibility issues found:')
    accessibilityIssues.forEach(issue => console.log(`   • ${issue}`))
  }
}

function generateReport() {
  console.log('\n📋 PRODUCTION READINESS REPORT')
  console.log('='.repeat(60))
  
  const totalTests = testResults.unit.total + testResults.integration.total + testResults.e2e.total
  const totalPassed = testResults.unit.passed + testResults.integration.passed + testResults.e2e.passed
  const totalFailed = testResults.unit.failed + testResults.integration.failed + testResults.e2e.failed
  
  console.log(`\n📊 Test Results Summary:`)
  console.log(`   • Total Tests: ${totalTests}`)
  console.log(`   • Passed: ${totalPassed}`)
  console.log(`   • Failed: ${totalFailed}`)
  console.log(`   • Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`)
  
  console.log(`\n📈 Coverage Analysis:`)
  console.log(`   • Code Coverage: ${testResults.coverage.percentage}%`)
  console.log(`   • Target: 80%`)
  console.log(`   • Status: ${testResults.coverage.percentage >= 80 ? '✅ PASSED' : '❌ FAILED'}`)
  
  console.log(`\n🔒 Security Assessment:`)
  console.log(`   • Issues Found: ${testResults.security.issues.length}`)
  console.log(`   • Status: ${testResults.security.passed ? '✅ PASSED' : '❌ FAILED'}`)
  
  console.log(`\n⚡ Performance Assessment:`)
  console.log(`   • Build Status: ${testResults.performance.passed ? '✅ PASSED' : '❌ FAILED'}`)
  
  console.log(`\n♿ Accessibility Assessment:`)
  console.log(`   • Issues Found: ${testResults.accessibility.issues.length}`)
  console.log(`   • Status: ${testResults.accessibility.passed ? '✅ PASSED' : '❌ FAILED'}`)
  
  // Overall assessment
  const isReady = (
    totalFailed === 0 &&
    testResults.coverage.percentage >= 80 &&
    testResults.security.passed &&
    testResults.performance.passed &&
    testResults.accessibility.passed
  )
  
  console.log(`\n🎯 PRODUCTION READINESS: ${isReady ? '✅ READY' : '❌ NOT READY'}`)
  
  if (!isReady) {
    console.log(`\n⚠️  Issues to address before deployment:`)
    if (totalFailed > 0) console.log(`   • Fix ${totalFailed} failing tests`)
    if (testResults.coverage.percentage < 80) console.log(`   • Increase code coverage to 80%+`)
    if (!testResults.security.passed) console.log(`   • Fix security issues`)
    if (!testResults.performance.passed) console.log(`   • Fix performance issues`)
    if (!testResults.accessibility.passed) console.log(`   • Fix accessibility issues`)
  }
  
  // Save report to file
  const reportPath = path.join(__dirname, '..', 'test-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2))
  console.log(`\n📄 Detailed report saved to: ${reportPath}`)
  
  return isReady
}

async function main() {
  try {
    await runUnitTests()
    await runIntegrationTests()
    await runE2ETests()
    await runCoverageTests()
    await runSecurityChecks()
    await runPerformanceChecks()
    await runAccessibilityChecks()
    
    const isReady = generateReport()
    
    if (isReady) {
      console.log('\n🎉 Application is ready for production deployment!')
      process.exit(0)
    } else {
      console.log('\n🚨 Application is not ready for production deployment.')
      process.exit(1)
    }
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message)
    process.exit(1)
  }
}

main()


