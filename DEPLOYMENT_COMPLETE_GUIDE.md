# 🚀 CUBS Admin - Complete Deployment Guide

## Quick Start (TL;DR)

### For Android (Windows/Linux/macOS):
```bash
# Run this script for a complete Android build
.\build_android_complete.bat
```

### For iOS (macOS only):
```bash
# Run this script for iOS setup
./build_ios_complete.sh
```

---

## 📋 Prerequisites

### For Android Development:
1. **Node.js** (16.x or 18.x) - [Download](https://nodejs.org/)
2. **Java JDK** (17 or 21) - [Download](https://adoptium.net/)
3. **Android Studio** - [Download](https://developer.android.com/studio)

### For iOS Development:
1. **macOS** (required - no alternatives)
2. **Xcode** (from Mac App Store)
3. **Node.js** (16.x or 18.x)
4. **Xcode Command Line Tools**

---

## 🔧 Environment Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=your_email
B2_APPLICATION_KEY_ID=your_b2_key_id
B2_APPLICATION_KEY=your_b2_key
B2_BUCKET_NAME=your_bucket_name
B2_ENDPOINT=your_b2_endpoint
B2_BUCKET_ID=your_bucket_id
```

---

## 📱 Android Deployment

### Method 1: Automated Script (Recommended)
```bash
# Windows
.\build_android_complete.bat

# Linux/macOS  
chmod +x build_android_complete.sh
./build_android_complete.sh
```

### Method 2: Manual Steps
```bash
# 1. Build the web app
npm run build

# 2. Add Android platform (if not exists)
npx cap add android

# 3. Sync with Capacitor
npx cap copy android
npx cap sync android

# 4. Open Android Studio
npm run cap:android

# 5. In Android Studio:
#    - Select 'app' module
#    - Click Run (▶️) or Ctrl+R
#    - Choose device/emulator
```

### Method 3: Command Line Build
```bash
# After steps 1-3 above:
cd android
./gradlew assembleDebug

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🍎 iOS Deployment

### Prerequisites Check
```bash
# Check if on macOS
uname -a

# Check Xcode installation
xcodebuild -version

# Install Xcode Command Line Tools (if needed)
xcode-select --install
```

### Method 1: Automated Script (Recommended)
```bash
chmod +x build_ios_complete.sh
./build_ios_complete.sh
```

### Method 2: Manual Steps
```bash
# 1. Build the web app
npm run build

# 2. Add iOS platform (if not exists)
npx cap add ios

# 3. Sync with Capacitor
npx cap copy ios
npx cap sync ios

# 4. Open Xcode
npx cap open ios

# 5. In Xcode:
#    - Select 'App' target
#    - Choose iPhone simulator or device
#    - Click Run (▶️) or Cmd+R
```

---

## 🔍 Troubleshooting

### Android Issues

#### Java Version Problems
```bash
# Check Java version
java -version

# Set JAVA_HOME (Windows)
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot

# Set JAVA_HOME (Linux/macOS)
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
```

#### Gradle Build Failures
```bash
# Clean and retry
cd android
./gradlew clean
./gradlew assembleDebug --stacktrace
```

#### Capacitor Sync Issues
```bash
# Force re-sync
npx cap clean android
npx cap copy android
npx cap sync android
```

### iOS Issues

#### Xcode Signing Problems
1. Open Xcode
2. Select "App" target
3. Go to "Signing & Capabilities"
4. Select your Apple Developer account
5. Xcode will auto-generate provisioning profiles

#### Simulator Not Available
```bash
# List available simulators
xcrun simctl list devices

# Open Simulator app
open -a Simulator
```

#### Build Path Issues
```bash
# Clear derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Clean build folder
# In Xcode: Product → Clean Build Folder (Cmd+Shift+K)
```

---

## 📦 Production Builds

### Android Release Build
```bash
# Generate signed APK
cd android
./gradlew assembleRelease

# Generate AAB for Play Store
./gradlew bundleRelease
```

### iOS Release Build
1. Open Xcode
2. Select "Any iOS Device" or connected device
3. Product → Archive
4. Upload to App Store Connect

---

## 🌐 Alternative Deployment Options

### Web Deployment (Vercel/Netlify)
```bash
# Build for web
npm run build

# Deploy to Vercel
npx vercel

# Deploy to Netlify
npx netlify deploy --prod --dir=out
```

### Cloud Build Services
1. **Expo EAS Build** - Support for React Native/Capacitor
2. **App Center** - Microsoft's mobile DevOps
3. **Codemagic** - CI/CD for mobile apps
4. **Bitrise** - Mobile-first CI/CD

---

## 🎯 Demo & Testing

### Demo Credentials
- **Email:** info@cubstechnical.com
- **Password:** Admin@123456

### Test on Device
```bash
# Android - Install APK directly
adb install android/app/build/outputs/apk/debug/app-debug.apk

# iOS - Install via Xcode or TestFlight
```

---

## 📊 Build Output Locations

### Android
- **Debug APK:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK:** `android/app/build/outputs/apk/release/app-release.apk`
- **AAB Bundle:** `android/app/build/outputs/bundle/release/app-release.aab`

### iOS
- **App Bundle:** `ios/App/build/Build/Products/Debug-iphonesimulator/App.app`
- **Archive:** Created through Xcode → Product → Archive

---

## ✅ Success Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] Web app builds successfully (`npm run build`)
- [ ] Capacitor sync works (`npx cap sync`)
- [ ] Android/iOS platforms added
- [ ] Apps run on simulator/device
- [ ] Demo login works
- [ ] Core features accessible

---

## 🆘 Support

If you encounter issues:

1. **Check logs:** Look for error messages in terminal/Xcode console
2. **Clean builds:** Delete `node_modules`, `out`, and rebuild
3. **Update dependencies:** `npm update`
4. **Check platform versions:** Ensure Android SDK/Xcode are up to date
5. **Environment variables:** Verify all required env vars are set

---

## 🚀 Quick Commands Reference

```bash
# Complete Android build
.\build_android_complete.bat

# Complete iOS build (macOS only)
./build_ios_complete.sh

# Individual steps
npm run build                 # Build Next.js
npx cap sync                  # Sync with Capacitor
npm run cap:android          # Open Android Studio
npm run cap:ios              # Open Xcode (macOS only)

# Testing
npm run dev                  # Development server
npm run lint                 # Check code quality
npm run type-check           # TypeScript validation
```

**Ready to deploy! 🎉**
