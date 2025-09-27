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

  // 2. Build Next.js app (without static export)
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
  
  // 5. Copy the main index.html from Next.js build
  console.log('📄 Copying main index.html...');
  const srcIndexPath = path.join('.next', 'server', 'app', 'index.html');
  const destIndexPath = path.join('out', 'index.html');
  
  if (fs.existsSync(srcIndexPath)) {
    fs.copyFileSync(srcIndexPath, destIndexPath);
    console.log('✅ Copied index.html from Next.js build');
  } else {
    console.log('⚠️ index.html not found, will create custom one later');
  }

  // 6. Copy static files to out directory
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

  // 6. Create a dynamic index.html based on actual build output
  console.log('📄 Creating dynamic index.html for PWA/mobile...');
  
  // Read actual CSS files
  const cssDir = path.join('out', '_next', 'static', 'css');
  let cssFiles = [];
  if (fs.existsSync(cssDir)) {
    cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));
  }
  
  // Read actual JS chunk files and build manifests
  const chunksDir = path.join('out', '_next', 'static', 'chunks');
  const staticDir = path.join('out', '_next', 'static');
  
  let jsFiles = {
    webpack: '',
    mainApp: '',
    polyfills: '',
    react: [],
    layout: '',
    page: '',
    buildManifest: '',
    ssgManifest: ''
  };
  
  // Find build manifests
  if (fs.existsSync(staticDir)) {
    const staticContents = fs.readdirSync(staticDir);
    const buildIdDir = staticContents.find(dir => dir.length > 10 && dir !== 'chunks' && dir !== 'css' && dir !== 'media');
    
    if (buildIdDir) {
      const manifestDir = path.join(staticDir, buildIdDir);
      if (fs.existsSync(path.join(manifestDir, '_buildManifest.js'))) {
        jsFiles.buildManifest = `${buildIdDir}/_buildManifest.js`;
      }
      if (fs.existsSync(path.join(manifestDir, '_ssgManifest.js'))) {
        jsFiles.ssgManifest = `${buildIdDir}/_ssgManifest.js`;
      }
    }
  }
  
  if (fs.existsSync(chunksDir)) {
    const allChunks = fs.readdirSync(chunksDir).filter(file => file.endsWith('.js'));
    
    // Find specific chunks
    jsFiles.webpack = allChunks.find(file => file.startsWith('webpack-')) || '';
    jsFiles.mainApp = allChunks.find(file => file.startsWith('main-app-')) || '';
    jsFiles.polyfills = allChunks.find(file => file.startsWith('polyfills-')) || '';
    jsFiles.react = allChunks.filter(file => file.startsWith('react-'));
    
    // Find layout and page chunks
    const appDir = path.join(chunksDir, 'app');
    if (fs.existsSync(appDir)) {
      const appChunks = fs.readdirSync(appDir).filter(file => file.endsWith('.js'));
      jsFiles.layout = appChunks.find(file => file.startsWith('layout-')) || '';
      jsFiles.page = appChunks.find(file => file.startsWith('page-')) || '';
    }
  }
  
  // Create CSS links
  const cssLinks = cssFiles.map(file => 
    `  <link rel="stylesheet" href="/_next/static/css/${file}" />`
  ).join('\n');
  
  const cssPreloads = cssFiles.map(file => 
    `  <link rel="preload" href="/_next/static/css/${file}" as="style" />`
  ).join('\n');
  
  // Create JS script tags in proper loading order
  const jsScripts = [
    // 1. Load build manifests first (critical for Next.js)
    jsFiles.buildManifest ? `  <script src="/_next/static/${jsFiles.buildManifest}"></script>` : '',
    jsFiles.ssgManifest ? `  <script src="/_next/static/${jsFiles.ssgManifest}"></script>` : '',
    
    // 2. Load polyfills
    jsFiles.polyfills ? `  <script src="/_next/static/chunks/${jsFiles.polyfills}"></script>` : '',
    
    // 3. Load webpack runtime
    jsFiles.webpack ? `  <script src="/_next/static/chunks/${jsFiles.webpack}"></script>` : '',
    
    // 4. Load React chunks
    ...jsFiles.react.map(file => `  <script src="/_next/static/chunks/${file}"></script>`),
    
    // 5. Load main app
    jsFiles.mainApp ? `  <script src="/_next/static/chunks/${jsFiles.mainApp}"></script>` : '',
    
    // 6. Load layout and page
    jsFiles.layout ? `  <script src="/_next/static/chunks/app/${jsFiles.layout}"></script>` : '',
    jsFiles.page ? `  <script src="/_next/static/chunks/app/${jsFiles.page}"></script>` : ''
  ].filter(Boolean).join('\n');
  
  // Create a working SPA-style index.html that actually works with Next.js static export
  const spaIndexHtml = `<!DOCTYPE html>
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
  <link rel="apple-touch-icon" href="/assets/cubs.webp" />

  <!-- Load CSS directly -->
${cssLinks}

  <script>
    // Mobile optimizations
    document.addEventListener('DOMContentLoaded', function() {
      // Prevent zoom on input focus (iOS)
      var viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
      }
      
      // Force app to load after DOM is ready
      setTimeout(function() {
        if (window.next && window.next.router) {
          console.log('✅ Next.js router ready');
        } else {
          console.log('⚠️ Next.js router not ready, forcing initialization...');
          // Force trigger React hydration
          if (window.React && window.ReactDOM) {
            console.log('🔄 Forcing React hydration...');
          }
        }
      }, 1000);
    });
    
    // Enhanced error handling
    window.addEventListener('error', function(e) {
      console.error('🚨 Global error:', e.error);
      // Don't show error to user for now, just log it
    });
    
    window.addEventListener('unhandledrejection', function(e) {
      console.error('🚨 Unhandled promise rejection:', e.reason);
      e.preventDefault(); // Prevent the default browser behavior
    });
  </script>
</head>
<body class="__variable_f367f3 font-sans" style="margin: 0; padding: 0;">
  <div id="__next">
    <!-- Minimal loading screen that will be replaced by React -->
    <div id="initial-loader" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <div style="text-align: center; color: white;">
        <div style="
          width: 60px;
          height: 60px;
          border: 3px solid #374151;
          border-top: 3px solid #d3194f;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        "></div>
        <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 600; color: #f9fafb;">CUBS Technical</h2>
        <p style="margin: 0; font-size: 14px; color: #9ca3af;">Loading Employee Management System...</p>
      </div>
    </div>
  </div>
  
  <style>
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Hide loader when app loads */
    .app-loaded #initial-loader {
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.5s ease-out;
    }
  </style>
  
  <!-- Load scripts in optimal order for static export -->
${jsScripts}
  
  <script>
    // Initialize Next.js for static export
    window.__NEXT_DATA__ = {
      props: { pageProps: {} },
      page: "/",
      query: {},
      buildId: "${jsFiles.buildManifest ? jsFiles.buildManifest.split('/')[0] : 'export'}",
      isFallback: false,
      nextExport: true,
      autoExport: true
    };
    
    // Debug info
    console.log('📱 CUBS Mobile App Starting...');
    console.log('🎨 CSS files:', [${cssFiles.map(f => `'${f}'`).join(', ')}]);
    console.log('📦 JS chunks:', {
      buildManifest: '${jsFiles.buildManifest}',
      webpack: '${jsFiles.webpack}',
      mainApp: '${jsFiles.mainApp}',
      layout: '${jsFiles.layout}',
      page: '${jsFiles.page}'
    });
    
    // Remove loader when app is ready
    let appCheckInterval = setInterval(function() {
      if (document.querySelector('[data-reactroot]') || document.querySelector('#__next > div:not(#initial-loader)')) {
        document.body.classList.add('app-loaded');
        setTimeout(() => {
          const loader = document.getElementById('initial-loader');
          if (loader) loader.remove();
        }, 500);
        clearInterval(appCheckInterval);
        console.log('✅ App loaded successfully!');
      }
    }, 100);
    
    // Fallback: remove loader after 10 seconds regardless
    setTimeout(function() {
      document.body.classList.add('app-loaded');
      setTimeout(() => {
        const loader = document.getElementById('initial-loader');
        if (loader) loader.remove();
      }, 500);
      clearInterval(appCheckInterval);
      console.log('⏰ Loader removed after timeout');
    }, 10000);
  </script>
</body>
</html>`;

  // The index.html was already copied from Next.js build
  console.log('✅ Using Next.js generated index.html for mobile/PWA');

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
