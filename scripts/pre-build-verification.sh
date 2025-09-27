#!/bin/bash

# Pre-build verification for Codemagic
echo "🔍 Pre-build verification starting..."

# Check Node.js version
echo "📦 Node.js version:"
node --version

# Check npm version
echo "📦 npm version:"
npm --version

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ package.json not found - wrong directory"
  exit 1
fi

# Check if mobile fix script exists
if [ ! -f "scripts/fix-mobile-app.js" ]; then
  echo "❌ Mobile fix script not found"
  exit 1
fi

# Check if Capacitor config exists
if [ ! -f "capacitor.config.ts" ]; then
  echo "❌ Capacitor config not found"
  exit 1
fi

# Verify Capacitor config doesn't have server URL
if grep -q "url: 'https://" capacitor.config.ts; then
  echo "❌ Capacitor config still has external URL - this will cause redirects"
  echo "   The server config should be commented out for local mobile apps"
  exit 1
fi

echo "✅ Pre-build verification passed"
