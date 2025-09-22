const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting mobile build process...');

try {
  // Step 1: Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next', { stdio: 'inherit' });
  }
  if (fs.existsSync('out')) {
    execSync('rm -rf out', { stdio: 'inherit' });
  }

  // Step 2: Build Next.js app
  console.log('📦 Building Next.js application...');
  execSync('npm run build', { stdio: 'inherit' });

  // Step 3: Copy build to out directory for Capacitor
  console.log('📁 Preparing build for Capacitor...');
  if (!fs.existsSync('out')) {
    fs.mkdirSync('out');
  }
  
  // Copy .next/static to out/static
  if (fs.existsSync('.next/static')) {
    execSync('cp -r .next/static out/', { stdio: 'inherit' });
  }
  
  // Copy public assets to out
  if (fs.existsSync('public')) {
    execSync('cp -r public/* out/', { stdio: 'inherit' });
  }

  // Step 4: Generate index.html for Capacitor
  console.log('📄 Generating index.html for Capacitor...');
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
  <script src="/_next/static/chunks/webpack.js"></script>
  <script src="/_next/static/chunks/main.js"></script>
  <script src="/_next/static/chunks/pages/_app.js"></script>
  <script src="/_next/static/chunks/pages/_error.js"></script>
  <script src="/_next/static/chunks/pages/index.js"></script>
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


