#!/bin/bash

# Comprehensive iOS Build Script - Working Solution
echo "================================================="
echo "   CUBS Admin - iOS Build Script (Complete)"
echo "================================================="

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ ERROR: This script requires macOS for iOS development"
    echo ""
    echo "For Windows/Linux users:"
    echo "1. Use Android build: ./build_android_complete.bat"
    echo "2. Or use cloud iOS build services like EAS Build"
    echo "3. Or use a macOS virtual machine"
    exit 1
fi

echo "✅ Running on macOS"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ ERROR: npm is not available"
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ ERROR: Xcode is not installed"
    echo "Please install Xcode from the Mac App Store"
    exit 1
fi

echo "✅ Xcode version: $(xcodebuild -version | head -n1)"

# Check if Xcode command line tools are installed
if ! xcode-select -p &> /dev/null; then
    echo "❌ ERROR: Xcode command line tools not installed"
    echo "Run: xcode-select --install"
    exit 1
fi

echo "✅ Xcode command line tools installed"

echo ""
echo "📦 Step 1: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to install dependencies"
    exit 1
fi

echo ""
echo "🏗️  Step 2: Building Next.js app..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to build Next.js app"
    echo "Make sure your .env file is configured properly"
    exit 1
fi

echo ""
echo "📱 Step 3: Adding iOS platform (if not exists)..."
npx cap add ios
if [ $? -ne 0 ]; then
    echo "⚠️  iOS platform might already exist"
fi

echo ""
echo "🔄 Step 4: Syncing with Capacitor..."
npx cap copy ios
npx cap sync ios
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to sync with Capacitor"
    exit 1
fi

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
echo "1. Wait for Xcode to fully load the project"
echo "2. Select 'App' target in the project navigator"
echo "3. Choose your device/simulator:"
echo "   • iPhone 15 Pro (Simulator) - Recommended"
echo "   • Or connect your iPhone via USB"
echo "4. Click the ▶️ 'Run' button (or Cmd + R)"
echo ""
echo "🔧 If you encounter signing issues:"
echo "1. Select the 'App' target"
echo "2. Go to 'Signing & Capabilities'"
echo "3. Choose your development team"
echo "4. Xcode will auto-generate provisioning profiles"
echo ""
echo "🎯 Demo Credentials:"
echo "Email: info@cubstechnical.com"
echo "Password: Admin@123456"
echo ""
echo "✅ iOS setup complete!"
echo "The app will launch once you press Run in Xcode."
