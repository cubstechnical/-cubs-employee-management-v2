# 🚀 CUBS Admin - Production Deployment Guide

## 📱 Mobile App Deployment for cubsgroups.com

This guide covers deploying the CUBS Visa Management mobile app to Android and iOS, configured to connect to **https://cubsgroups.com** instead of localhost.

---

## ✅ **Configuration Changes Made**

### 🔧 **Capacitor Configuration**
- **File**: `capacitor.config.ts`
- **Changes**:
  - Set `server.url` to `https://cubsgroups.com`
  - Enabled HTTPS with `cleartext: false`
  - Enhanced iOS configuration for production

### 🌐 **App Configuration**
- **File**: `app/layout.tsx`
- **Changes**: Updated metadata base URL to `https://cubsgroups.com`

### ⚙️ **Environment Configuration**
- **File**: `env.example`
- **Changes**: Set default `NEXT_PUBLIC_APP_URL` to `https://cubsgroups.com`

### 🏗️ **Build Configuration**
- **File**: `next.config.js`
- **Changes**: Added `cubsgroups.com` to allowed image domains

---

## 🤖 **Android Deployment**

### **Build Command**
```bash
./BUILD_FINAL_WORKING.bat
```

### **What It Does**
1. ✅ Installs dependencies
2. ✅ Builds Next.js app for production with `cubsgroups.com`
3. ✅ Sets up Capacitor Android platform
4. ✅ Syncs web assets to Android
5. ✅ Builds APK file

### **Output**
- **APK Location**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Package**: `com.cubstechnical.admin`
- **Production URL**: `https://cubsgroups.com`

### **Installation**
1. Enable Developer Options on Android device
2. Enable USB Debugging
3. Install APK: `adb install app-debug.apk`

---

## 🍎 **iOS Deployment**

### **Prerequisites**
- ✅ macOS with Xcode installed
- ✅ Apple Developer Account
- ✅ iOS device or simulator

### **Build Command**
```bash
./BUILD_iOS_PRODUCTION.sh
```

### **What It Does**
1. ✅ Checks macOS and Xcode installation
2. ✅ Installs dependencies
3. ✅ Builds Next.js app for production with `cubsgroups.com`
4. ✅ Adds iOS platform to Capacitor
5. ✅ Syncs web assets to iOS
6. ✅ Opens Xcode project

### **Xcode Steps**
1. Select your development team
2. Choose target device/simulator
3. **Testing**: Product → Run (Cmd + R)
4. **App Store**: Product → Archive

---

## 🔐 **Demo Credentials**

For testing the deployed app:
- **Email**: `info@cubstechnical.com`
- **Password**: `Admin@123456`

---

## 📋 **Production Checklist**

### **Before Building**
- [ ] Ensure your production server at `cubsgroups.com` is running
- [ ] Verify all environment variables are set correctly
- [ ] Test the web app at `https://cubsgroups.com`

### **Android**
- [ ] Run `./BUILD_FINAL_WORKING.bat`
- [ ] Test APK on physical device
- [ ] Verify app connects to `cubsgroups.com`
- [ ] Test all core features (login, documents, employees)

### **iOS** (macOS only)
- [ ] Run `./BUILD_iOS_PRODUCTION.sh`
- [ ] Configure signing in Xcode
- [ ] Test on iOS simulator/device
- [ ] Verify app connects to `cubsgroups.com`
- [ ] Test all core features

### **App Store Preparation**
- [ ] Update version numbers
- [ ] Generate app icons and screenshots
- [ ] Prepare app store listings
- [ ] Create release builds (not debug)

---

## 🛠️ **Key Configuration Files**

| File | Purpose | Key Settings |
|------|---------|-------------|
| `capacitor.config.ts` | Main Capacitor config | `server.url: 'https://cubsgroups.com'` |
| `app/layout.tsx` | App metadata | `metadataBase: new URL('https://cubsgroups.com')` |
| `next.config.js` | Next.js build config | `domains: ['cubsgroups.com']` |
| `BUILD_FINAL_WORKING.bat` | Android build script | Sets production environment |
| `BUILD_iOS_PRODUCTION.sh` | iOS build script | Sets production environment |

---

## 🚨 **Important Notes**

1. **Production Server**: Ensure `https://cubsgroups.com` is accessible and serving the app
2. **HTTPS Required**: Mobile apps require HTTPS for production (configured)
3. **Environment Variables**: Set all required env vars on your production server
4. **CORS**: Ensure your API endpoints allow requests from mobile apps
5. **SSL Certificate**: Verify SSL certificate is valid for `cubsgroups.com`

---

## 📞 **Support**

If you encounter issues:
1. Check that `https://cubsgroups.com` is accessible from a browser
2. Verify environment variables are set correctly
3. Test the web app before building mobile versions
4. Check build logs for specific error messages

---

## ✅ **Deployment Complete**

Your mobile apps are now configured to connect to `https://cubsgroups.com` for production deployment. Both Android and iOS builds will use this production URL instead of localhost.

The apps are ready for:
- ✅ **Testing** on real devices
- ✅ **Internal distribution**
- ✅ **App Store submission** (after final preparations)
