#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📊 Performance monitoring...');

// Check bundle size
function checkBundleSize() {
  const buildManifestPath = path.join(process.cwd(), '.next/build-manifest.json');
  if (!fs.existsSync(buildManifestPath)) {
    console.log('❌ Build manifest not found. Run npm run build first.');
    return;
  }

  const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
  let totalSize = 0;

  Object.values(buildManifest.pages).forEach(files => {
    files.forEach(file => {
      const filePath = path.join(process.cwd(), '.next', file);
      if (fs.existsSync(filePath)) {
        totalSize += fs.statSync(filePath).size;
      }
    });
  });

  const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  console.log(`📦 Total bundle size: ${sizeMB}MB`);

  if (totalSize > 1024 * 1024) { // 1MB
    console.log('⚠️  Bundle size is large. Consider optimization.');
  } else {
    console.log('✅ Bundle size is optimized.');
  }
}

// Check for performance issues
function checkPerformanceIssues() {
  const issues = [];
  
  // Check for large dependencies
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const heavyDeps = ['apexcharts', 'framer-motion', '@supabase/supabase-js'];
  
  heavyDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      issues.push(`Heavy dependency: ${dep}`);
    }
  });

  if (issues.length > 0) {
    console.log('⚠️  Performance issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('✅ No performance issues detected.');
  }
}

checkBundleSize();
checkPerformanceIssues();
console.log('🎉 Performance check complete!');
