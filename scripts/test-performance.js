#!/usr/bin/env node

/**
 * Performance Testing Script for CUBS Dashboard
 * 
 * This script helps validate performance improvements by:
 * 1. Running bundle analysis
 * 2. Measuring build times
 * 3. Checking bundle sizes
 * 4. Providing performance recommendations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 CUBS Dashboard Performance Testing Suite\n');

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

function logSection(title) {
  console.log(`\n${colors.cyan}${colors.bright}${'='.repeat(50)}`);
  console.log(`${title}`);
  console.log(`${'='.repeat(50)}${colors.reset}`);
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

// Check if required tools are installed
function checkDependencies() {
  logSection('Checking Dependencies');
  
  try {
    // Check Node.js version
    const nodeVersion = process.version;
    logInfo(`Node.js version: ${nodeVersion}`);
    
    // Check npm version
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    logInfo(`npm version: ${npmVersion}`);
    
    // Check if bundle analyzer is installed
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (packageJson.devDependencies['@next/bundle-analyzer']) {
      logSuccess('Bundle analyzer is installed');
    } else {
      logWarning('Bundle analyzer not found. Install with: npm install --save-dev @next/bundle-analyzer');
    }
    
    logSuccess('Dependencies check completed');
  } catch (error) {
    logError(`Error checking dependencies: ${error.message}`);
  }
}

// Analyze bundle size
function analyzeBundle() {
  logSection('Bundle Analysis');
  
  try {
    logInfo('Building with bundle analysis...');
    
    // Set environment variable for bundle analysis
    process.env.ANALYZE = 'true';
    
    // Run build with analysis
    const buildOutput = execSync('npm run build:analyze', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    logSuccess('Bundle analysis completed');
    logInfo('Check the generated bundle analysis report');
    
    // Look for bundle analysis files
    const publicDir = path.join(process.cwd(), 'public');
    if (fs.existsSync(publicDir)) {
      const files = fs.readdirSync(publicDir);
      const bundleFiles = files.filter(file => file.includes('bundle'));
      if (bundleFiles.length > 0) {
        logInfo(`Bundle analysis files found: ${bundleFiles.join(', ')}`);
      }
    }
    
  } catch (error) {
    logError(`Bundle analysis failed: ${error.message}`);
    logInfo('Make sure you have run: npm install --save-dev @next/bundle-analyzer');
  }
}

// Check build performance
function checkBuildPerformance() {
  logSection('Build Performance Check');
  
  try {
    logInfo('Running production build...');
    const startTime = Date.now();
    
    const buildOutput = execSync('npm run build', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    const buildTime = Date.now() - startTime;
    const buildTimeSeconds = (buildTime / 1000).toFixed(2);
    
    logSuccess(`Build completed in ${buildTimeSeconds} seconds`);
    
    // Check build output size
    const nextDir = path.join(process.cwd(), '.next');
    if (fs.existsSync(nextDir)) {
      const buildStats = fs.statSync(nextDir);
      const buildSizeMB = (buildStats.size / (1024 * 1024)).toFixed(2);
      logInfo(`Build output size: ${buildSizeMB} MB`);
      
      if (buildSizeMB > 50) {
        logWarning('Build size is large. Consider code splitting and tree shaking.');
      } else {
        logSuccess('Build size is reasonable');
      }
    }
    
  } catch (error) {
    logError(`Build check failed: ${error.message}`);
  }
}

// Performance recommendations
function provideRecommendations() {
  logSection('Performance Recommendations');
  
  const recommendations = [
    {
      category: 'Bundle Optimization',
      items: [
        'Use dynamic imports for route-based code splitting',
        'Implement tree shaking for unused code elimination',
        'Consider using webpack-bundle-analyzer for detailed analysis',
        'Optimize images with Next.js Image component'
      ]
    },
    {
      category: 'Component Optimization',
      items: [
        'Use React.memo for expensive components',
        'Implement useCallback and useMemo hooks',
        'Lazy load below-the-fold components',
        'Optimize re-renders with proper dependency arrays'
      ]
    },
    {
      category: 'Data Fetching',
      items: [
        'Implement progressive loading strategies',
        'Use React Query for efficient data management',
        'Implement proper caching strategies',
        'Consider using SWR for real-time updates'
      ]
    },
    {
      category: 'Monitoring',
      items: [
        'Set up Core Web Vitals monitoring',
        'Implement performance budgets',
        'Use Lighthouse CI for automated testing',
        'Monitor bundle size changes in CI/CD'
      ]
    }
  ];
  
  recommendations.forEach(({ category, items }) => {
    logInfo(`${category}:`, 'blue');
    items.forEach(item => {
      log(`  • ${item}`, 'reset');
    });
    console.log();
  });
}

// Run performance tests
function runPerformanceTests() {
  logSection('Running Performance Tests');
  
  try {
    // Check if the app is running
    logInfo('Checking if the application is running...');
    
    try {
      const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3002', { encoding: 'utf8' });
      if (response.trim() === '200') {
        logSuccess('Application is running on port 3002');
        logInfo('You can now run Lighthouse audit:');
        logInfo('npx lighthouse http://localhost:3002/admin/dashboard --output=html --output-path=./lighthouse-report.html', 'yellow');
      } else {
        logWarning('Application might not be running or accessible');
      }
    } catch (error) {
      logWarning('Could not check application status. Make sure it\'s running on port 3002');
    }
    
  } catch (error) {
    logError(`Performance tests failed: ${error.message}`);
  }
}

// Main execution
async function main() {
  try {
    log(`${colors.magenta}${colors.bright}CUBS Dashboard Performance Testing Suite${colors.reset}\n`);
    
    checkDependencies();
    checkBuildPerformance();
    analyzeBundle();
    runPerformanceTests();
    provideRecommendations();
    
    logSection('Testing Complete');
    logSuccess('Performance testing completed successfully!');
    logInfo('Next steps:');
    logInfo('1. Review bundle analysis report');
    logInfo('2. Run Lighthouse audit on your dashboard');
    logInfo('3. Implement recommended optimizations');
    logInfo('4. Re-run tests to measure improvements');
    
  } catch (error) {
    logError(`Performance testing failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkDependencies,
  analyzeBundle,
  checkBuildPerformance,
  runPerformanceTests,
  provideRecommendations
};
