# 📱 ANDROID SDK SETUP GUIDE

## 🚨 **CURRENT ISSUE: Android SDK Not Configured**

The error shows that the Android SDK location is not set. Here's how to fix it:

---

## **Solution 1: Configure Android SDK in Android Studio**

### **Step 1: Open Android Studio**
1. **Open Android Studio** (it should still be open)
2. **File → Settings** (or **Android Studio → Preferences** on Mac)

### **Step 2: Configure SDK Location**
1. **Navigate to**: Appearance & Behavior → System Settings → Android SDK
2. **Check if SDK is installed**:
   - If not installed: Click "Edit" and download required components
   - If installed: Note the Android SDK Location path

### **Step 3: Set Environment Variable**
1. **Copy the SDK path** (usually `C:\Users\YourName\AppData\Local\Android\Sdk`)
2. **Set environment variable**:
   ```bash
   # In PowerShell (as Administrator):
   setx ANDROID_HOME "C:\Users\YourName\AppData\Local\Android\Sdk"
   setx PATH "%PATH%;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools"
   ```

### **Step 4: Create local.properties file**
```bash
# Create file: android/local.properties
sdk.dir=C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
```

---

## **Solution 2: Quick Fix (If SDK is installed)**

### **Check if Android SDK exists:**
```bash
# Check default locations:
dir "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
# or
dir "C:\Android\Sdk"
```

### **Create local.properties automatically:**
```bash
# Run this in android directory:
echo "sdk.dir=C:\\Users\\$env:USERNAME\\AppData\\Local\\Android\\Sdk" > local.properties
```

---

## **Solution 3: Install Android SDK Components**

### **If SDK is missing:**
1. **Open Android Studio**
2. **Tools → SDK Manager**
3. **Install these components:**
   - [x] Android SDK Platform 33 (API 33)
   - [x] Android SDK Build-Tools 33.0.0
   - [x] Android SDK Platform-Tools
   - [x] Android SDK Tools
   - [x] Android Emulator
   - [x] Intel x86 Emulator Accelerator

### **Set SDK path:**
1. **File → Project Structure**
2. **Platform Settings → SDKs**
3. **Set Android SDK location**

---

## **Solution 4: Alternative - Use Command Line**

### **If Android Studio setup is too complex:**
```bash
# Install Android SDK via command line:
# Download from: https://developer.android.com/studio#downloads
# Or use Chocolatey (Windows):
choco install android-sdk
```

---

## **🎯 IMMEDIATE ACTION PLAN**

### **Step 1: Check Android Studio SDK**
1. **Open Android Studio** (if closed)
2. **File → Settings → Appearance & Behavior → System Settings → Android SDK**
3. **Install missing components** if needed
4. **Copy the SDK path**

### **Step 2: Set Environment Variables**
```bash
# Run in PowerShell as Administrator:
setx ANDROID_HOME "C:\Users\YourName\AppData\Local\Android\Sdk"
setx PATH "%PATH%;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools"
```

### **Step 3: Create local.properties**
```bash
# In android directory:
echo "sdk.dir=C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk" > local.properties
```

### **Step 4: Try Build Again**
```bash
./gradlew assembleDebug
```

---

## **📱 RUNNING ON VIRTUAL DEVICE**

### **Once SDK is configured:**

1. **Tools → Device Manager**
2. **Create Virtual Device**:
   - Select Pixel 4 or similar
   - Choose API 33 (Android 13)
   - Download system image if needed
3. **Launch Virtual Device**
4. **Run app**:
   - **Run → Run 'app'**
   - **Select your virtual device**

---

## **🔧 TROUBLESHOOTING**

### **Common Issues:**
1. **"SDK location not found"**: Set ANDROID_HOME environment variable
2. **"No system images"**: Download system images in SDK Manager
3. **"HAXM not installed"**: Enable VT-x in BIOS or install HAXM
4. **"Emulator slow"**: Enable hardware acceleration

### **Quick Fix Commands:**
```bash
# Check Java version (should be 17 or 21):
java -version

# Check Android SDK location:
echo %ANDROID_HOME%

# Clean and rebuild:
./gradlew clean
./gradlew assembleDebug
```

---

## **📞 NEED HELP?**

**Contact**: admin@chocosoftdev.com
**Demo Account**: info@cubstechnical.com / Admin@123456

---

**🎯 Next: Once SDK is configured, you can run the app on a virtual device and test it!**
