#!/usr/bin/env node

/**
 * Performance Budget Checker
 * Validates that the application meets performance requirements
 */

const fs = require('fs');
const path = require('path');

// Performance budget thresholds
const PERFORMANCE_BUDGET = {
  // Bundle size limits (in KB)
  bundle: {
    firstLoad: 300, // 300KB first load JS
    total: 1000,    // 1MB total bundle size
    chunks: {
      main: 150,    // 150KB main bundle
      vendor: 100,  // 100KB vendor bundle
      common: 50    // 50KB common bundle
    }
  },
  
  // Performance metrics
  metrics: {
    lcp: 2500,      // 2.5s Largest Contentful Paint
    fid: 100,       // 100ms First Input Delay
    cls: 0.1,       // 0.1 Cumulative Layout Shift
    fcp: 1800,      // 1.8s First Contentful Paint
    ttfb: 600       // 600ms Time to First Byte
  },
  
  // Resource limits
  resources: {
    images: 500,    // 500KB total images
    fonts: 100,     // 100KB total fonts
    css: 50         // 50KB total CSS
  }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkBundleSize() {
  log('\n📦 Checking Bundle Size...', 'blue');
  
  const buildDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(buildDir)) {
    log('❌ Build directory not found. Run "npm run build" first.', 'red');
    return false;
  }

  const staticDir = path.join(buildDir, 'static');
  if (!fs.existsSync(staticDir)) {
    log('❌ Static directory not found.', 'red');
    return false;
  }

  let totalSize = 0;
  let chunkSizes = {};
  let passed = true;

  // Check JavaScript chunks
  const jsDir = path.join(staticDir, 'chunks');
  if (fs.existsSync(jsDir)) {
    const files = fs.readdirSync(jsDir);
    
    files.forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join(jsDir, file);
        const stats = fs.statSync(filePath);
        const sizeKB = Math.round(stats.size / 1024);
        totalSize += sizeKB;
        
        // Categorize chunks
        if (file.includes('main')) {
          chunkSizes.main = (chunkSizes.main || 0) + sizeKB;
        } else if (file.includes('framework') || file.includes('webpack')) {
          chunkSizes.vendor = (chunkSizes.vendor || 0) + sizeKB;
        } else {
          chunkSizes.common = (chunkSizes.common || 0) + sizeKB;
        }
        
        // Check individual chunk limits
        if (file.includes('main') && sizeKB > PERFORMANCE_BUDGET.bundle.chunks.main) {
          log(`❌ Main chunk too large: ${sizeKB}KB (limit: ${PERFORMANCE_BUDGET.bundle.chunks.main}KB)`, 'red');
          passed = false;
        }
      }
    });
  }

  // Check CSS files
  const cssDir = path.join(staticDir, 'css');
  if (fs.existsSync(cssDir)) {
    const files = fs.readdirSync(cssDir);
    let cssSize = 0;
    
    files.forEach(file => {
      if (file.endsWith('.css')) {
        const filePath = path.join(cssDir, file);
        const stats = fs.statSync(filePath);
        cssSize += Math.round(stats.size / 1024);
      }
    });
    
    if (cssSize > PERFORMANCE_BUDGET.resources.css) {
      log(`❌ CSS too large: ${cssSize}KB (limit: ${PERFORMANCE_BUDGET.resources.css}KB)`, 'red');
      passed = false;
    } else {
      log(`✅ CSS size: ${cssSize}KB`, 'green');
    }
  }

  // Check total bundle size
  if (totalSize > PERFORMANCE_BUDGET.bundle.total) {
    log(`❌ Total bundle too large: ${totalSize}KB (limit: ${PERFORMANCE_BUDGET.bundle.total}KB)`, 'red');
    passed = false;
  } else {
    log(`✅ Total bundle size: ${totalSize}KB`, 'green');
  }

  // Log chunk breakdown
  log('\n📊 Chunk Breakdown:', 'blue');
  Object.entries(chunkSizes).forEach(([chunk, size]) => {
    const status = size <= PERFORMANCE_BUDGET.bundle.chunks[chunk] ? '✅' : '❌';
    const color = size <= PERFORMANCE_BUDGET.bundle.chunks[chunk] ? 'green' : 'red';
    log(`${status} ${chunk}: ${size}KB`, color);
  });

  return passed;
}

function checkDependencies() {
  log('\n📚 Checking Dependencies...', 'blue');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ package.json not found.', 'red');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // Check for heavy dependencies
  const heavyDeps = [
    'apexcharts',
    'react-apexcharts',
    '@supabase/supabase-js',
    'framer-motion',
    'react-window'
  ];

  let foundHeavy = false;
  heavyDeps.forEach(dep => {
    if (dependencies[dep]) {
      log(`⚠️  Heavy dependency found: ${dep}`, 'yellow');
      foundHeavy = true;
    }
  });

  if (!foundHeavy) {
    log('✅ No unexpectedly heavy dependencies found.', 'green');
  }

  return true;
}

function checkCodeSplitting() {
  log('\n🔀 Checking Code Splitting...', 'blue');
  
  const dynamicImportsPath = path.join(process.cwd(), 'components', 'dynamic', 'DynamicImports.tsx');
  if (!fs.existsSync(dynamicImportsPath)) {
    log('❌ DynamicImports.tsx not found.', 'red');
    return false;
  }

  const content = fs.readFileSync(dynamicImportsPath, 'utf8');
  
  // Check for dynamic imports
  const dynamicImportCount = (content.match(/dynamic\(/g) || []).length;
  const lazyImportCount = (content.match(/React\.lazy\(/g) || []).length;
  
  if (dynamicImportCount > 0 || lazyImportCount > 0) {
    log(`✅ Code splitting implemented: ${dynamicImportCount} dynamic imports, ${lazyImportCount} lazy imports`, 'green');
  } else {
    log('⚠️  No code splitting found. Consider implementing dynamic imports.', 'yellow');
  }

  return true;
}

function checkPerformanceOptimizations() {
  log('\n⚡ Checking Performance Optimizations...', 'blue');
  
  const optimizations = [
    { file: 'components/performance/PerformanceMonitor.tsx', check: 'React.memo' },
    { file: 'components/employees/VirtualizedEmployeeList.tsx', check: 'useMemo' },
    { file: 'lib/services/dashboard.ts', check: 'cache' },
    { file: 'components/ui/DashboardErrorBoundary.tsx', check: 'ErrorBoundary' }
  ];

  let passed = 0;
  optimizations.forEach(({ file, check }) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(check)) {
        log(`✅ ${file}: ${check} implemented`, 'green');
        passed++;
      } else {
        log(`❌ ${file}: ${check} not found`, 'red');
      }
    } else {
      log(`❌ ${file}: File not found`, 'red');
    }
  });

  const successRate = (passed / optimizations.length) * 100;
  if (successRate >= 75) {
    log(`✅ Performance optimizations: ${passed}/${optimizations.length} (${successRate.toFixed(0)}%)`, 'green');
  } else {
    log(`❌ Performance optimizations: ${passed}/${optimizations.length} (${successRate.toFixed(0)}%)`, 'red');
  }

  return successRate >= 75;
}

function generateReport() {
  log('\n📋 Performance Budget Report', 'bold');
  log('=' .repeat(50), 'blue');
  
  const results = {
    bundle: checkBundleSize(),
    dependencies: checkDependencies(),
    codeSplitting: checkCodeSplitting(),
    optimizations: checkPerformanceOptimizations()
  };

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  const successRate = (passed / total) * 100;

  log('\n📊 Summary:', 'bold');
  log(`Overall Score: ${passed}/${total} (${successRate.toFixed(0)}%)`, 
      successRate >= 75 ? 'green' : successRate >= 50 ? 'yellow' : 'red');

  if (successRate >= 75) {
    log('\n🎉 Performance budget passed! Your app is optimized for production.', 'green');
  } else if (successRate >= 50) {
    log('\n⚠️  Performance budget needs improvement. Consider optimizing heavy components.', 'yellow');
  } else {
    log('\n❌ Performance budget failed. Significant optimizations needed.', 'red');
  }

  // Recommendations
  log('\n💡 Recommendations:', 'blue');
  if (!results.bundle) {
    log('• Implement code splitting for heavy components');
    log('• Use dynamic imports for charts and admin panels');
    log('• Optimize images and assets');
  }
  if (!results.optimizations) {
    log('• Add React.memo to prevent unnecessary re-renders');
    log('• Implement proper caching strategies');
    log('• Add error boundaries for better error handling');
  }

  return successRate >= 75;
}

// Run the performance budget check
if (require.main === module) {
  const passed = generateReport();
  process.exit(passed ? 0 : 1);
}

module.exports = {
  checkBundleSize,
  checkDependencies,
  checkCodeSplitting,
  checkPerformanceOptimizations,
  generateReport,
  PERFORMANCE_BUDGET
};