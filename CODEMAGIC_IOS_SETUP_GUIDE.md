# 🍎 CodeMagic iOS App Publishing Setup Guide

## 📱 **iOS Build Status**
- ✅ **iOS workflows added** to `codemagic.yaml`
- ✅ **Export options plist** created
- ⚠️ **Environment variables needed** in CodeMagic
- ⚠️ **App Store Connect API key** required

---

## 🔧 **Required Environment Variables**

### **1. App Store Connect API Group (`app_store_connect`)**

Add these variables to CodeMagic with **Secret** flag enabled:

| Variable Name | Description | Example |
|---------------|-------------|---------|
| `APP_STORE_CONNECT_PRIVATE_KEY` | Base64 encoded private key | `-----BEGIN PRIVATE KEY-----\nMIGTAgEAM...` |
| `APP_STORE_CONNECT_KEY_IDENTIFIER` | Key ID from App Store Connect | `ABC123DEF4` |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID from App Store Connect | `57246b42-0c83-4e4c-9c4c-1234567890ab` |

### **2. Existing Environment Group (`cubs_environment`)**
Already configured with:
- ✅ Supabase configuration
- ✅ SendGrid email settings
- ✅ Backblaze B2 storage settings

---

## 🛠️ **App Store Connect API Key Setup**

### **Step 1: Generate API Key**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **Users and Access** → **Keys**
3. Click **Generate API Key**
4. Enter key name: `CodeMagic iOS Publishing`
5. Select **App Manager** role
6. Download the `.p8` file

### **Step 2: Get Required Information**
1. **Key ID**: Found in the key name (e.g., `ABC123DEF4`)
2. **Issuer ID**: Found in the top-right corner of the Keys page
3. **Private Key**: Convert the `.p8` file to base64

### **Step 3: Convert Private Key to Base64**
```bash
# On macOS/Linux
base64 -i AuthKey_ABC123DEF4.p8

# On Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("AuthKey_ABC123DEF4.p8"))
```

---

## 📋 **CodeMagic Environment Setup**

### **Step 1: Add Environment Groups**
1. Go to your CodeMagic project
2. Navigate to **Environment variables**
3. Create group: `app_store_connect`
4. Add the 3 variables above as **Secret**

### **Step 2: Update iOS Export Options**
1. Replace `YOUR_TEAM_ID` in `ios/exportOptions.plist`
2. Get your Team ID from Apple Developer account

---

## 🚀 **Available iOS Workflows**

### **1. iOS Build (`ios-build`)**
- **Purpose**: Debug builds for testing
- **Output**: Debug IPA file
- **Publishing**: TestFlight submission
- **Trigger**: Manual or on push to main

### **2. iOS Release (`ios-release`)**
- **Purpose**: Production builds for App Store
- **Output**: Release IPA file
- **Publishing**: TestFlight submission
- **Trigger**: Manual or on tags

---

## 📱 **iOS Build Process**

### **Build Steps:**
1. **Environment Setup** - Configure Xcode paths
2. **Node.js Dependencies** - Install npm packages
3. **iOS Dependencies** - Run `pod install`
4. **Archive Build** - Create `.xcarchive`
5. **IPA Export** - Generate signed IPA file
6. **TestFlight Upload** - Submit to App Store Connect

### **Artifacts Generated:**
- ✅ **IPA file** - Ready for distribution
- ✅ **Xcode archive** - For debugging
- ✅ **Build logs** - For troubleshooting

---

## 🔐 **Code Signing & Provisioning**

### **Automatic Signing (Recommended)**
- ✅ CodeMagic handles signing automatically
- ✅ Uses App Store Connect API key
- ✅ No manual certificate management

### **Manual Signing (If needed)**
- Add certificates to CodeMagic
- Configure signing identity
- Update export options plist

---

## 📧 **Email Notifications**

Both iOS workflows send notifications to:
- **Success**: Build completed, IPA uploaded to TestFlight
- **Failure**: Build failed, error details included

---

## 🎯 **Next Steps**

### **1. Set Up App Store Connect**
- [ ] Create app in App Store Connect
- [ ] Generate API key with App Manager role
- [ ] Note Key ID, Issuer ID, and Team ID

### **2. Configure CodeMagic**
- [ ] Add `app_store_connect` environment group
- [ ] Add the 3 required secret variables
- [ ] Update `ios/exportOptions.plist` with your Team ID

### **3. Test the Build**
- [ ] Run `ios-build` workflow manually
- [ ] Verify IPA generation
- [ ] Check TestFlight upload

### **4. Production Release**
- [ ] Run `ios-release` workflow
- [ ] Submit for App Store review
- [ ] Monitor build status

---

## 🆘 **Troubleshooting**

### **Common Issues:**

#### **1. Code Signing Errors**
```
Error: No signing certificate found
```
**Solution**: Verify App Store Connect API key has correct permissions

#### **2. Pod Install Failures**
```
Error: Pod install failed
```
**Solution**: Check `ios/Podfile` and ensure all dependencies are compatible

#### **3. Archive Export Errors**
```
Error: Export failed
```
**Solution**: Verify `exportOptions.plist` has correct Team ID

#### **4. TestFlight Upload Issues**
```
Error: Upload to TestFlight failed
```
**Solution**: Check API key permissions and app configuration

---

## 📞 **Support**

- **CodeMagic Docs**: [iOS Build Guide](https://docs.codemagic.io/building/building-for-ios/)
- **Apple Developer**: [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)
- **Contact**: info@cubstechnical.com

---

## ✅ **Checklist**

- [ ] App Store Connect API key generated
- [ ] Environment variables added to CodeMagic
- [ ] Team ID updated in exportOptions.plist
- [ ] iOS workflows tested
- [ ] TestFlight upload verified
- [ ] Production build ready

**Your iOS app is ready for automated publishing! 🎉**
