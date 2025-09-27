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
  
  const dynamicIndexHtml = `<!DOCTYPE html>
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

  <!-- Preload critical CSS -->
${cssPreloads}
  
  <!-- Load CSS -->
${cssLinks}

  <script>
    // Prevent zoom on input focus (iOS)
    document.addEventListener('DOMContentLoaded', function() {
      var viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
      }
    });
  </script>
</head>
<body class="__variable_f367f3 font-sans">
  <div id="__next">
    <!-- Initial loading screen -->
    <div style="min-height: 100vh; background-color: #111827; display: flex; align-items: center; justify-content: center;">
      <div style="text-align: center; color: white;">
        <div style="width: 48px; height: 48px; border: 2px solid #d3194f; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
        <p style="font-size: 18px; font-weight: 500; margin-bottom: 8px;">Initializing...</p>
        <p style="font-size: 14px; color: #9ca3af;">Please wait...</p>
      </div>
    </div>
  </div>
  
  <style>
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
  
  <!-- Load Next.js scripts -->
${jsScripts}
  
  <script>
    // Initialize Next.js app data (must match web app structure)
    window.__NEXT_DATA__ = {
      props: { 
        pageProps: {}
      },
      page: "/",
      query: {},
      buildId: "${jsFiles.buildManifest ? jsFiles.buildManifest.split('/')[0] : 'static'}",
      isFallback: false,
      gssp: false,
      gsp: false,
      appGip: true,
      scriptLoader: [],
      assetPrefix: "",
      runtimeConfig: {},
      nextExport: true,
      autoExport: true,
      dynamicIds: []
    };
    
    // Initialize Next.js router
    window.__NEXT_ROUTER_BASEPATH__ = "";
    
    // Debug logging for troubleshooting
    console.log('🚀 Static Next.js app initializing...');
    console.log('📄 CSS files loaded:', ${JSON.stringify(cssFiles)});
    console.log('📦 JS chunks loaded:', Object.keys(${JSON.stringify(jsFiles)}).filter(k => ${JSON.stringify(jsFiles)}[k]));
    console.log('🔧 Build ID:', window.__NEXT_DATA__.buildId);
    
    // Wait for Next.js to be ready
    if (typeof window !== 'undefined') {
      window.addEventListener('DOMContentLoaded', function() {
        console.log('✅ DOM loaded, Next.js should initialize now');
      });
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join('out', 'index.html'), dynamicIndexHtml);
  console.log('✅ Created dynamic index.html with actual build files');

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
