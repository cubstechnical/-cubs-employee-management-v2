# 🚀 **Codemagic → App Store Connect Setup Guide**

## 📋 **What This Does**
- ✅ **Builds your iOS app** with Codemagic
- ✅ **Automatically signs** the app with your certificates
- ✅ **Uploads directly** to App Store Connect
- ✅ **Appears in TestFlight** within 10-15 minutes
- ✅ **No Mac required!** 🎉

---

## 🔑 **Step 1: Get App Store Connect API Credentials**

### **1.1 Go to App Store Connect:**
1. **Visit**: https://appstoreconnect.apple.com
2. **Sign in** with `info@cubstechnical.com`
3. **Click**: "Users and Access" (top right)
4. **Click**: "Keys" tab

### **1.2 Create API Key:**
1. **Click**: "Generate API Key" or "+" button
2. **Name**: "Codemagic iOS Upload"
3. **Role**: "App Manager" (minimum)
4. **Click**: "Generate"
5. **Download** the `.p8` file (you can only download once!)

### **1.3 Note Your Credentials:**
- **Key ID**: `fde9acef-6408-4dab-b6ed-31f8a3e5817b` (you already have this)
- **Issuer ID**: `MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgbdfBnq24esDTgFpA` (you already have this)
- **API Key**: The `.p8` file content (new)

---

## ⚙️ **Step 2: Add Environment Variables to Codemagic**

### **2.1 Go to Codemagic:**
1. **Visit**: https://codemagic.io/apps
2. **Select**: Your app (`-cubs-employee-management-v2`)
3. **Click**: "Settings" tab
4. **Click**: "Environment variables"

### **2.2 Add These Variables:**

| Variable Name | Value | Secure |
|---------------|-------|--------|
| `APP_STORE_CONNECT_API_KEY` | **Content of your .p8 file** | ✅ **YES** |
| `APP_STORE_CONNECT_KEY_ID` | `fde9acef-6408-4dab-b6ed-31f8a3e5817b` | ❌ No |
| `APP_STORE_CONNECT_ISSUER_ID` | `MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgbdfBnq24esDTgFpA` | ❌ No |

### **2.3 How to Get .p8 Content:**
1. **Open** the downloaded `.p8` file in a text editor
2. **Copy** the entire content (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
3. **Paste** into the `APP_STORE_CONNECT_API_KEY` variable
4. **Mark as secure** ✅

---

## 🚀 **Step 3: Run the Build**

### **3.1 Start Build:**
1. **Go to**: Codemagic dashboard
2. **Click**: "Start new build"
3. **Select**: `ios-build-testflight` workflow
4. **Click**: "Start build"

### **3.2 What Happens:**
1. **Codemagic builds** your iOS app
2. **Automatically signs** with your certificates
3. **Creates signed IPA**
4. **Uploads to App Store Connect**
5. **Appears in TestFlight** within 10-15 minutes

---

## 📱 **Step 4: Test on Your iPhone**

### **4.1 Install TestFlight:**
1. **Open App Store** on your iPhone
2. **Search**: "TestFlight"
3. **Install** TestFlight app

### **4.2 Install Your App:**
1. **Open TestFlight**
2. **Look for**: "CUBS Employee Management"
3. **Tap**: "Install"
4. **Test** the app functionality

---

## ⚠️ **Troubleshooting**

### **If Build Fails:**
1. **Check** environment variables are set correctly
2. **Verify** API key has correct permissions
3. **Ensure** bundle ID matches: `com.cubstechnical.admin`

### **If App Doesn't Appear in TestFlight:**
1. **Wait** 10-15 minutes for processing
2. **Check** App Store Connect → TestFlight → Builds
3. **Verify** build status is "Ready to Submit"

### **Common Issues:**
- **"No matching profiles"**: API key permissions issue
- **"Invalid bundle ID"**: Check bundle ID in Codemagic
- **"Signing failed"**: Check certificate setup

---

## 🎯 **Success Indicators**

### **✅ Build Success:**
```
✅ IPA created successfully:
🚀 Ready for App Store Connect upload!
```

### **✅ Upload Success:**
- **Email notification** from Codemagic
- **App appears** in TestFlight within 15 minutes
- **Build status** shows "Ready to Submit" in App Store Connect

---

## 📞 **Next Steps**

1. **Set up the environment variables** in Codemagic
2. **Run the `ios-build-testflight` workflow**
3. **Wait for upload to complete**
4. **Test on your iPhone via TestFlight**

**This will work perfectly for your Windows + iPhone setup!** 🚀

**Need help with any step?**
