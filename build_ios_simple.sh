#!/bin/bash

# Simple iOS build script for macOS

echo "🚀 iOS Build Script"
echo "=================="

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is for macOS only"
    echo "For Windows, use Xcode GUI:"
    echo "1. npx cap add ios"
    echo "2. npx cap open ios"
    echo "3. In Xcode: Product → Run"
    exit 1
fi

echo "📱 Adding iOS platform..."
npx cap add ios

echo "🔧 Syncing iOS..."
npx cap sync

echo "📂 Opening Xcode project..."
npx cap open ios

echo ""
echo "🎯 IN XCODE:"
echo "1. Select iOS Simulator (iPhone 14, etc.)"
echo "2. Product → Run (or press Cmd + R)"
echo "3. App will launch on simulator"
echo ""
echo "Demo credentials: info@cubstechnical.com / Admin@123456"
echo ""
echo "✅ iOS setup complete!"
