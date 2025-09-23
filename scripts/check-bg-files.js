#!/usr/bin/env node

/**
 * Check Background Image Files
 * 
 * This script checks the size of both bg1.jpg and bg1.webp files
 * and shows the optimization results.
 */

const fs = require('fs');
const path = require('path');

console.log('🖼️  Background Image Files Check\n');

const bgJpgPath = 'public/assets/bg1.jpg';
const bgWebpPath = 'public/assets/bg1.webp';

console.log('📊 File Size Comparison:');
console.log('='.repeat(50));

// Check bg1.jpg
if (fs.existsSync(bgJpgPath)) {
  const jpgStats = fs.statSync(bgJpgPath);
  const jpgSizeMB = (jpgStats.size / (1024 * 1024)).toFixed(2);
  const jpgSizeKB = (jpgStats.size / 1024).toFixed(0);
  console.log(`📸 bg1.jpg: ${jpgSizeMB} MB (${jpgSizeKB} KB)`);
} else {
  console.log('❌ bg1.jpg not found');
}

// Check bg1.webp
if (fs.existsSync(bgWebpPath)) {
  const webpStats = fs.statSync(bgWebpPath);
  const webpSizeMB = (webpStats.size / (1024 * 1024)).toFixed(2);
  const webpSizeKB = (webpStats.size / 1024).toFixed(0);
  console.log(`🎨 bg1.webp: ${webpSizeMB} MB (${webpSizeKB} KB)`);
  
  // Calculate optimization percentage
  if (fs.existsSync(bgJpgPath)) {
    const jpgStats = fs.statSync(bgJpgPath);
    const reduction = ((jpgStats.size - webpStats.size) / jpgStats.size * 100).toFixed(1);
    console.log(`\n📈 Optimization Results:`);
    console.log(`   • Size reduction: ${reduction}%`);
    console.log(`   • Load time improvement: ~${Math.round((jpgStats.size - webpStats.size) / 1024 / 1024 * 1000)}ms faster on 3G`);
    console.log(`   • Performance: ${reduction > 50 ? 'Excellent' : reduction > 30 ? 'Good' : 'Moderate'} optimization`);
  }
} else {
  console.log('❌ bg1.webp not found');
}

console.log('\n' + '='.repeat(50));
console.log('🎯 Recommendation:');
if (fs.existsSync(bgWebpPath)) {
  console.log('✅ Use bg1.webp for better performance!');
  console.log('   • Smaller file size');
  console.log('   • Faster loading');
  console.log('   • Better mobile performance');
  console.log('   • Modern format support');
} else {
  console.log('⚠️  Consider optimizing bg1.jpg to WebP format');
  console.log('   • Use https://squoosh.app/');
  console.log('   • Expected 50-70% size reduction');
}

console.log('\n🔧 Next Steps:');
console.log('   1. Update CSS to use bg1.webp');
console.log('   2. Test the login page');
console.log('   3. Verify performance improvement');


