# 🍎 iOS BUILD GUIDE

## 📱 **iOS BUILD PROCESS**

---

## **Step 1: Prerequisites**

### **Required Tools:**
- ✅ **Xcode 14+** installed
- ✅ **macOS Monterey or later**
- ✅ **Apple Developer Account**
- ✅ **iOS device or simulator**

---

## **Step 2: Add iOS Platform**

```bash
# Add iOS platform to Capacitor
npx cap add ios
```

---

## **Step 3: Open in Xcode**

```bash
# Open iOS project
npx cap open ios
```

---

## **Step 4: Configure Signing**

### **In Xcode:**
1. **Select project** in Project Navigator
2. **Select target** (your app)
3. **Signing & Capabilities tab**
4. **Select Team** (your Apple Developer account)
5. **Bundle Identifier**: `com.cubstechnical.admin`

---

## **Step 5: Build for Simulator**

### **In Xcode:**
1. **Select simulator** (iPhone 14, etc.)
2. **Product → Run** or press `Cmd + R`
3. **App launches** on simulator

### **Alternative Command Line:**
```bash
# Build for simulator
xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -configuration Debug build

# Install on simulator
xcrun simctl install booted ios/App/build/Debug-iphonesimulator/App.app
xcrun simctl launch booted com.cubstechnical.admin
```

---

## **Step 6: Build for Device**

### **In Xcode:**
1. **Connect iOS device**
2. **Select device** from dropdown
3. **Product → Run** or press `Cmd + R`
4. **Trust developer** on device if prompted

### **For App Store:**
1. **Product → Archive**
2. **Distribute App → App Store Connect**
3. **Upload** to App Store Connect

---

## **🔧 COMMON iOS ISSUES**

### **Signing Issues:**
```bash
# Clean and rebuild
Product → Clean Build Folder
Product → Build
```

### **Simulator Issues:**
```bash
# Reset simulator
xcrun simctl erase all
```

### **Bundle ID Issues:**
```bash
# Update bundle ID in Xcode
# Or update in capacitor.config.ts
```

---

## **📋 iOS BUILD CHECKLIST**

- ✅ **iOS platform added**
- ✅ **Xcode project opened**
- ✅ **Signing configured**
- ✅ **Bundle ID set**
- ✅ **Team selected**
- ✅ **Device/simulator selected**
- ✅ **Build successful**

---

## **🎯 EXPECTED iOS BUILD OUTPUT**

- **Simulator**: App runs on iPhone simulator
- **Device**: App installs and runs on physical iPhone
- **Archive**: `.xcarchive` file created for App Store

**Demo credentials work the same:** `info@cubstechnical.com` / `Admin@123456`
