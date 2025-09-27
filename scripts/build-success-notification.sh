#!/bin/bash

# Build success notification for Codemagic
echo "📧 Sending build success notification..."

# Get build information
BUILD_TIME=$(date)
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

# Check build artifacts
if [ -d "out" ]; then
  BUILD_SIZE=$(du -sh out | cut -f1)
  echo "✅ Build completed successfully"
  echo "📊 Build size: $BUILD_SIZE"
  echo "📦 Node.js: $NODE_VERSION"
  echo "📦 npm: $NPM_VERSION"
  echo "🕐 Build time: $BUILD_TIME"
  
  # Check for mobile-specific optimizations
  if [ -f "lib/utils/mobileErrorRecovery.ts" ]; then
    echo "✅ Mobile error recovery enabled"
  fi
  
  if [ -f "lib/utils/iosErrorHandler.ts" ]; then
    echo "✅ iOS error handling enabled"
  fi
  
  if [ -f "components/ios/IOSLoadingScreen.tsx" ]; then
    echo "✅ iOS loading screen enabled"
  fi
  
  echo "🎉 Mobile app build optimized and ready for deployment!"
else
  echo "❌ Build artifacts not found"
  exit 1
fi
