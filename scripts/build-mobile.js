const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper function to delete directories recursively
function deleteDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      deleteDir(entryPath);
    } else {
      fs.unlinkSync(entryPath);
    }
  }

  fs.rmdirSync(dirPath);
}

console.log('🚀 Starting mobile build process...');

try {
  // Step 1: Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('.next')) {
    deleteDir('.next');
  }
  if (fs.existsSync('out')) {
    deleteDir('out');
  }

  // Step 2: Build Next.js app for mobile (disable PWA for mobile builds)
  console.log('📦 Building Next.js application for mobile (PWA disabled)...');
  execSync('npm run build', { stdio: 'inherit', env: { ...process.env, DISABLE_PWA: 'true' } });

  // Step 3: Copy build to out directory for Capacitor
  console.log('📁 Preparing build for Capacitor...');
  if (!fs.existsSync('out')) {
    fs.mkdirSync('out', { recursive: true });
  }

  // Helper function to copy directories recursively
  function copyDir(src, dest) {
    if (!fs.existsSync(src)) return;

    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  // Copy .next/static to out/_next/static
  if (fs.existsSync('.next/static')) {
    copyDir('.next/static', 'out/_next/static');
  }

  // Copy .next/build to out/_next/build
  if (fs.existsSync('.next/build')) {
    copyDir('.next/build', 'out/_next/build');
  }

  // Copy .next/static/chunks to out/_next/static/chunks
  if (fs.existsSync('.next/static/chunks')) {
    copyDir('.next/static/chunks', 'out/_next/static/chunks');
  }

  // Copy public assets to out
  if (fs.existsSync('public')) {
    copyDir('public', 'out');
  }

  // Step 4: Generate index.html for Capacitor
  console.log('📄 Generating index.html for Capacitor...');

  // Get the actual build manifest to find the correct file names
  let mainJsFile = 'main.js';
  let appJsFile = '_app.js';
  let webpackJsFile = 'webpack.js';

  try {
    if (fs.existsSync('.next/build-manifest.json')) {
      const buildManifest = JSON.parse(fs.readFileSync('.next/build-manifest.json', 'utf8'));

      // Find main.js in rootMainFiles
      if (buildManifest.rootMainFiles && buildManifest.rootMainFiles.length > 0) {
        const mainFile = buildManifest.rootMainFiles.find(file => file.includes('main-'));
        if (mainFile) {
          mainJsFile = mainFile.replace('static/chunks/', '');
        }
      }

      // Find webpack.js in rootMainFiles
      if (buildManifest.rootMainFiles && buildManifest.rootMainFiles.length > 0) {
        const webpackFile = buildManifest.rootMainFiles.find(file => file.includes('webpack-'));
        if (webpackFile) {
          webpackJsFile = webpackFile.replace('static/chunks/', '');
        }
      }

      // Find _app.js in pages
      if (buildManifest.pages && buildManifest.pages['/_app'] && buildManifest.pages['/_app'].length > 0) {
        appJsFile = buildManifest.pages['/_app'][buildManifest.pages['/_app'].length - 1];
        appJsFile = appJsFile.replace('static/chunks/pages/', '');
      }

      console.log('📄 Build manifest parsed successfully:');
      console.log('   - Main JS:', mainJsFile);
      console.log('   - App JS:', appJsFile);
      console.log('   - Webpack JS:', webpackJsFile);
    }
  } catch (error) {
    console.warn('Could not read build manifest, using default file names:', error.message);
  }

  // Build the JavaScript code with proper variable interpolation using string concatenation
  const scriptContent = `
    // Load the main build files
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    // Load CSS files
    const loadCSS = (href) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    };

    // Initialize the app
    window.onload = async function() {
      try {
        // Load CSS files first
        const cssFiles = [
          '041aafb0eaf4613c.css',
          '1c3a54188e785e75.css',
          '544f237784b80ff5.css',
          'df9af8de86ae8dde.css'
        ];

        for (const cssFile of cssFiles) {
          await loadCSS('/_next/static/css/' + cssFile);
        }

        // Load main build files with correct dynamic names
        await loadScript('/_next/static/chunks/' + '${webpackJsFile}');
        await loadScript('/_next/static/chunks/' + '${mainJsFile}');
        await loadScript('/_next/static/chunks/pages/' + '${appJsFile}');

        console.log('✅ Mobile app loaded successfully');
        console.log('📱 Platform:', window.Capacitor?.platform || 'web');
        console.log('🔌 Is Native:', window.Capacitor?.isNative || false);
        console.log('📄 Loaded files:');
        console.log('   - Webpack: ' + '${webpackJsFile}');
        console.log('   - Main: ' + '${mainJsFile}');
        console.log('   - App: ' + '${appJsFile}');
      } catch (error) {
        console.error('❌ Failed to load mobile app:', error);
        console.error('🔍 Debugging info:');
        console.error('   - Webpack file: ' + '${webpackJsFile}');
        console.error('   - Main file: ' + '${mainJsFile}');
        console.error('   - App file: ' + '${appJsFile}');
      }
    };
  `;

  // Replace the template variables in the script content
  const processedScript = scriptContent
    .replace(/\$\{webpackJsFile\}/g, webpackJsFile)
    .replace(/\$\{mainJsFile\}/g, mainJsFile)
    .replace(/\$\{appJsFile\}/g, appJsFile);

  const indexHtml = `<!DOCTYPE html>
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

  <script>
    // Capacitor detection for mobile app
    if (typeof window !== 'undefined') {
      window.Capacitor = {
        isNative: typeof window.Capacitor !== 'undefined' && window.Capacitor.isNative,
        platform: 'web'
      };

      // Detect if running in Capacitor
      if (window.location.protocol === 'capacitor:' || window.location.protocol === 'file:') {
        window.Capacitor.platform = 'native';
        window.Capacitor.isNative = true;
      }
    }

    // Prevent zoom on input focus (iOS)
    document.addEventListener('DOMContentLoaded', function() {
      var viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
      }
    });
  </script>
</head>
<body>
  <div id="__next"></div>

  <!-- Load build assets dynamically -->
  <script>${processedScript}</script>
</body>
</html>`;

  fs.writeFileSync(path.join('out', 'index.html'), indexHtml);

  // Step 5: Sync with Capacitor
  console.log('📱 Syncing with Capacitor...');
  execSync('npx cap sync', { stdio: 'inherit' });

  console.log('✅ Mobile build completed successfully!');
  console.log('📱 You can now run:');
  console.log('   npm run cap:ios     - Open iOS project');
  console.log('   npm run cap:android - Open Android project');

} catch (error) {
  console.error('❌ Mobile build failed:', error.message);
  process.exit(1);
}



