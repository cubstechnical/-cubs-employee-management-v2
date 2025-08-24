# 🚀 COMPLETE ANDROID DEVELOPMENT COMMANDS

## 📱 **FULL COMMAND SEQUENCE TO RUN ON VIRTUAL DEVICE**

---

## **Phase 1: Build & Start Development Server**

### **Terminal Commands:**
```bash
# 1. Build the Next.js app for production
npm run build

# 2. Start development server (serves to Android app)
npm run dev

# Keep this running in background - it serves your web app to the Android app
# The Android app will connect to http://localhost:3002
```

---

## **Phase 2: Android Studio Setup Commands**

### **In Android Studio Terminal (View → Tool Windows → Terminal):**
```bash
# 1. Navigate to android directory
cd android

# 2. Clean previous builds
./gradlew clean

# 3. Sync project (if needed)
./gradlew build --refresh-dependencies

# 4. Create debug build
./gradlew assembleDebug
```

---

## **Phase 3: Virtual Device Management**

### **Commands for Virtual Device:**
```bash
# 1. List available devices
./gradlew devices

# 2. Create AVD (Android Virtual Device)
echo "no" | avdmanager create avd -n test -k "system-images;android-33;google_apis;x86_64"

# 3. Start emulator
emulator -avd test

# 4. List running devices
adb devices
```

---

## **Phase 4: Run App Commands**

### **In Android Studio:**
```bash
# 1. Run app on connected device
./gradlew installDebug
./gradlew runDebug

# 2. Alternative: Use Android Studio GUI
# - Run → Run 'app'
# - Select virtual device from list
```

### **Direct ADB Commands:**
```bash
# Install APK on device
adb install app/build/outputs/apk/debug/app-debug.apk

# Launch app
adb shell am start -n com.cubstechnical.admin/.MainActivity

# View logs
adb logcat -s "CUBS"
```

---

## **📋 COMPLETE WORKFLOW - STEP BY STEP**

### **Step 1: Start Development Environment**
```bash
# Terminal 1: Start Next.js dev server
npm run dev
# Server runs on http://localhost:3002
```

### **Step 2: Open Android Studio**
```bash
# Open Android Studio GUI
npx cap open android
```

### **Step 3: In Android Studio Terminal**
```bash
cd android

# Build debug version
./gradlew assembleDebug

# Create and start virtual device
echo "no" | avdmanager create avd -n cubs_test -k "system-images;android-33;google_apis;x86_64"
emulator -avd cubs_test
```

### **Step 4: Run the App**
```bash
# In Android Studio: Run → Run 'app'
# Or use terminal:
./gradlew installDebug
./gradlew runDebug
```

---

## **🎯 QUICK START COMMANDS (COPY & PASTE)**

### **For First Time Setup:**
```bash
# 1. Build and start dev server
npm run build && npm run dev

# 2. In new terminal: Open Android Studio
npx cap open android

# 3. In Android Studio terminal:
cd android
./gradlew assembleDebug

# 4. Create virtual device (one time)
echo "no" | avdmanager create avd -n cubs_test -k "system-images;android-33;google_apis;x86_64"

# 5. Start emulator
emulator -avd cubs_test

# 6. Run app
./gradlew installDebug && ./gradlew runDebug
```

### **For Subsequent Runs:**
```bash
# Start dev server
npm run dev

# In Android Studio terminal:
cd android
emulator -avd cubs_test
./gradlew installDebug && ./gradlew runDebug
```

---

## **🔧 TROUBLESHOOTING COMMANDS**

### **If Build Fails:**
```bash
# Clean everything
cd android
./gradlew clean
./gradlew build --refresh-dependencies
./gradlew assembleDebug
```

### **If Emulator Issues:**
```bash
# Kill existing emulators
adb kill-server
adb start-server

# List available AVDs
emulator -list-avds

# Start specific emulator
emulator -avd cubs_test -no-snapshot-load
```

### **If App Won't Start:**
```bash
# Check device connection
adb devices

# Check app installation
adb shell pm list packages | grep cubs

# View app logs
adb logcat -s "CUBS" -v time
```

---

## **📱 VIRTUAL DEVICE OPTIMIZATION**

### **Create Optimized AVD:**
```bash
# Create with hardware acceleration
avdmanager create avd -n cubs_optimized -k "system-images;android-33;google_apis;x86_64" --device "pixel_4"

# Start with optimized settings
emulator -avd cubs_optimized -no-snapshot-load -gpu swiftshader_indirect
```

### **Performance Tips:**
```bash
# Enable hardware acceleration in BIOS (VT-x/AMD-V)
# Allocate more RAM to emulator (4GB+)
# Use x86_64 system image for better performance
# Enable "Use Host GPU" in emulator settings
```

---

## **📞 SUPPORT COMMANDS**

### **Get Help:**
```bash
# Check Gradle version
./gradlew --version

# Check Android SDK
echo $ANDROID_HOME

# Check connected devices
adb devices

# Get app info
adb shell dumpsys package com.cubstechnical.admin
```

---

## **🎯 FINAL COMMAND SUMMARY**

**To run your app on Android virtual device:**

1. **Terminal 1:** `npm run dev` (keep running)
2. **Terminal 2:** `npx cap open android`
3. **Android Studio Terminal:**
   ```bash
   cd android
   ./gradlew assembleDebug
   emulator -avd cubs_test  # (if not running)
   ./gradlew installDebug
   ./gradlew runDebug
   ```

**That's it! Your app will launch on the virtual device!** 🚀

**Demo credentials:** info@cubstechnical.com / Admin@123456
