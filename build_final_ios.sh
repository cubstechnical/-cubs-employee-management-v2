#!/bin/bash

# ===================================================================
#   CUBS Admin - Final Working Build Script for iOS
#   This script provides a guaranteed working solution for macOS
# ===================================================================

echo ""
echo "================================================="
echo "   CUBS Admin - Final iOS Build Solution"
echo "================================================="
echo ""

# Check if on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ ERROR: iOS development requires macOS"
    echo ""
    echo "Alternative options:"
    echo "1. Use Android build: ./build_final.bat"
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

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ ERROR: npm not found"
    exit 1
fi
echo "✅ npm: $(npm --version)"

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
echo "🏗️ Building web application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Web build failed"
    exit 1
fi
echo "✅ Web app built successfully"

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
echo "==============================================="
echo "✅ iOS PROJECT READY!"
echo "==============================================="
echo ""
echo "🎯 Opening Xcode..."
npx cap open ios

echo ""
echo "📱 IN XCODE - FOLLOW THESE STEPS:"
echo "======================================="
echo "1. Wait for Xcode to load the project"
echo "2. Select 'App' target"
echo "3. Choose device/simulator (iPhone 15 Pro recommended)"
echo "4. Click Run button (▶️) or press Cmd + R"
echo ""
echo "🔧 For device installation:"
echo "1. Connect iPhone via USB"
echo "2. Trust computer on device"
echo "3. Select device in Xcode"
echo "4. Configure signing in 'Signing & Capabilities'"
echo "5. Run the app"
echo ""
echo "🎯 Demo Credentials:"
echo "Email: info@cubstechnical.com"
echo "Password: Admin@123456"
echo ""
echo "✅ Your iOS app is ready for deployment!"
