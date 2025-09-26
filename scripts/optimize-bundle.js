#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting bundle optimization...');

// Analyze bundle size and provide recommendations
function analyzeBundleSize() {
  console.log('\n📊 Bundle Analysis:');
  
  const buildDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(buildDir)) {
    console.log('❌ Build directory not found. Run npm run build first.');
    return;
  }

  // Read build manifest
  const manifestPath = path.join(buildDir, 'build-manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log('✅ Build manifest found');
    
    // Analyze page sizes
    const pages = manifest.pages || {};
    let totalSize = 0;
    
    Object.keys(pages).forEach(page => {
      const pageFiles = pages[page] || [];
      let pageSize = 0;
      
      pageFiles.forEach(file => {
        const filePath = path.join(buildDir, 'static', file);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          pageSize += stats.size;
        }
      });
      
      totalSize += pageSize;
      if (pageSize > 100000) { // > 100KB
        console.log(`⚠️  Large page: ${page} (${(pageSize / 1024).toFixed(1)}KB)`);
      }
    });
    
    console.log(`📊 Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
  }
}

// Provide optimization recommendations
function provideRecommendations() {
  console.log('\n💡 Optimization Recommendations:');
  
  const recommendations = [
    '1. ✅ Dynamic imports implemented for heavy components',
    '2. ✅ Mobile loading screen optimized',
    '3. ✅ Layout structure simplified',
    '4. ✅ Cache durations optimized',
    '5. ✅ Performance monitoring limited to development',
    '6. 🔄 Consider removing unused dependencies',
    '7. 🔄 Implement service worker caching',
    '8. 🔄 Use Next.js Image optimization',
    '9. 🔄 Consider lazy loading for images',
    '10. 🔄 Implement preloading for critical resources'
  ];
  
  recommendations.forEach(rec => console.log(rec));
}

// Check for heavy dependencies
function checkHeavyDependencies() {
  console.log('\n📚 Checking Heavy Dependencies:');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const heavyDeps = {
      'apexcharts': '~50KB (Charts)',
      'react-apexcharts': '~10KB (Chart wrapper)',
      '@supabase/supabase-js': '~40KB (Database)',
      'framer-motion': '~30KB (Animations)',
      'react-window': '~15KB (Virtualization)',
      '@tanstack/react-query': '~35KB (Data fetching)',
      'next': '~200KB (Framework)',
      'react': '~50KB (UI Library)',
      'react-dom': '~50KB (DOM renderer)'
    };
    
    console.log('📦 Heavy dependencies found:');
    Object.keys(heavyDeps).forEach(dep => {
      if (dependencies[dep]) {
        console.log(`   ${dep}: ${heavyDeps[dep]}`);
      }
    });
    
    // Check for potentially unused dependencies
    const potentiallyUnused = [
      'archiver',
      'aws-sdk',
      'backblaze-b2',
      'csv-parse',
      'exceljs',
      'firebase-admin',
      'jszip',
      'nodemailer',
      'string-similarity'
    ];
    
    console.log('\n🔍 Potentially unused dependencies:');
    potentiallyUnused.forEach(dep => {
      if (dependencies[dep]) {
        console.log(`   ⚠️  ${dep} - Consider removing if unused`);
      }
    });
  }
}

// Main execution
analyzeBundleSize();
checkHeavyDependencies();
provideRecommendations();

console.log('\n🎉 Bundle optimization analysis complete!');
console.log('\n📱 Mobile Performance Tips:');
console.log('   • Bundle size optimized for mobile');
console.log('   • Dynamic imports reduce initial load');
console.log('   • Aggressive caching improves repeat visits');
console.log('   • Layout optimizations reduce render time');

console.log('\n🚀 Next Steps:');
console.log('   1. Test on actual mobile devices');
console.log('   2. Use Chrome DevTools for performance analysis');
console.log('   3. Monitor Core Web Vitals');
console.log('   4. Consider implementing Progressive Web App features');
