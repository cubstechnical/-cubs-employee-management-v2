#!/usr/bin/env node

/**
 * Test Login Page Fix
 * 
 * This script tests if the login page JavaScript error has been fixed.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Testing Login Page JavaScript Fix\n');

const loginPagePath = 'app/login/page.tsx';

if (!fs.existsSync(loginPagePath)) {
  console.error('❌ Error: Login page not found:', loginPagePath);
  process.exit(1);
}

console.log('✅ Login page found:', loginPagePath);

// Read the login page content
const loginContent = fs.readFileSync(loginPagePath, 'utf8');

console.log('\n🔍 Checking for JavaScript Issues:');
console.log('='.repeat(50));

// Check for the problematic new Image() usage
if (loginContent.includes('new Image()')) {
  console.log('❌ Found problematic "new Image()" usage');
  console.log('   This conflicts with Next.js Image component import');
} else if (loginContent.includes('new window.Image()')) {
  console.log('✅ Fixed: Using "new window.Image()" instead');
  console.log('   This properly references the native Image constructor');
} else {
  console.log('✅ No Image constructor conflicts found');
}

// Check for proper Image import
if (loginContent.includes("import Image from 'next/image'")) {
  console.log('✅ Next.js Image component properly imported');
} else {
  console.log('❌ Next.js Image component not imported');
}

// Check for proper function export
if (loginContent.includes('export default function LoginPage()')) {
  console.log('✅ Function properly exported as LoginPage');
} else if (loginContent.includes('export default function')) {
  console.log('⚠️  Function exported but name might be incorrect');
} else {
  console.log('❌ No default export found');
}

// Check for WebP background usage
if (loginContent.includes('bg1.webp')) {
  console.log('✅ Using optimized WebP background image');
} else {
  console.log('❌ Not using WebP background image');
}

console.log('\n🎯 Fix Summary:');
console.log('='.repeat(50));

const hasImageConflict = loginContent.includes('new Image()');
const hasWindowImage = loginContent.includes('new window.Image()');
const hasImageImport = loginContent.includes("import Image from 'next/image'");
const hasWebP = loginContent.includes('bg1.webp');

if (!hasImageConflict && hasWindowImage && hasImageImport && hasWebP) {
  console.log('🎉 All issues fixed!');
  console.log('   ✅ No Image constructor conflicts');
  console.log('   ✅ Using window.Image() for preloading');
  console.log('   ✅ Next.js Image component properly imported');
  console.log('   ✅ Using optimized WebP background');
  console.log('\n🚀 The login page should now work without JavaScript errors!');
} else {
  console.log('⚠️  Some issues may still exist:');
  if (hasImageConflict) {
    console.log('   ❌ Still has "new Image()" conflict');
  }
  if (!hasWindowImage) {
    console.log('   ❌ Not using "new window.Image()"');
  }
  if (!hasImageImport) {
    console.log('   ❌ Missing Next.js Image import');
  }
  if (!hasWebP) {
    console.log('   ❌ Not using WebP background');
  }
}

console.log('\n🔗 Test Commands:');
console.log('   npm run dev                    # Start development server');
console.log('   npm run test:login            # Test login functionality');
console.log('   npm run test:webp             # Check WebP optimization');

console.log('\n✨ If the error persists, try:');
console.log('   1. Clear browser cache');
console.log('   2. Restart the development server');
console.log('   3. Check browser console for other errors');


