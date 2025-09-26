#!/bin/bash

echo "🚀 Starting optimized production build..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next out node_modules/.cache

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Type check
echo "🔍 Running type check..."
npm run type-check

# Lint check
echo "🔍 Running lint check..."
npm run lint

# Build web app
echo "🌐 Building web application..."
npm run build:optimized

# Build mobile app
echo "📱 Building mobile application..."
npm run build:mobile:optimized

# Performance check
echo "📊 Running performance check..."
node scripts/performance-check.js

echo "✅ Production build complete!"
echo "📦 Web app: ./out"
echo "📱 Mobile app: ./android/app/build/outputs"
