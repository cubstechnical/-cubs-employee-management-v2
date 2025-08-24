# 🎯 FINAL ANDROID RUN COMMANDS

## ✅ **YOUR APP IS BUILT AND READY!**

---

## **📱 COMPLETE TERMINAL WORKFLOW**

### **Step 1: Start Development Server (First Terminal)**
```bash
# In project root directory
npm run dev
```
**Output:** `Ready - started server on 0.0.0.0:3002`
**Keep this running** - it serves your web app to Android

---

### **Step 2: Open Android Studio (Second Terminal)**
```bash
# In project root directory
npx cap open android
```
**Android Studio opens** with your project

---

### **Step 3: In Android Studio Terminal - Run Commands**
```bash
# Navigate to android directory
cd android

# Install APK on connected device/emulator
./gradlew installDebug

# Launch the app
./gradlew runDebug
```

---

## **🚀 ONE-LINE QUICK COMMANDS (COPY & PASTE)**

### **For Android Studio Terminal:**
```bash
cd android && ./gradlew installDebug && ./gradlew runDebug
```

### **Alternative Direct Commands:**
```bash
# Install APK only
./gradlew installDebug

# Run on specific device (if multiple devices)
./gradlew runDebug --deviceId=emulator-5554
```

---

## **🎮 VIRTUAL DEVICE COMMANDS**

### **If Using Command Line Emulator:**
```bash
# List available AVDs
emulator -list-avds

# Start specific emulator
emulator -avd Pixel_4_API_33

# Or start the one you created
emulator -avd cubs_test

# Check if device is running
adb devices
```

### **With Device Running:**
```bash
# Install app
./gradlew installDebug

# Launch app manually
adb shell am start -n com.cubstechnical.admin/.MainActivity
```

---

## **📋 COMPLETE TESTING WORKFLOW**

### **Terminal 1: Development Server**
```bash
npm run dev
# Output: Ready - started server on 0.0.0.0:3002
```

### **Terminal 2: Android Commands**
```bash
# 1. Open Android Studio
npx cap open android

# 2. In Android Studio terminal:
cd android

# 3. Install and run
./gradlew installDebug
./gradlew runDebug
```

---

## **🔧 TROUBLESHOOTING COMMANDS**

### **If Build Issues:**
```bash
# Clean and rebuild
./gradlew clean
./gradlew assembleDebug
./gradlew installDebug
```

### **If Device Connection Issues:**
```bash
# List connected devices
adb devices

# Restart ADB
adb kill-server
adb start-server

# Check app installation
adb shell pm list packages | grep cubs
```

### **If App Won't Launch:**
```bash
# Force stop app
adb shell am force-stop com.cubstechnical.admin

# Clear app data
adb shell pm clear com.cubstechnical.admin

# Reinstall
./gradlew installDebug
```

---

## **📱 EXPECTED OUTPUT**

### **Successful Run:**
```
> Task :app:installDebug
Installing APK 'app-debug.apk' on 'Pixel_4_API_33(AVD) - 13' for app:debug

> Task :app:runDebug
Starting: Intent { act=android.intent.action.MAIN cat=[android.intent.category.LAUNCHER] cmp=com.cubstechnical.admin/.MainActivity }
```

### **On Device:**
1. **App launches** on virtual device
2. **Login screen appears**
3. **Use credentials**: `info@cubstechnical.com` / `Admin@123456`
4. **Test all features**: Employees, Documents, Settings

---

## **🎯 QUICK REFERENCE**

### **Essential Commands:**
```bash
# Start dev server
npm run dev

# Open Android Studio
npx cap open android

# Run app (in Android Studio terminal)
cd android && ./gradlew installDebug && ./gradlew runDebug
```

### **Test Commands:**
```bash
# Check device connection
adb devices

# View app logs
adb logcat -s "CUBS"

# Take screenshot
adb shell screencap /sdcard/screenshot.png
adb pull /sdcard/screenshot.png
```

---

## **📞 SUPPORT**

**Demo Credentials:** `info@cubstechnical.com` / `Admin@123456`
**Technical Contact:** `admin@chocosoftdev.com`

**Your app is ready to run! Execute the commands above!** 🚀
