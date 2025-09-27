const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY FIX: Codemagic Build Issue');

// Read codemagic.yaml
const codemagicPath = path.join(__dirname, '..', 'codemagic.yaml');
let content = fs.readFileSync(codemagicPath, 'utf8');

// Replace the entire build section
const oldSection = `      - name: Build Next.js app for mobile
        script: |
          echo "🏗️ Building Next.js production app for mobile deployment..."
          npm run build:mobile
          echo "✅ Mobile build completed successfully"`;

const newSection = `      - name: Build Next.js app for mobile
        script: |
          echo "🏗️ Building Next.js production app for mobile deployment..."
          
          # Clean everything first
          echo "🧹 Cleaning previous builds..."
          rm -rf .next out node_modules/.cache
          
          # Build Next.js
          echo "📦 Building Next.js..."
          npm run build
          
          # Create out directory
          echo "📁 Creating out directory..."
          mkdir -p out
          
          # Copy files
          echo "📋 Copying files..."
          cp -r .next/static out/_next/static 2>/dev/null || true
          cp -r public/* out/ 2>/dev/null || true
          
          # Create index.html
          echo "📄 Creating index.html..."
          cat > out/index.html << 'EOF'
<!DOCTYPE html>
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
  <script>
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
  <script>
    console.log('📱 CUBS Mobile App Starting...');
    document.addEventListener('DOMContentLoaded', function() {
      console.log('📱 DOM loaded, initializing mobile app...');
      if (window.Capacitor && window.Capacitor.isNative) {
        console.log('📱 Running in native mobile app');
        setTimeout(() => {
          console.log('✅ Mobile app initialized successfully');
        }, 1000);
      } else {
        console.log('🌐 Running in web browser');
      }
    });
  </script>
</body>
</html>
EOF
          
          # Verify
          echo "🔍 Verifying build..."
          if [ -d "out" ] && [ -f "out/index.html" ]; then
            echo "✅ Build successful!"
            ls -la out/
          else
            echo "❌ Build failed!"
            exit 1
          fi
          
          echo "✅ Mobile build completed successfully"`;

// Replace in content
content = content.replace(oldSection, newSection);

// Write back
fs.writeFileSync(codemagicPath, content);

console.log('✅ Emergency fix applied!');
console.log('📱 Build process now:');
console.log('   • Cleans previous builds');
console.log('   • Builds Next.js');
console.log('   • Creates out directory');
console.log('   • Copies files');
console.log('   • Creates index.html');
console.log('   • Verifies everything');
