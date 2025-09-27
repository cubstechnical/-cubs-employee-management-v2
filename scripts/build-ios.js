#!/usr/bin/env node

/**
 * iOS-specific build script
 * Ensures proper build for iOS Capacitor apps
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🍎 Building for iOS...');

try {
  // 1. Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('out')) {
    if (process.platform === 'win32') {
      execSync('rmdir /s /q out', { stdio: 'inherit', shell: true });
    } else {
      execSync('rm -rf out', { stdio: 'inherit' });
    }
  }
  if (fs.existsSync('.next')) {
    if (process.platform === 'win32') {
      execSync('rmdir /s /q .next', { stdio: 'inherit', shell: true });
    } else {
      execSync('rm -rf .next', { stdio: 'inherit' });
    }
  }

  // 2. Build Next.js app
  console.log('🏗️ Building Next.js app...');
  execSync('npm run build', { stdio: 'inherit' });

  // 3. Verify build output
  console.log('✅ Verifying build output...');
  if (!fs.existsSync('.next')) {
    throw new Error('Build output not found');
  }

  // 4. Create out directory for Capacitor
  console.log('📁 Creating out directory for Capacitor...');
  if (!fs.existsSync('out')) {
    fs.mkdirSync('out', { recursive: true });
  }

  // 5. Copy static files to out directory
  console.log('📋 Copying static files...');
  const staticFiles = [
    'public',
    '.next/static',
    '.next/server'
  ];

  staticFiles.forEach(file => {
    if (fs.existsSync(file)) {
      // For .next/static and .next/server, preserve the _next directory structure
      let destPath;
      if (file.startsWith('.next/')) {
        // Replace .next with _next in the destination path
        const relativePath = file.replace('.next/', '');
        destPath = path.join('out', '_next', relativePath);
      } else {
        destPath = path.join('out', path.basename(file));
      }
      
      // Create destination directory if it doesn't exist
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      if (fs.statSync(file).isDirectory()) {
        // Use cross-platform copy command
        if (process.platform === 'win32') {
          execSync(`xcopy "${file}" "${destPath}" /E /I /Y`, { stdio: 'inherit', shell: true });
        } else {
          // Unix/Linux/macOS
          execSync(`cp -r "${file}" "${destPath}"`, { stdio: 'inherit' });
        }
      } else {
        fs.copyFileSync(file, destPath);
      }
    }
  });

  // 6. Create a proper static index.html for PWA/mobile
  console.log('📄 Creating static index.html for PWA/mobile...');
  
  // Create a proper static index.html that works with PWA and mobile
  const staticIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="CUBS Admin" />
  <meta name="application-name" content="CUBS Admin" />
  <meta name="msapplication-TileColor" content="#d3194f" />
  <meta name="msapplication-tap-highlight" content="no" />
  <meta name="theme-color" content="#d3194f" />
  <meta name="format-detection" content="telephone=no" />
  <meta name="apple-touch-fullscreen" content="yes" />
  <meta name="apple-mobile-web-app-orientations" content="portrait" />
  <meta name="mobile-web-app-status-bar-style" content="default" />

  <title>CUBS Employee Management</title>
  <meta name="description" content="Comprehensive employee management system for CUBS Technical Group" />

  <link rel="manifest" href="/manifest.json" />
  <link rel="icon" href="/assets/cubs.webp" sizes="32x32" type="image/webp" />
  <link rel="icon" href="/assets/cubs.webp" sizes="192x192" type="image/webp" />
  <link rel="icon" href="/assets/cubs.webp" sizes="512x512" type="image/webp" />
  <link rel="apple-touch-icon" href="/assets/cubs.webp" />
  <link rel="apple-touch-icon" href="/assets/cubs.webp" sizes="180x180" />

  <!-- Preload critical resources -->
  <link rel="preload" href="/_next/static/css/a3555e678bd5d024.css" as="style" />
  <link rel="preload" href="/_next/static/css/041aafb0eaf4613c.css" as="style" />
  <link rel="preload" href="/_next/static/css/15d6c795b9c2fcaf.css" as="style" />
  <link rel="preload" href="/_next/static/css/544f237784b80ff5.css" as="style" />
  
  <!-- Load CSS -->
  <link rel="stylesheet" href="/_next/static/css/a3555e678bd5d024.css" />
  <link rel="stylesheet" href="/_next/static/css/041aafb0eaf4613c.css" />
  <link rel="stylesheet" href="/_next/static/css/15d6c795b9c2fcaf.css" />
  <link rel="stylesheet" href="/_next/static/css/544f237784b80ff5.css" />

  <script>
    // Prevent zoom on input focus (iOS)
    document.addEventListener('DOMContentLoaded', function() {
      var viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
      }
    });
    
    // Initialize Next.js app data
    window.__NEXT_DATA__ = {
      props: {
        pageProps: {}
      },
      page: "/",
      query: {},
      buildId: "static",
      isFallback: false,
      gssp: false,
      appGip: true,
      scriptLoader: []
    };
  </script>
</head>
<body>
  <div id="__next">
    <!-- Loading screen for PWA/mobile -->
    <div class="min-h-screen bg-gray-900 flex items-center justify-center">
      <div class="text-center space-y-4">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3194f] mx-auto"></div>
        <p class="text-white text-lg font-medium">Initializing...</p>
        <p class="text-gray-400 text-sm">Please wait...</p>
      </div>
    </div>
  </div>
  
  <!-- Load Next.js scripts -->
  <script src="/_next/static/chunks/webpack-ba9f98305ca13bce.js"></script>
  <script src="/_next/static/chunks/main-app-a0e8ab46bb6360cc.js"></script>
  <script src="/_next/static/chunks/polyfills-42372ed130431b0a.js"></script>
  <script src="/_next/static/chunks/react-d031d8a3-b717d54361277a72.js"></script>
  <script src="/_next/static/chunks/react-ec847047-6b7b1def18eeb552.js"></script>
  <script src="/_next/static/chunks/app/layout-55cbeb360efd671c.js"></script>
  <script src="/_next/static/chunks/app/page-f3956634-f5adae3b48a692e5.js"></script>
  
  <!-- Initialize the app -->
  <script>
    // Initialize Next.js app
    if (typeof window !== 'undefined' && window.next) {
      window.next.router.ready(() => {
        console.log('Next.js app initialized');
      });
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join('out', 'index.html'), staticIndexHtml);
  console.log('✅ Created static index.html for PWA/mobile');

  // 4. Copy iOS-specific files
  console.log('📱 Copying iOS-specific files...');
  const iosFiles = [
    'lib/utils/iosErrorHandler.ts',
    'components/ios/IOSLoadingScreen.tsx'
  ];

  iosFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const destPath = path.join('out', file);
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(file, destPath);
    }
  });

  // 5. Update Capacitor
  console.log('🔄 Updating Capacitor...');
  execSync('npx cap sync ios', { stdio: 'inherit' });

  console.log('✅ iOS build completed successfully!');
  console.log('📱 You can now build the iOS app in Xcode');

} catch (error) {
  console.error('❌ iOS build failed:', error);
  process.exit(1);
}
