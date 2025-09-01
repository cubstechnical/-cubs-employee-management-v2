#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building CUBS Visa Management for Mobile...\n');

try {
  // Step 1: Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  if (fs.existsSync('out')) {
    fs.rmSync('out', { recursive: true, force: true });
  }

  // Step 2: Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Step 3: Build Next.js app for mobile (without API routes)
  console.log('🏗️ Building Next.js app for mobile...');
  
  // Create a temporary directory structure without API routes
  const tempDir = 'temp-mobile-build';
  const apiDir = 'app/api';
  
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  // Copy all files except API routes
  console.log('📁 Creating mobile build structure...');
  fs.mkdirSync(tempDir, { recursive: true });
  
  // Copy all files except app/api
  const copyRecursive = (src, dest) => {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        if (entry.name === 'api') {
          console.log('⏭️ Skipping API directory for mobile build');
          continue;
        }
        fs.mkdirSync(destPath, { recursive: true });
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  
  copyRecursive('.', tempDir);
  
  try {
    // Change to temp directory and build
    process.chdir(tempDir);
    execSync('npx next build --config next.config.mobile.js', { stdio: 'inherit' });
    
    // Copy build output back to main directory
    if (fs.existsSync('dist')) {
      fs.cpSync('dist', '../dist', { recursive: true, force: true });
    }
    if (fs.existsSync('out')) {
      fs.cpSync('out', '../out', { recursive: true, force: true });
    }
    
    process.chdir('..');
  } finally {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  // Step 4: Copy dist to out (for backward compatibility)
  if (fs.existsSync('dist') && !fs.existsSync('out')) {
    console.log('📁 Copying dist to out for compatibility...');
    fs.cpSync('dist', 'out', { recursive: true });
  }

  // Step 5: Prepare Capacitor
  console.log('📱 Preparing Capacitor...');
  execSync('npx cap sync', { stdio: 'inherit' });

  // Step 6: Generate app icons if needed
  if (fs.existsSync('scripts/generate-android-icons.js')) {
    console.log('🎨 Generating app icons...');
    execSync('node scripts/generate-android-icons.js', { stdio: 'inherit' });
  }

  console.log('\n✅ Mobile build completed successfully!');
  console.log('\n📱 Next steps:');
  console.log('   Android: npx cap open android');
  console.log('   iOS:     npx cap open ios');
  console.log('\n🚀 Build files are ready in:');
  console.log('   - dist/ (Next.js static export)');
  console.log('   - android/ (Android project)');
  console.log('   - ios/ (iOS project)');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
