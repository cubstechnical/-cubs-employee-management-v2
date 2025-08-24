# 🎯 ANDROID STUDIO - STEP-BY-STEP BUILD GUIDE

## 📱 **WHAT TO DO IN ANDROID STUDIO (RIGHT NOW)**

---

## **Step 1: Wait for Project to Load**
- **Android Studio will open** with your CUBS Visa Management project
- **Wait for Gradle sync** to complete (bottom status bar)
- **This may take 2-5 minutes** first time

---

## **Step 2: Generate Signed App Bundle**

### **2.1 Open Build Menu**
```bash
Menu: Build → Generate Signed Bundle/APK
```

### **2.2 Select Bundle Type**
- **Choose**: "Android App Bundle"
- **Click**: "Next"

### **2.3 Create New Keystore**
- **Click**: "Create new..."
- **Key store path**: `C:\Users\YourName\keystore.jks` (choose secure location)
- **Password**: Create strong password (save this!)
- **Key alias**: `cubs_key`
- **Key password**: Same as keystore password
- **Validity**: 25 years
- **Certificate details**:
  - First and Last Name: Your name
  - Organizational Unit: Development
  - Organization: Your company
  - City: Your city
  - State: Your state
  - Country Code: Your country code (2 letters)
- **Click**: "OK"

### **2.4 Generate Bundle**
- **Build Variant**: "release"
- **Signature Versions**: Check both V1 and V2
- **Destination folder**: Choose where to save (Desktop or Downloads)
- **Click**: "Generate"

---

## **Step 3: Wait for Build Completion**
- **Build process**: 5-10 minutes
- **Output file**: `app-release.aab` (~15-30MB)
- **Location**: Your chosen destination folder

---

## **Step 4: Upload to Google Play Console**

### **4.1 Go to Play Console**
- Open: https://play.google.com/console/
- Select your app (create new if first time)

### **4.2 Production Release**
- **Production → Create new release**
- **Upload** the `app-release.aab` file
- **Release name**: "Version 1.0.0"
- **Release notes**: "Initial release of CUBS Visa Management"

### **4.3 Store Listing (If not done)**
- **Store presence → Main store listing**
- **App icon**: Upload `public/assets/generated-icons/icon-512-512x512.png`
- **Feature Graphic**: Upload `public/assets/logo.png` (resize if needed)
- **Phone Screenshots**: Upload from `public/assets/screenshots/`
  - `screenshot_01_login.jpg`
  - `screenshot_02_dashboard.jpg`
  - `screenshot_03_employees.jpg`

### **4.4 Data Safety (CRITICAL)**
- **Policy → Data safety**
- Copy from `DATA_SAFETY_FORM_ANSWERS.md`:

**Personal Information:**
- Name: ✅ Collected for app functionality
- Email: ✅ Collected for app functionality, communications
- Phone: ✅ Optional, collected for app functionality

**App Activity:**
- App interactions: ✅ Analytics, app functionality
- Search history: ✅ App functionality

**Device IDs:**
- Device identifiers: ✅ App functionality, analytics

**Sensitive Information:**
- Government IDs: ✅ Employee ID management
- Personal documents: ✅ Visa/passport document storage

### **4.5 Content Rating**
- **Policy → App content**
- **Complete questionnaire**
- **Select**: "Everyone" (18+ target audience)

### **4.6 Submit for Review**
- **Save draft**
- **Review all sections**
- **Click**: "Submit for review"

---

## **📋 QUICK CHECKLIST**

### **In Android Studio:**
- [ ] Project loaded successfully
- [ ] Gradle sync completed
- [ ] Build → Generate Signed Bundle/APK selected
- [ ] Android App Bundle chosen
- [ ] New keystore created
- [ ] Release variant selected
- [ ] Generate clicked

### **After Build:**
- [ ] `app-release.aab` file generated
- [ ] File size reasonable (~15-30MB)
- [ ] File saved to accessible location

### **Google Play Console:**
- [ ] App created (if new)
- [ ] Bundle uploaded
- [ ] Store listing completed
- [ ] Data safety form filled
- [ ] Content rating done
- [ ] Submitted for review

---

## **🚨 TROUBLESHOOTING**

### **If Build Fails:**
1. **Clean project**: Build → Clean Project
2. **Sync gradle**: File → Sync Project with Gradle Files
3. **Check Java version**: File → Project Structure → JDK Location
4. **Restart Android Studio**

### **If Upload Fails:**
1. **Check bundle size** (<150MB)
2. **Verify bundle ID** matches Play Console
3. **Ensure screenshots** are correct size
4. **Check signing** was successful

### **Contact Support:**
- **Email**: admin@chocosoftdev.com
- **Demo Account**: info@cubstechnical.com / Admin@123456

---

## **⏱️ TIMELINE**
- **Build Generation**: 5-10 minutes
- **Upload & Setup**: 15-30 minutes
- **Google Review**: 1-3 days
- **Total Time**: ~45-60 minutes

---

**🎯 Android Studio should be open now! Follow these steps to generate your signed bundle and submit to Google Play Store!**
