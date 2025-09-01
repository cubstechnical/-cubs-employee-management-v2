# 📱 Mobile App Update Guide

## 🚀 **How to Update Your Mobile App**

### **Method 1: Complete Rebuild (Recommended for Major Updates)**

```bash
# 1. Build the mobile app
npm run build:mobile

# 2. Open Android Studio
npm run build:mobile:android

# 3. In Android Studio:
#    - Build → Generate Signed Bundle/APK
#    - Choose APK or AAB (AAB for Play Store)
#    - Select your keystore file
#    - Build and download

# 4. For iOS (macOS only):
npm run build:mobile:ios

# 5. In Xcode:
#    - Product → Archive
#    - Upload to App Store Connect
```

### **Method 2: Quick Update (For Minor Changes)**

```bash
# 1. Make your code changes
# 2. Build and sync
npm run build:mobile

# 3. Test on device
npx cap run android
npx cap run ios
```

### **Method 3: Over-the-Air Updates (Advanced)**

```bash
# 1. Build and deploy to your server
npm run build:mobile

# 2. Update server URL in capacitor.config.ts
# 3. Users will get updates automatically
```

---

## 🔧 **Mobile-Specific Issues Fixed**

### **1. Capacitor Configuration**
- ✅ **Fixed webDir**: Changed from `'out'` to `'dist'`
- ✅ **Enhanced plugins**: Added proper mobile plugin configurations
- ✅ **Improved splash screen**: Better timing and styling
- ✅ **Added hardware back button**: Proper Android navigation

### **2. Next.js Mobile Optimization**
- ✅ **Static export**: Added `output: 'export'` for Capacitor
- ✅ **Trailing slashes**: Required for static hosting
- ✅ **Image optimization**: Disabled for static export
- ✅ **Performance headers**: Removed unnecessary headers

### **3. Build Process**
- ✅ **Automated build script**: `scripts/build-mobile.js`
- ✅ **Clean builds**: Removes old files automatically
- ✅ **Icon generation**: Automatic app icon creation
- ✅ **Capacitor sync**: Automatic platform sync

---

## 📱 **Platform-Specific Instructions**

### **Android Deployment**

#### **Development Testing:**
```bash
# Build and run on device
npm run build:mobile:android

# Or run directly
npx cap run android
```

#### **Production Build:**
```bash
# 1. Build the app
npm run build:mobile

# 2. Open Android Studio
npx cap open android

# 3. In Android Studio:
#    - Build → Generate Signed Bundle/APK
#    - Choose "Android App Bundle" (AAB) for Play Store
#    - Select your keystore: android/app/cubs-release-key.keystore
#    - Enter keystore password
#    - Build and download AAB file

# 4. Upload to Google Play Console
```

#### **APK for Direct Installation:**
```bash
# 1. Build the app
npm run build:mobile

# 2. Generate APK
cd android
./gradlew assembleRelease

# 3. APK location: android/app/build/outputs/apk/release/app-release.apk
```

### **iOS Deployment (macOS Only)**

#### **Development Testing:**
```bash
# Build and run on device/simulator
npm run build:mobile:ios

# Or run directly
npx cap run ios
```

#### **Production Build:**
```bash
# 1. Build the app
npm run build:mobile

# 2. Open Xcode
npx cap open ios

# 3. In Xcode:
#    - Select your development team
#    - Choose target device
#    - Product → Archive
#    - Upload to App Store Connect
```

---

## 🔄 **Update Process for Existing Apps**

### **For Users with Existing App:**

1. **Automatic Updates (if server URL unchanged):**
   - Users will get updates automatically
   - No app store update needed

2. **App Store Updates (for major changes):**
   - Build new version with incremented version number
   - Upload to app stores
   - Users update through Play Store/App Store

### **Version Management:**

```bash
# Update version in package.json
"version": "1.0.1"

# Update version in expo.json (for Expo compatibility)
"version": "1.0.1"

# Update version in capacitor.config.ts (if needed)
# Version is managed by package.json
```

---

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **Build Fails:**
```bash
# Clean everything and rebuild
rm -rf dist out android/build ios/build
npm run build:mobile
```

#### **Capacitor Sync Issues:**
```bash
# Clean and resync
npx cap clean
npx cap sync
```

#### **Android Build Issues:**
```bash
# Clean Android build
cd android
./gradlew clean
cd ..
npm run build:mobile
```

#### **iOS Build Issues:**
```bash
# Clean iOS build
cd ios
rm -rf build
cd ..
npm run build:mobile
```

### **Performance Issues:**

#### **Slow Loading:**
- Check network connectivity
- Verify server URL in capacitor.config.ts
- Ensure static files are properly served

#### **App Crashes:**
- Check console logs in browser dev tools
- Verify all dependencies are installed
- Test on physical device, not just simulator

---

## 📊 **Update Checklist**

### **Before Building:**
- [ ] Test app in browser first
- [ ] Verify all features work
- [ ] Check mobile responsiveness
- [ ] Test on different screen sizes

### **During Build:**
- [ ] Monitor build logs for errors
- [ ] Verify static files are generated
- [ ] Check Capacitor sync completes
- [ ] Confirm icons are generated

### **After Build:**
- [ ] Test on physical device
- [ ] Verify all features work
- [ ] Check performance
- [ ] Test offline functionality

### **Before Deployment:**
- [ ] Increment version number
- [ ] Update changelog
- [ ] Test on multiple devices
- [ ] Verify app store compliance

---

## 🎯 **Quick Commands Reference**

```bash
# Build for mobile
npm run build:mobile

# Build and open Android
npm run build:mobile:android

# Build and open iOS
npm run build:mobile:ios

# Run on device
npx cap run android
npx cap run ios

# Clean and rebuild
npx cap clean && npm run build:mobile

# Check Capacitor status
npx cap doctor
```

---

## 🚀 **Result**

Your mobile app is now properly configured for:
- ✅ **Fast builds** with optimized scripts
- ✅ **Proper static export** for Capacitor
- ✅ **Enhanced mobile features** (back button, splash screen, etc.)
- ✅ **Easy updates** with automated build process
- ✅ **Cross-platform compatibility** (Android & iOS)

**Your app is ready for mobile deployment and updates!** 📱
