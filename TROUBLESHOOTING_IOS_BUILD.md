# 🔧 iOS Build Troubleshooting Guide

## ❌ **Current Error**: 
`No matching profiles found for bundle identifier "com.cubstechnical.admin" and distribution type "app_store"`

## 🎯 **Root Cause Analysis**

### ✅ **What's Working:**
- Bundle ID `com.cubstechnical.admin` exists in Apple Developer account
- Team ID `GQCYASP5XS` is confirmed
- Codemagic configuration is correct
- iOS project is properly configured

### ❌ **What's Missing:**
1. **App Store Connect App Record** - The app doesn't exist in App Store Connect yet
2. **Provisioning Profiles** - Apple hasn't generated App Store distribution profiles
3. **App Store Connect App ID** - Environment variable not set

## 🚀 **Step-by-Step Solution**

### **Step 1: Create App in App Store Connect**

1. **Go to**: [App Store Connect](https://appstoreconnect.apple.com)
2. **Sign in** with your Apple Developer account
3. **Click**: "My Apps" in the top navigation
4. **Click**: "+" button → "New App"
5. **Fill in**:
   - **Platform**: iOS
   - **Name**: "CUBS Employee Management"
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: Select `com.cubstechnical.admin` from dropdown
   - **SKU**: `cubs-employee-management-admin`
6. **Click**: "Create"

### **Step 2: Get App Store Connect App ID**

1. **After creating the app**, you'll see the app dashboard
2. **Look for**: "App Store Connect App ID" (numeric value like `1234567890`)
3. **Copy this number** - you'll need it for Codemagic

### **Step 3: Configure Codemagic Environment Variables**

1. **Go to**: Your Codemagic app dashboard
2. **Click**: "Environment variables"
3. **Add new variable**:
   - **Name**: `APP_STORE_APP_ID`
   - **Value**: The numeric App ID from Step 2
   - **Group**: `workflow`

### **Step 4: Verify App Store Connect Integration**

1. **In Codemagic**: Go to "Teams" → "Integrations"
2. **Check**: "Apple Developer Portal" integration exists
3. **Verify**: It's configured with your API key
4. **Ensure**: The integration has "App Manager" or "Admin" access

### **Step 5: Retry the Build**

1. **Start new build** in Codemagic
2. **Select**: "iOS TestFlight Release" workflow
3. **Monitor**: The build logs for any errors

## 🔍 **Alternative Solutions**

### **Option A: Use Development Distribution (Testing)**

If you want to test the build process first, you can temporarily change the distribution type:

```yaml
ios_signing:
  distribution_type: development  # Instead of app_store
  bundle_identifier: "com.cubstechnical.admin"
  team_id: "GQCYASP5XS"
```

### **Option B: Manual Provisioning Profile**

If automatic signing continues to fail:

1. **Go to**: [Apple Developer Portal](https://developer.apple.com/account)
2. **Navigate**: Certificates, Identifiers & Profiles
3. **Create**: App Store distribution provisioning profile
4. **Download**: The .mobileprovision file
5. **Upload**: To Codemagic as a secure file

### **Option C: Check Apple Developer Account Status**

1. **Verify**: Your Apple Developer Program membership is active
2. **Check**: You have the correct role (Admin/App Manager)
3. **Ensure**: The bundle ID is properly configured for App Store distribution

## 🧪 **Testing Steps**

### **Step 1: Test with Simulator Build**
1. **Run**: "iOS Simulator Build (Dry Run)" first
2. **Verify**: The build process works without signing
3. **Check**: No compilation errors

### **Step 2: Test with Development Build**
1. **Temporarily change**: `distribution_type: development`
2. **Run**: The build to test signing process
3. **Verify**: Provisioning profiles are found

### **Step 3: Test with App Store Build**
1. **Revert**: `distribution_type: app_store`
2. **Ensure**: App exists in App Store Connect
3. **Run**: Full TestFlight build

## 📊 **Common Error Messages and Solutions**

### **Error**: "No matching profiles found"
**Solution**: Create app in App Store Connect

### **Error**: "Bundle identifier not found"
**Solution**: Verify bundle ID exists in Apple Developer account

### **Error**: "Team ID mismatch"
**Solution**: Ensure team ID `GQCYASP5XS` is correct

### **Error**: "App Store Connect API key invalid"
**Solution**: Reconfigure the integration in Codemagic

### **Error**: "Provisioning profile expired"
**Solution**: Regenerate provisioning profiles in Apple Developer Portal

## 🎯 **Success Indicators**

### **Build Success:**
- ✅ Build completes without errors
- ✅ IPA file is generated
- ✅ Upload to TestFlight succeeds
- ✅ App appears in TestFlight within 15 minutes

### **App Store Connect Success:**
- ✅ App appears in "My Apps"
- ✅ Bundle ID matches exactly
- ✅ App Store Connect App ID is available
- ✅ TestFlight section is accessible

## 🆘 **If All Else Fails**

### **Contact Apple Developer Support:**
- **Phone**: 1-800-633-2152
- **Email**: developer@apple.com
- **Documentation**: [Apple Developer Support](https://developer.apple.com/support)

### **Contact Codemagic Support:**
- **Documentation**: [Codemagic Docs](https://docs.codemagic.io)
- **Community**: [Codemagic Community](https://community.codemagic.io)
- **Support**: [Codemagic Support](https://codemagic.io/contact)

## 📋 **Checklist**

- [ ] App created in App Store Connect
- [ ] Bundle ID `com.cubstechnical.admin` selected
- [ ] App Store Connect App ID copied
- [ ] Environment variable `APP_STORE_APP_ID` set in Codemagic
- [ ] Apple Developer Portal integration configured
- [ ] Team ID `GQCYASP5XS` confirmed
- [ ] Simulator build successful
- [ ] TestFlight build successful

---

**Last Updated**: $(date)  
**Status**: Ready for troubleshooting  
**Bundle ID**: `com.cubstechnical.admin`  
**Team ID**: `GQCYASP5XS`
