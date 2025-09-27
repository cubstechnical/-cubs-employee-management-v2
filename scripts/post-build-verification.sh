#!/bin/bash

# Post-build verification for Codemagic
echo "🔍 Post-build verification starting..."

# Check if out directory exists
if [ ! -d "out" ]; then
  echo "❌ out directory not found after build"
  exit 1
fi

# Check if index.html exists
if [ ! -f "out/index.html" ]; then
  echo "❌ index.html not found in out directory"
  exit 1
fi

# Check index.html content
echo "📄 Checking index.html content..."
if grep -q "__next" out/index.html; then
  echo "✅ index.html contains Next.js app root"
else
  echo "❌ index.html missing Next.js app root"
  exit 1
fi

if grep -q "window.Capacitor" out/index.html; then
  echo "✅ index.html contains Capacitor detection"
else
  echo "❌ index.html missing Capacitor detection"
  exit 1
fi

# Check for external URL references
if grep -q "cubsgroups.com" out/index.html; then
  echo "⚠️ index.html contains external URL references"
  echo "   This might cause redirects in the mobile app"
else
  echo "✅ index.html has no external URL references"
fi

# Check Capacitor sync results
if [ -d "ios/App/App/public" ]; then
  echo "✅ iOS Capacitor sync successful"
  echo "📁 iOS public directory contents:"
  ls -la ios/App/App/public/ | head -5
else
  echo "❌ iOS Capacitor sync failed - public directory not found"
  exit 1
fi

if [ -d "android/app/src/main/assets/public" ]; then
  echo "✅ Android Capacitor sync successful"
  echo "📁 Android public directory contents:"
  ls -la android/app/src/main/assets/public/ | head -5
else
  echo "❌ Android Capacitor sync failed - public directory not found"
  exit 1
fi

echo "✅ Post-build verification passed"
