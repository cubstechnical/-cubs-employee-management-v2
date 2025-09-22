#!/usr/bin/env node

/**
 * Performance Budget Script
 * 
 * This script enforces performance budgets for the CUBS Employee Management System.
 * Run with: node scripts/performance-budget.js
 */

const fs = require('fs');
const path = require('path');

console.log('📊 Performance Budget Checker');
console.log('============================');

// Performance budgets (in KB)
const PERFORMANCE_BUDGETS = {
  // Bundle size limits
  bundle: {
    initial: 500, // 500KB initial bundle
    total: 2000,  // 2MB total bundle
    chunks: {
      react: 100,      // React chunk
      supabase: 150,   // Supabase chunk
      apexcharts: 200, // Charts chunk
      ui: 100,         // UI libraries chunk
      common: 50,      // Common utilities chunk
      vendors: 50,     // Other vendors chunk
    }
  },
  
  // Performance metrics
  metrics: {
    lcp: 2500,  // Largest Contentful Paint (ms)
    fid: 100,   // First Input Delay (ms)
    cls: 0.1,   // Cumulative Layout Shift
    fcp: 1800,  // First Contentful Paint (ms)
    ttfb: 600,  // Time to First Byte (ms)
  },
  
  // Resource limits
  resources: {
    images: 100,    // Max image size (KB)
    fonts: 50,      // Max font size (KB)
    css: 50,        // Max CSS size (KB)
    js: 200,        // Max JS size (KB)
  }
};

// Check bundle sizes
function checkBundleSizes() {
  console.log('\n📦 Checking Bundle Sizes...');
  
  const buildDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(buildDir)) {
    console.log('❌ Build directory not found. Run "npm run build" first.');
    return false;
  }
  
  const staticDir = path.join(buildDir, 'static');
  if (!fs.existsSync(staticDir)) {
    console.log('❌ Static directory not found.');
    return false;
  }
  
  let totalSize = 0;
  let passed = true;
  
  // Check JS chunks
  const jsDir = path.join(staticDir, 'chunks');
  if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));
    
    jsFiles.forEach(file => {
      const filePath = path.join(jsDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      totalSize += sizeKB;
      
      // Check individual chunk budgets
      if (file.includes('react') && sizeKB > PERFORMANCE_BUDGETS.bundle.chunks.react) {
        console.log(`❌ React chunk too large: ${sizeKB}KB (limit: ${PERFORMANCE_BUDGETS.bundle.chunks.react}KB)`);
        passed = false;
      } else if (file.includes('supabase') && sizeKB > PERFORMANCE_BUDGETS.bundle.chunks.supabase) {
        console.log(`❌ Supabase chunk too large: ${sizeKB}KB (limit: ${PERFORMANCE_BUDGETS.bundle.chunks.supabase}KB)`);
        passed = false;
      } else if (file.includes('apexcharts') && sizeKB > PERFORMANCE_BUDGETS.bundle.chunks.apexcharts) {
        console.log(`❌ ApexCharts chunk too large: ${sizeKB}KB (limit: ${PERFORMANCE_BUDGETS.bundle.chunks.apexcharts}KB)`);
        passed = false;
      } else {
        console.log(`✅ ${file}: ${sizeKB}KB`);
      }
    });
  }
  
  // Check total bundle size
  if (totalSize > PERFORMANCE_BUDGETS.bundle.total) {
    console.log(`❌ Total bundle too large: ${totalSize}KB (limit: ${PERFORMANCE_BUDGETS.bundle.total}KB)`);
    passed = false;
  } else {
    console.log(`✅ Total bundle size: ${totalSize}KB (limit: ${PERFORMANCE_BUDGETS.bundle.total}KB)`);
  }
  
  return passed;
}

// Check image sizes
function checkImageSizes() {
  console.log('\n🖼️  Checking Image Sizes...');
  
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    console.log('❌ Public directory not found.');
    return false;
  }
  
  let passed = true;
  
  function checkDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        checkDirectory(filePath);
      } else if (file.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
        const sizeKB = Math.round(stats.size / 1024);
        
        if (sizeKB > PERFORMANCE_BUDGETS.resources.images) {
          console.log(`❌ Image too large: ${file} (${sizeKB}KB, limit: ${PERFORMANCE_BUDGETS.resources.images}KB)`);
          passed = false;
        } else {
          console.log(`✅ ${file}: ${sizeKB}KB`);
        }
      }
    });
  }
  
  checkDirectory(publicDir);
  return passed;
}

// Check CSS sizes
function checkCSSSizes() {
  console.log('\n🎨 Checking CSS Sizes...');
  
  const buildDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(buildDir)) {
    console.log('❌ Build directory not found.');
    return false;
  }
  
  let passed = true;
  let totalCSS = 0;
  
  function checkDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        checkDirectory(filePath);
      } else if (file.endsWith('.css')) {
        const sizeKB = Math.round(stats.size / 1024);
        totalCSS += sizeKB;
        
        if (sizeKB > PERFORMANCE_BUDGETS.resources.css) {
          console.log(`❌ CSS file too large: ${file} (${sizeKB}KB, limit: ${PERFORMANCE_BUDGETS.resources.css}KB)`);
          passed = false;
        } else {
          console.log(`✅ ${file}: ${sizeKB}KB`);
        }
      }
    });
  }
  
  checkDirectory(buildDir);
  console.log(`📊 Total CSS: ${totalCSS}KB`);
  
  return passed;
}

// Generate performance report
function generatePerformanceReport() {
  console.log('\n📋 Performance Budget Report');
  console.log('============================');
  
  const bundlePassed = checkBundleSizes();
  const imagesPassed = checkImageSizes();
  const cssPassed = checkCSSSizes();
  
  const overallPassed = bundlePassed && imagesPassed && cssPassed;
  
  console.log('\n🎯 Performance Budget Summary:');
  console.log(`  Bundle Sizes: ${bundlePassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Image Sizes: ${imagesPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  CSS Sizes: ${cssPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Overall: ${overallPassed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!overallPassed) {
    console.log('\n💡 Optimization Recommendations:');
    console.log('  • Use dynamic imports for heavy components');
    console.log('  • Optimize images with next/image');
    console.log('  • Remove unused CSS and JavaScript');
    console.log('  • Implement code splitting');
    console.log('  • Use tree shaking for unused dependencies');
    process.exit(1);
  } else {
    console.log('\n🎉 All performance budgets passed!');
  }
}

// Run the performance budget check
generatePerformanceReport();
