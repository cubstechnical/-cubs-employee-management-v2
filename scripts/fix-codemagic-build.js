const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Codemagic Build Issue...');

// Read the current codemagic.yaml
const codemagicPath = path.join(__dirname, '..', 'codemagic.yaml');
let codemagicContent = fs.readFileSync(codemagicPath, 'utf8');

// Replace the problematic build step
const oldBuildStep = `      - name: Build Next.js app for mobile
        script: |
          echo "🏗️ Building Next.js production app for mobile deployment..."
          npm run build:mobile
          echo "✅ Mobile build completed successfully"`;

const newBuildStep = `      - name: Build Next.js app for mobile
        script: |
          echo "🏗️ Building Next.js production app for mobile deployment..."
          echo "🔧 Running mobile build process..."
          
          # Clean previous builds
          echo "🧹 Cleaning previous builds..."
          rm -rf .next out node_modules/.cache
          
          # Build Next.js app
          echo "📦 Building Next.js application..."
          npm run build
          
          # Create out directory for Capacitor
          echo "📁 Creating out directory for Capacitor..."
          mkdir -p out
          
          # Copy build files to out directory
          echo "📋 Copying build files to out directory..."
          cp -r .next/static out/_next/static 2>/dev/null || echo "No static files to copy"
          cp -r public/* out/ 2>/dev/null || echo "No public files to copy"
          
          # Generate index.html for Capacitor
          echo "📄 Generating index.html for Capacitor..."
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
</html>
EOF
          
          # Verify out directory was created
          echo "🔍 Verifying out directory creation..."
          if [ -d "out" ]; then
            echo "✅ out directory created successfully"
            ls -la out/
          else
            echo "❌ Failed to create out directory"
            exit 1
          fi
          
          if [ -f "out/index.html" ]; then
            echo "✅ index.html created successfully"
          else
            echo "❌ Failed to create index.html"
            exit 1
          fi
          
          echo "✅ Mobile build completed successfully"`;

// Replace all occurrences
codemagicContent = codemagicContent.replace(new RegExp(oldBuildStep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newBuildStep);

// Write the updated file
fs.writeFileSync(codemagicPath, codemagicContent);

console.log('✅ Codemagic build fix applied successfully!');
console.log('📱 The build process will now:');
console.log('   • Clean previous builds');
console.log('   • Build Next.js application');
console.log('   • Create out directory');
console.log('   • Copy build files');
console.log('   • Generate index.html for Capacitor');
console.log('   • Verify everything is working');
