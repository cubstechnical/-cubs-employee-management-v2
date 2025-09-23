# 📱 App Store Connect Setup Guide

## 🎯 **Goal**: Create an iOS app in App Store Connect for TestFlight distribution

## 📋 **Prerequisites**
- Apple Developer Program membership ($99/year)
- Access to App Store Connect (appstoreconnect.apple.com)
- Admin or App Manager role in your Apple Developer account

## 🚀 **Step-by-Step Instructions**

### **Step 1: Access App Store Connect**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Sign in with your Apple Developer account
3. You should see the main dashboard

### **Step 2: Create New App**
1. Click **"My Apps"** in the top navigation
2. Click the **"+"** button (plus icon) in the top left
3. Select **"New App"** from the dropdown

### **Step 3: Fill App Information**
Fill in the following details:

**Platform**: 
- ✅ Check **iOS**

**Name**: 
- Enter: `CUBS Employee Management`

**Primary Language**: 
- Select: `English (U.S.)`

**Bundle ID**: 
- Click **"Create New"** (don't select existing)
- Enter: `com.cubstechnical.cubsapp`
- Click **"Create"**

**SKU**: 
- Enter: `cubs-employee-management-ios`

**User Access**: 
- Select: `Full Access` (if you're the main developer)

### **Step 4: Save the App**
1. Click **"Create"** button
2. Wait for the app to be created (usually takes 1-2 minutes)
3. You'll be redirected to the app's main page

### **Step 5: Get App Store Connect App ID**
1. On the app's main page, look for **"App Store Connect App ID"**
2. It will be a number like: `1234567890`
3. **Copy this number** - you'll need it for Codemagic

### **Step 6: Configure App Information**
1. Click **"App Information"** in the left sidebar
2. Fill in:
   - **Category**: `Business` or `Productivity`
   - **Content Rights**: `No` (unless you have third-party content)
3. Click **"Save"**

## 🔧 **Configure Codemagic**

### **Step 1: Add Environment Variable**
1. Go to your Codemagic app dashboard
2. Click **"Environment variables"**
3. Add new variable:
   - **Name**: `APP_STORE_APP_ID`
   - **Value**: The number you copied from Step 5
   - **Group**: `workflow` (or leave default)

### **Step 2: Configure App Store Connect Integration**
1. In Codemagic, go to **"Teams"** → **"Integrations"**
2. Click **"Apple Developer Portal"**
3. Click **"Add integration"**
4. Fill in:
   - **Integration name**: `Apple Developer Portal`
   - **Issuer ID**: From your App Store Connect API key
   - **Key ID**: From your App Store Connect API key
   - **Private key**: Upload your .p8 file

## 🧪 **Test the Setup**

### **Step 1: Run Simulator Build First**
1. In Codemagic, start a new build
2. Select **"iOS Simulator Build (Dry Run)"**
3. This will test the build process without signing

### **Step 2: Run TestFlight Build**
1. If simulator build succeeds, run **"iOS TestFlight Release"**
2. This will create a signed IPA and upload to TestFlight

## 🆘 **Troubleshooting**

### **Problem: "Bundle ID already exists"**
**Solution**: Try a different bundle ID like:
- `com.cubstechnical.cubsapp2`
- `com.cubstechnical.employeemgmt`
- `com.cubstechnical.cubs2024`

### **Problem: "No matching provisioning profile"**
**Solution**: 
1. Make sure the app exists in App Store Connect
2. Wait 5-10 minutes after creating the app
3. Try the build again

### **Problem: "App Store Connect API key not found"**
**Solution**:
1. Create an API key in App Store Connect
2. Configure the integration in Codemagic
3. Make sure the key has "App Manager" or "Admin" access

### **Problem: "Build fails with signing error"**
**Solution**:
1. Check that your Apple Developer account is active
2. Verify the bundle ID matches exactly
3. Ensure the App Store Connect integration is properly configured

## 📞 **Need Help?**

### **Apple Developer Support**
- **Documentation**: [Apple Developer Docs](https://developer.apple.com/documentation)
- **Support**: [Apple Developer Support](https://developer.apple.com/support)

### **Codemagic Support**
- **Documentation**: [Codemagic Docs](https://docs.codemagic.io)
- **Community**: [Codemagic Community](https://community.codemagic.io)

## ✅ **Success Checklist**

- [ ] App created in App Store Connect
- [ ] Bundle ID: `com.cubstechnical.cubsapp`
- [ ] App Store Connect App ID copied
- [ ] Environment variable set in Codemagic
- [ ] App Store Connect integration configured
- [ ] Simulator build successful
- [ ] TestFlight build successful
- [ ] App appears in TestFlight

---

**Last Updated**: $(date)  
**Status**: Ready for use  
**Bundle ID**: `com.cubstechnical.cubsapp`
