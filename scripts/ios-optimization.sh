#!/bin/bash

# iOS-specific optimizations for Codemagic
echo "🍎 iOS optimization starting..."

# Check iOS directory
if [ ! -d "ios" ]; then
  echo "❌ iOS directory not found"
  exit 1
fi

# Check iOS Capacitor config
if [ -f "ios/App/App/capacitor.config.json" ]; then
  echo "📱 Checking iOS Capacitor config..."
  
  # Check for server URL in iOS config
  if grep -q '"server"' ios/App/App/capacitor.config.json; then
    echo "❌ iOS config has server configuration - this will cause redirects"
    echo "   The server config should be removed for local mobile apps"
    exit 1
  else
    echo "✅ iOS config has no server configuration"
  fi
else
  echo "❌ iOS Capacitor config not found"
  exit 1
fi

# Check for iOS-specific files
echo "🔍 Checking iOS-specific files..."
if [ -f "lib/utils/iosErrorHandler.ts" ]; then
  echo "✅ Found lib/utils/iosErrorHandler.ts"
else
  echo "❌ Missing lib/utils/iosErrorHandler.ts"
  exit 1
fi

if [ -f "components/ios/IOSLoadingScreen.tsx" ]; then
  echo "✅ Found components/ios/IOSLoadingScreen.tsx"
else
  echo "❌ Missing components/ios/IOSLoadingScreen.tsx"
  exit 1
fi

if [ -f "lib/utils/mobileErrorRecovery.ts" ]; then
  echo "✅ Found lib/utils/mobileErrorRecovery.ts"
else
  echo "❌ Missing lib/utils/mobileErrorRecovery.ts"
  exit 1
fi

# Check CocoaPods
if [ -f "ios/App/Podfile" ]; then
  echo "✅ Podfile found"
else
  echo "❌ Podfile not found"
  exit 1
fi

echo "✅ iOS optimization completed"
