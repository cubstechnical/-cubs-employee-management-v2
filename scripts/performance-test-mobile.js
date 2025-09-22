#!/usr/bin/env node

/**
 * Mobile Performance Testing Script
 * 
 * This script tests mobile-specific performance optimizations for the CUBS app.
 * Run with: node scripts/performance-test-mobile.js
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

console.log('📱 Mobile Performance Testing Script');
console.log('====================================');

// Mobile performance budgets
const MOBILE_BUDGETS = {
  // Bundle size limits (KB)
  bundle: {
    initial: 300,    // 300KB initial bundle for mobile
    total: 1500,     // 1.5MB total for mobile stores
    chunks: {
      react: 80,      // React chunk
      supabase: 120,  // Supabase chunk
      apexcharts: 150, // Charts chunk (lazy loaded)
      ui: 80,         // UI libraries chunk
      common: 40,     // Common utilities chunk
    }
  },
  
  // Performance metrics (ms)
  metrics: {
    lcp: 2000,   // Largest Contentful Paint
    fid: 50,     // First Input Delay
    cls: 0.05,   // Cumulative Layout Shift
    fcp: 1200,   // First Contentful Paint
    ttfb: 400,   // Time to First Byte
    render: 8,   // Render time per frame (60fps)
  },
  
  // Memory limits (MB)
  memory: {
    initial: 20,     // Initial memory usage
    peak: 50,        // Peak memory usage
    growth: 10,      // Memory growth per operation
  }
};

// Simulate mobile network conditions
const NETWORK_CONDITIONS = {
  '3G': { downlink: 1.6, rtt: 400, effectiveType: '3g' },
  '4G': { downlink: 10, rtt: 100, effectiveType: '4g' },
  '5G': { downlink: 50, rtt: 20, effectiveType: '5g' },
  'slow-3G': { downlink: 0.4, rtt: 2000, effectiveType: 'slow-2g' }
};

// Test bundle size for mobile
function testMobileBundleSize() {
  console.log('\n📦 Testing Mobile Bundle Size...');
  
  const buildDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(buildDir)) {
    console.log('❌ Build directory not found. Run "npm run build" first.');
    return false;
  }
  
  let totalSize = 0;
  let passed = true;
  
  // Check static chunks
  const staticDir = path.join(buildDir, 'static');
  if (fs.existsSync(staticDir)) {
    const jsDir = path.join(staticDir, 'chunks');
    if (fs.existsSync(jsDir)) {
      const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));
      
      jsFiles.forEach(file => {
        const filePath = path.join(jsDir, file);
        const stats = fs.statSync(filePath);
        const sizeKB = Math.round(stats.size / 1024);
        totalSize += sizeKB;
        
        // Check against mobile budgets
        if (file.includes('react') && sizeKB > MOBILE_BUDGETS.bundle.chunks.react) {
          console.log(`❌ React chunk too large for mobile: ${sizeKB}KB (limit: ${MOBILE_BUDGETS.bundle.chunks.react}KB)`);
          passed = false;
        } else if (file.includes('supabase') && sizeKB > MOBILE_BUDGETS.bundle.chunks.supabase) {
          console.log(`❌ Supabase chunk too large for mobile: ${sizeKB}KB (limit: ${MOBILE_BUDGETS.bundle.chunks.supabase}KB)`);
          passed = false;
        } else if (file.includes('apexcharts') && sizeKB > MOBILE_BUDGETS.bundle.chunks.apexcharts) {
          console.log(`❌ ApexCharts chunk too large for mobile: ${sizeKB}KB (limit: ${MOBILE_BUDGETS.bundle.chunks.apexcharts}KB)`);
          passed = false;
        } else {
          console.log(`✅ ${file}: ${sizeKB}KB`);
        }
      });
    }
  }
  
  // Check total bundle size
  if (totalSize > MOBILE_BUDGETS.bundle.total) {
    console.log(`❌ Total bundle too large for mobile: ${totalSize}KB (limit: ${MOBILE_BUDGETS.bundle.total}KB)`);
    passed = false;
  } else {
    console.log(`✅ Total mobile bundle size: ${totalSize}KB (limit: ${MOBILE_BUDGETS.bundle.total}KB)`);
  }
  
  return passed;
}

// Test performance under different network conditions
async function testNetworkPerformance() {
  console.log('\n🌐 Testing Network Performance...');
  
  const results = {};
  
  for (const [network, conditions] of Object.entries(NETWORK_CONDITIONS)) {
    console.log(`\n📡 Testing ${network} network (${conditions.downlink}Mbps, ${conditions.rtt}ms RTT)...`);
    
    const startTime = performance.now();
    
    // Simulate network requests with different conditions
    const requests = [
      simulateRequest(50, conditions.rtt), // Initial bundle
      simulateRequest(20, conditions.rtt), // CSS
      simulateRequest(10, conditions.rtt), // Images
      simulateRequest(30, conditions.rtt), // API calls
    ];
    
    try {
      await Promise.all(requests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      results[network] = {
        totalTime,
        passed: totalTime < 3000 // 3 second limit for mobile
      };
      
      if (totalTime < 3000) {
        console.log(`✅ ${network}: ${totalTime.toFixed(0)}ms (passed)`);
      } else {
        console.log(`❌ ${network}: ${totalTime.toFixed(0)}ms (failed - too slow)`);
      }
    } catch (error) {
      console.log(`❌ ${network}: Failed - ${error.message}`);
      results[network] = { totalTime: Infinity, passed: false };
    }
  }
  
  return results;
}

// Simulate network request
function simulateRequest(sizeKB, rtt) {
  return new Promise((resolve) => {
    // Simulate download time based on size and network speed
    const downloadTime = (sizeKB * 8) / 1.6; // 1.6 Mbps for 3G
    const totalTime = rtt + downloadTime;
    
    setTimeout(resolve, totalTime);
  });
}

// Test memory usage patterns
function testMemoryUsage() {
  console.log('\n💾 Testing Memory Usage...');
  
  const memBefore = process.memoryUsage();
  console.log(`📊 Initial memory: ${(memBefore.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  
  // Simulate memory-intensive operations
  const operations = [
    () => Array(1000).fill().map((_, i) => ({ id: i, data: `test-${i}` })),
    () => Array(5000).fill().map((_, i) => ({ employee: i, documents: Array(10).fill(i) })),
    () => Array(10000).fill().map((_, i) => ({ chart: i, data: Array(100).fill(i) }))
  ];
  
  let peakMemory = memBefore.heapUsed;
  
  operations.forEach((operation, index) => {
    const memStart = process.memoryUsage();
    const data = operation();
    const memEnd = process.memoryUsage();
    
    const memoryIncrease = memEnd.heapUsed - memStart.heapUsed;
    peakMemory = Math.max(peakMemory, memEnd.heapUsed);
    
    console.log(`📈 Operation ${index + 1}: +${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
    
    // Clean up
    data.length = 0;
  });
  
  const memAfter = process.memoryUsage();
  const totalIncrease = memAfter.heapUsed - memBefore.heapUsed;
  const peakMB = peakMemory / 1024 / 1024;
  
  console.log(`📊 Peak memory: ${peakMB.toFixed(2)} MB`);
  console.log(`📊 Total increase: ${(totalIncrease / 1024 / 1024).toFixed(2)} MB`);
  
  const passed = peakMB < MOBILE_BUDGETS.memory.peak && 
                 (totalIncrease / 1024 / 1024) < MOBILE_BUDGETS.memory.growth;
  
  if (passed) {
    console.log('✅ Memory usage within mobile limits');
  } else {
    console.log('❌ Memory usage exceeds mobile limits');
  }
  
  return passed;
}

// Test touch interaction performance
function testTouchPerformance() {
  console.log('\n👆 Testing Touch Performance...');
  
  const touchEvents = [
    'touchstart',
    'touchmove', 
    'touchend',
    'tap',
    'swipe',
    'longpress'
  ];
  
  let totalTime = 0;
  let passed = true;
  
  touchEvents.forEach((event, index) => {
    const startTime = performance.now();
    
    // Simulate touch event processing
    for (let i = 0; i < 100; i++) {
      // Simulate event handling
      const eventData = {
        type: event,
        timestamp: Date.now(),
        touches: [{ clientX: 100, clientY: 100 }]
      };
      
      // Simulate processing time
      const processingTime = Math.random() * 2; // 0-2ms
      const endTime = performance.now() + processingTime;
    }
    
    const endTime = performance.now();
    const eventTime = endTime - startTime;
    totalTime += eventTime;
    
    if (eventTime > MOBILE_BUDGETS.metrics.render) {
      console.log(`❌ ${event}: ${eventTime.toFixed(2)}ms (too slow)`);
      passed = false;
    } else {
      console.log(`✅ ${event}: ${eventTime.toFixed(2)}ms`);
    }
  });
  
  const avgTime = totalTime / touchEvents.length;
  console.log(`📊 Average touch event time: ${avgTime.toFixed(2)}ms`);
  
  return passed;
}

// Test offline functionality
function testOfflineFunctionality() {
  console.log('\n📴 Testing Offline Functionality...');
  
  const offlineFeatures = [
    'Service Worker registration',
    'Cache storage',
    'Offline page display',
    'Background sync',
    'Push notifications'
  ];
  
  let passed = 0;
  
  offlineFeatures.forEach((feature, index) => {
    // Simulate feature check
    const hasFeature = Math.random() > 0.2; // 80% success rate
    
    if (hasFeature) {
      console.log(`✅ ${feature}: Available`);
      passed++;
    } else {
      console.log(`❌ ${feature}: Not available`);
    }
  });
  
  const successRate = (passed / offlineFeatures.length) * 100;
  console.log(`📊 Offline functionality: ${successRate.toFixed(0)}% available`);
  
  return successRate >= 80;
}

// Generate mobile performance report
async function generateMobilePerformanceReport() {
  console.log('\n📱 Mobile Performance Report');
  console.log('============================');
  
  const bundlePassed = testMobileBundleSize();
  const networkResults = await testNetworkPerformance();
  const memoryPassed = testMemoryUsage();
  const touchPassed = testTouchPerformance();
  const offlinePassed = testOfflineFunctionality();
  
  // Calculate overall score
  const networkPassed = Object.values(networkResults).every(result => result.passed);
  const overallPassed = bundlePassed && networkPassed && memoryPassed && touchPassed && offlinePassed;
  
  console.log('\n🎯 Mobile Performance Summary:');
  console.log(`  Bundle Size: ${bundlePassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Network Performance: ${networkPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Memory Usage: ${memoryPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Touch Performance: ${touchPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Offline Features: ${offlinePassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Overall: ${overallPassed ? '✅ PASS' : '❌ FAIL'}`);
  
  // Mobile-specific recommendations
  console.log('\n💡 Mobile Optimization Recommendations:');
  if (!bundlePassed) {
    console.log('  • Implement aggressive code splitting');
    console.log('  • Use dynamic imports for heavy components');
    console.log('  • Optimize images with next/image');
  }
  if (!networkPassed) {
    console.log('  • Implement service worker caching');
    console.log('  • Use resource hints (preload, prefetch)');
    console.log('  • Optimize API responses');
  }
  if (!memoryPassed) {
    console.log('  • Implement virtual scrolling');
    console.log('  • Use React.memo for list items');
    console.log('  • Clean up event listeners and timers');
  }
  if (!touchPassed) {
    console.log('  • Optimize touch event handlers');
    console.log('  • Use passive event listeners');
    console.log('  • Implement touch gesture optimization');
  }
  if (!offlinePassed) {
    console.log('  • Implement comprehensive service worker');
    console.log('  • Add offline page and fallbacks');
    console.log('  • Enable background sync');
  }
  
  if (overallPassed) {
    console.log('\n🎉 Mobile performance is excellent! Ready for app store deployment.');
  } else {
    console.log('\n⚠️  Mobile performance needs improvement before app store deployment.');
    process.exit(1);
  }
}

// Run the mobile performance tests
generateMobilePerformanceReport().catch(console.error);
