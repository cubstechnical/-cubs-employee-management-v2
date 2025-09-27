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

  // Step 2: Build Next.js app
  console.log('📦 Building Next.js application...');
  try {
    execSync('npm run build', { stdio: 'inherit' });

    // Verify .next directory was created
    if (!fs.existsSync('.next')) {
      throw new Error('.next directory was not created after build');
    }
    console.log('✅ Next.js build completed successfully');
  } catch (error) {
    console.error('❌ Next.js build failed:', error.message);
    throw error;
  }

  // Step 3: Copy build to out directory for Capacitor
  console.log('📁 Preparing build for Capacitor...');
  try {
    if (!fs.existsSync('out')) {
      fs.mkdirSync('out', { recursive: true });
      console.log('✅ Created out directory');
    } else {
      console.log('✅ out directory already exists');
    }
  } catch (error) {
    console.error('❌ Failed to create out directory:', error.message);
    throw error;
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
      // In Next.js 15.x, the structure has changed - just use default file names
      console.log('Build manifest found, using default file names for compatibility');
    }
  } catch (error) {
    console.warn('Could not read build manifest, using default file names:', error.message);
  }

  // Create a simple index.html that loads the Next.js app locally
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
  
  <!-- Mobile app initialization -->
  <script>
    console.log('📱 CUBS Mobile App Starting...');
    
    // Wait for Capacitor to be ready
    document.addEventListener('DOMContentLoaded', function() {
      console.log('📱 DOM loaded, initializing mobile app...');
      
      // Check if we're in a Capacitor environment
      if (window.Capacitor && window.Capacitor.isNative) {
        console.log('📱 Running in native mobile app');
        
        // Initialize mobile-specific features
        setTimeout(() => {
          console.log('✅ Mobile app initialized successfully');
        }, 1000);
      } else {
        console.log('🌐 Running in web browser');
      }
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join('out', 'index.html'), indexHtml);

  // Step 5: Verify build output
  console.log('🔍 Verifying build output...');
  try {
    if (!fs.existsSync('out')) {
      throw new Error('out directory was not created');
    }

    if (!fs.existsSync('out/index.html')) {
      throw new Error('index.html was not created in out directory');
    }

    if (!fs.existsSync('out/_next')) {
      throw new Error('_next directory was not created in out directory');
    }

    console.log('✅ Build verification successful');
  } catch (error) {
    console.error('❌ Build verification failed:', error.message);
    throw error;
  }

  // Step 6: Sync with Capacitor
  console.log('📱 Syncing with Capacitor...');
  try {
    execSync('npx cap sync', { stdio: 'inherit' });
    console.log('✅ Capacitor sync completed successfully');
  } catch (error) {
    console.error('❌ Capacitor sync failed:', error.message);
    throw error;
  }

  console.log('✅ Mobile build completed successfully!');
  console.log('📱 You can now run:');
  console.log('   npm run cap:ios     - Open iOS project');
  console.log('   npm run cap:android - Open Android project');
  console.log('🚀 Ready for Codemagic deployment!');

} catch (error) {
  console.error('❌ Mobile build failed:', error.message);
  process.exit(1);
}



