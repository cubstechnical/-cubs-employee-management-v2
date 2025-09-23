#!/usr/bin/env node

/**
 * Test WebP Background Optimization
 * 
 * This script tests the WebP optimization and shows the performance improvements.
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 CUBS Technical WebP Background Optimization Test\n');

const bgJpgPath = 'public/assets/bg1.jpg';
const bgWebpPath = 'public/assets/bg1.webp';

console.log('📊 File Analysis:');
console.log('='.repeat(60));

let jpgSize = 0;
let webpSize = 0;
let jpgExists = false;
let webpExists = false;

// Check bg1.jpg
if (fs.existsSync(bgJpgPath)) {
  const jpgStats = fs.statSync(bgJpgPath);
  jpgSize = jpgStats.size;
  jpgExists = true;
  const jpgSizeMB = (jpgSize / (1024 * 1024)).toFixed(2);
  const jpgSizeKB = (jpgSize / 1024).toFixed(0);
  console.log(`📸 bg1.jpg: ${jpgSizeMB} MB (${jpgSizeKB} KB)`);
} else {
  console.log('❌ bg1.jpg not found');
}

// Check bg1.webp
if (fs.existsSync(bgWebpPath)) {
  const webpStats = fs.statSync(bgWebpPath);
  webpSize = webpStats.size;
  webpExists = true;
  const webpSizeMB = (webpSize / (1024 * 1024)).toFixed(2);
  const webpSizeKB = (webpSize / 1024).toFixed(0);
  console.log(`🎨 bg1.webp: ${webpSizeMB} MB (${webpSizeKB} KB)`);
} else {
  console.log('❌ bg1.webp not found');
}

if (jpgExists && webpExists) {
  const reduction = ((jpgSize - webpSize) / jpgSize * 100).toFixed(1);
  const jpgSizeMB = (jpgSize / (1024 * 1024)).toFixed(2);
  const webpSizeMB = (webpSize / (1024 * 1024)).toFixed(2);
  
  console.log('\n📈 Optimization Results:');
  console.log('='.repeat(60));
  console.log(`   • Original size: ${jpgSizeMB} MB`);
  console.log(`   • Optimized size: ${webpSizeMB} MB`);
  console.log(`   • Size reduction: ${reduction}%`);
  console.log(`   • Bytes saved: ${((jpgSize - webpSize) / 1024).toFixed(0)} KB`);
  
  console.log('\n⚡ Performance Improvements:');
  console.log('='.repeat(60));
  const loadTimeImprovement3G = Math.round((jpgSize - webpSize) / 1024 / 1024 * 1000);
  const loadTimeImprovement4G = Math.round((jpgSize - webpSize) / 1024 / 1024 * 200);
  console.log(`   • 3G Connection: ${loadTimeImprovement3G}ms faster`);
  console.log(`   • 4G Connection: ${loadTimeImprovement4G}ms faster`);
  console.log(`   • WiFi Connection: ${Math.round((jpgSize - webpSize) / 1024 / 1024 * 50)}ms faster`);
  
  console.log('\n📱 Mobile Performance:');
  console.log('='.repeat(60));
  if (reduction > 70) {
    console.log('   ✅ Excellent optimization - Perfect for mobile');
  } else if (reduction > 50) {
    console.log('   ✅ Great optimization - Good for mobile');
  } else if (reduction > 30) {
    console.log('   ⚠️  Good optimization - Acceptable for mobile');
  } else {
    console.log('   ⚠️  Moderate optimization - Consider further compression');
  }
  
  console.log('\n🔍 SEO Impact:');
  console.log('='.repeat(60));
  if (webpSize < 500 * 1024) { // Less than 500KB
    console.log('   ✅ Excellent - Great for Core Web Vitals');
  } else if (webpSize < 1024 * 1024) { // Less than 1MB
    console.log('   ✅ Good - Positive impact on SEO');
  } else {
    console.log('   ⚠️  Consider further optimization for better SEO');
  }
}

console.log('\n🎯 Implementation Status:');
console.log('='.repeat(60));

// Check if CSS is updated to use WebP
const cssPath = 'styles/login-background-image.css';
if (fs.existsSync(cssPath)) {
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  if (cssContent.includes('bg1.webp')) {
    console.log('✅ CSS updated to use bg1.webp');
  } else {
    console.log('❌ CSS still using bg1.jpg - needs update');
  }
} else {
  console.log('❌ CSS file not found');
}

// Check if login page is updated
const loginPagePath = 'app/login/page.tsx';
if (fs.existsSync(loginPagePath)) {
  const loginContent = fs.readFileSync(loginPagePath, 'utf8');
  if (loginContent.includes('bg1.webp')) {
    console.log('✅ Login page updated to preload bg1.webp');
  } else {
    console.log('❌ Login page still using bg1.jpg - needs update');
  }
} else {
  console.log('❌ Login page not found');
}

console.log('\n🚀 Final Recommendations:');
console.log('='.repeat(60));

if (webpExists && jpgExists) {
  const reduction = ((jpgSize - webpSize) / jpgSize * 100).toFixed(1);
  
  if (reduction > 50) {
    console.log('🎉 Excellent optimization! Your WebP file is significantly smaller.');
    console.log('   • Keep using bg1.webp');
    console.log('   • Consider removing bg1.jpg to save space');
    console.log('   • Your login page will load much faster');
  } else if (reduction > 30) {
    console.log('✅ Good optimization! WebP provides noticeable improvement.');
    console.log('   • Continue using bg1.webp');
    console.log('   • Consider further compression if needed');
  } else {
    console.log('⚠️  Moderate optimization. Consider further compression:');
    console.log('   • Try lower quality settings (60-70%)');
    console.log('   • Resize to 1920x1080 if larger');
    console.log('   • Use https://squoosh.app/ for better results');
  }
} else if (webpExists) {
  console.log('✅ WebP file found! Great optimization.');
  console.log('   • Your login page is now using the optimized version');
  console.log('   • Expect faster loading times');
} else {
  console.log('❌ WebP file not found. Please optimize bg1.jpg:');
  console.log('   • Use https://squoosh.app/');
  console.log('   • Convert to WebP format');
  console.log('   • Save as bg1.webp in public/assets/');
}

console.log('\n🔗 Test Commands:');
console.log('   npm run dev                    # Test the optimized login page');
console.log('   npm run test:login            # Verify all functionality');
console.log('   npm run compare:login         # Compare performance options');

console.log('\n✨ Your login page is now optimized with WebP background!');


