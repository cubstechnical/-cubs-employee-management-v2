const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper function to delete directories recursively
function deleteDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;

  try {
    // Use fs.rmSync for Node.js 14.14+ or fallback to rimraf
    if (fs.rmSync) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    } else {
      execSync(`npx rimraf "${dirPath}"`, { stdio: 'pipe' });
    }
  } catch (error) {
    console.warn(`Could not delete ${dirPath}:`, error.message);
  }
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
  let cssFiles = [];

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

      // Find CSS files from the manifest
      if (buildManifest.pages && buildManifest.pages['/_app']) {
        cssFiles = buildManifest.pages['/_app']
          .filter(file => file.endsWith('.css'))
          .map(file => file.replace('static/css/', ''));
      }

      console.log('📄 Build manifest parsed successfully:');
      console.log('   - Main JS:', mainJsFile);
      console.log('   - App JS:', appJsFile);
      console.log('   - Webpack JS:', webpackJsFile);
      console.log('   - CSS Files:', cssFiles);
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

    // Initialize the app with enhanced debugging
    window.onload = async function() {
      console.log('🚀 Mobile app initialization started...');
      console.log('📱 User Agent:', navigator.userAgent);
      console.log('🔌 Capacitor Available:', !!window.Capacitor);
      console.log('🌐 Location:', window.location.href);
      
      try {
        // Show loading indicator
        document.body.innerHTML = \`
          <div id="mobile-loading" style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: #f8fafc; font-family: system-ui;">
            <div style="text-align: center;">
              <div style="width: 60px; height: 60px; border: 4px solid #d3194f; border-top: 4px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
              <h2 style="color: #d3194f; margin: 0 0 10px;">Loading CUBS App...</h2>
              <p id="loading-status" style="color: #666; margin: 0;">Initializing...</p>
            </div>
          </div>
          <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        \`;
        
        const updateStatus = (status) => {
          const statusEl = document.getElementById('loading-status');
          if (statusEl) statusEl.textContent = status;
          console.log('📱 Status:', status);
        };

        updateStatus('Loading CSS files...');
        // Load CSS files first (dynamically from build manifest)
        const cssFiles = ${JSON.stringify(cssFiles)};

        for (const cssFile of cssFiles) {
          try {
            updateStatus(\`Loading CSS: \${cssFile}\`);
            await loadCSS('/_next/static/css/' + cssFile);
            console.log('✅ CSS loaded:', cssFile);
          } catch (error) {
            console.warn('⚠️ Failed to load CSS file:', cssFile, error);
          }
        }

        updateStatus('Loading JavaScript files...');
        // Load main build files with correct dynamic names
        updateStatus('Loading Webpack...');
        await loadScript('/_next/static/chunks/' + '${webpackJsFile}');
        console.log('✅ Webpack loaded');
        
        updateStatus('Loading Main App...');
        await loadScript('/_next/static/chunks/' + '${mainJsFile}');
        console.log('✅ Main loaded');
        
        updateStatus('Loading App Component...');
        await loadScript('/_next/static/chunks/pages/' + '${appJsFile}');
        console.log('✅ App loaded');
        
        updateStatus('Starting React App...');
        
        // Wait a moment for React to initialize
        setTimeout(() => {
          const loadingEl = document.getElementById('mobile-loading');
          if (loadingEl) loadingEl.remove();
        }, 1000);

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
        
        // Show error message to user
        document.body.innerHTML = \`
          <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; padding: 2rem; text-align: center; background: #f8fafc;">
            <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px;">
              <h2 style="color: #d3194f; margin-bottom: 1rem;">Loading Error</h2>
              <p style="color: #666; margin-bottom: 1rem;">The app failed to load. Please check your internet connection and try again.</p>
              <button onclick="window.location.reload()" style="background: #d3194f; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer;">
                Retry
              </button>
            </div>
          </div>
        \`;
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
  <div id="__next">
    <!-- Fallback content while app loads -->
    <div id="mobile-fallback" style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: #f8fafc; font-family: system-ui;">
      <div style="text-align: center;">
        <div style="width: 60px; height: 60px; border: 4px solid #d3194f; border-top: 4px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <h2 style="color: #d3194f; margin: 0 0 10px;">CUBS Employee Management</h2>
        <p style="color: #666; margin: 0;">Loading application...</p>
      </div>
    </div>
    <style>
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
  </div>

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



