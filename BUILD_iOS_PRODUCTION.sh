#!/bin/bash

# ===================================================================
#   CUBS Admin - Production iOS Build Script
#   Configured for cubsgroups.com deployment
# ===================================================================

echo ""
echo "================================================="
echo "   CUBS Admin - Production iOS Build"
echo "   URL: https://cubsgroups.com"
echo "================================================="
echo ""

# Check if on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ ERROR: iOS development requires macOS"
    echo ""
    echo "Alternative options:"
    echo "1. Use Android build: ./BUILD_FINAL_WORKING.bat"
    echo "2. Use cloud build services (Expo EAS, App Center)"
    echo "3. Use macOS virtual machine"
    exit 1
fi

echo "✅ macOS: Detected"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js not found"
    echo "Please install from: https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js: $(node --version)"

# Check Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ ERROR: Xcode not found"
    echo "Please install Xcode from Mac App Store"
    exit 1
fi
echo "✅ Xcode: $(xcodebuild -version | head -n1)"

echo ""
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"

echo ""
echo "🏗️ Building web application for production..."
export NODE_ENV=production
export NEXT_PUBLIC_APP_URL=https://cubsgroups.com
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Web build failed"
    exit 1
fi
echo "✅ Web app built for production (cubsgroups.com)"

echo ""
echo "📱 Setting up iOS platform..."
npx cap add ios
echo "✅ iOS platform ready"

echo ""
echo "🔄 Syncing with Capacitor..."
npx cap sync ios
if [ $? -ne 0 ]; then
    echo "❌ Capacitor sync failed"
    exit 1
fi
echo "✅ Capacitor sync complete"

echo ""
echo "📂 Opening Xcode project..."
npx cap open ios

echo ""
echo "==============================================="
echo "✅ iOS PRODUCTION BUILD READY!"
echo "==============================================="
echo ""
echo "📱 App Name: CUBS Visa Management"
echo "📦 Bundle ID: com.cubstechnical.admin"
echo "🌐 Production URL: https://cubsgroups.com"
echo ""
echo "🎯 Demo Credentials:"
echo "Email: info@cubstechnical.com"
echo "Password: Admin@123456"
echo ""
echo "🔧 Next Steps in Xcode:"
echo "1. Select your development team"
echo "2. Choose iOS device or simulator"
echo "3. Product → Run (Cmd + R) for testing"
echo "4. Product → Archive for App Store"
echo ""
echo "✅ Your iOS app is ready for deployment!"
echo ""

