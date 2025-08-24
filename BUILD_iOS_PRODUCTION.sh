#!/bin/bash

# ===================================================================
#   iOS PRODUCTION BUILD SCRIPT - macOS ONLY
#   This script builds the iOS app for production deployment
# ===================================================================

echo ""
echo "====================================================="
echo "  iOS PRODUCTION BUILD - CUBS Visa Management"
echo "====================================================="
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script must be run on macOS with Xcode installed"
    echo "💡 For Windows/Linux, use the Android build script instead"
    exit 1
fi

# Check for Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode not found - install Xcode from the App Store"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found - install from https://nodejs.org/"
    exit 1
fi

echo "✅ macOS: Available"
echo "✅ Xcode: Available"
echo "✅ Node.js: Available"

echo ""
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🏗️ Building web application for production (cubsgroups.com)..."
export NODE_ENV=production
export NEXT_PUBLIC_APP_URL=https://cubsgroups.com
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Web build failed"
    exit 1
fi

echo ""
echo "📱 Setting up Capacitor for iOS..."
if [ ! -d "ios" ]; then
    npx cap add ios
fi

echo ""
echo "🎨 Generating iOS app icons from assets/appicon.png..."
node scripts/generate-ios-icons.js
if [ $? -ne 0 ]; then
    echo "❌ Icon generation failed"
    exit 1
fi

echo ""
echo "🔄 Syncing iOS project..."
npx cap sync ios
if [ $? -ne 0 ]; then
    echo "❌ iOS sync failed"
    exit 1
fi

echo ""
echo "🍎 Installing CocoaPods dependencies..."
cd ios/App
if command -v pod &> /dev/null; then
    pod install
    if [ $? -ne 0 ]; then
        echo "❌ CocoaPods installation failed"
        cd ../..
        exit 1
    fi
else
    echo "⚠️  CocoaPods not found - install with: sudo gem install cocoapods"
    echo "💡 You can still open the project in Xcode manually"
fi
cd ../..

echo ""
echo "=============================================="
echo "✅ iOS BUILD SETUP COMPLETE!"
echo "=============================================="
echo ""
echo "📱 App Name: CUBS Visa Management"
echo "📦 Bundle ID: com.cubstechnical.admin"
echo "🌐 Production URL: https://cubsgroups.com"
echo "🎯 Version: 1.0"
echo ""
echo "📋 Next Steps:"
echo "1. Open Xcode: npx cap open ios"
echo "2. Select your development team in project settings"
echo "3. Choose target device (iPhone/iPad)"
echo "4. Build and run (⌘+R)"
echo "5. Archive for App Store (Product > Archive)"
echo ""
echo "🔧 Build Commands:"
echo "• Development: npx cap run ios"
echo "• Open in Xcode: npx cap open ios"
echo "• Clean build: cd ios/App && xcodebuild clean"
echo ""
echo "📱 App Store Deployment:"
echo "1. Archive the app in Xcode"
echo "2. Upload to App Store Connect"
echo "3. Submit for review"
echo ""
echo "✅ Your iOS app is ready for development and deployment!"
echo ""

