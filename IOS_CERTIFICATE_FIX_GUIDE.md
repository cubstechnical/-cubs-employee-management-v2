# 🔐 iOS Certificate Fix Guide

## **Root Cause Identified**
```
Available certificates:
     0 valid identities found
```

**The issue**: Codemagic's App Store Connect integration is not providing any signing certificates, which is why both automatic and manual signing fail.

## **Why This Happens**

### **1. App Store Connect Integration Not Configured**
- The `appstorekey` integration might not exist in Codemagic
- The integration might not be properly linked to your Apple Developer account
- The API key might not have the correct permissions

### **2. App Doesn't Exist in App Store Connect**
- The app with bundle ID `com.cubstechnical.employee` might not exist in App Store Connect
- Without an app in App Store Connect, Apple won't generate the necessary certificates

### **3. API Key Permissions**
- The App Store Connect API key might not have "App Manager" or "Admin" access
- The key might be expired or invalid

## **Step-by-Step Solution**

### **Step 1: Verify App Store Connect Setup**

1. **Go to App Store Connect**: https://appstoreconnect.apple.com
2. **Check if your app exists**:
   - Look for an app with bundle ID `com.cubstechnical.employee`
   - If it doesn't exist, create it (see Step 2)

3. **If app exists, get the correct App ID**:
   - Note the "App Store Connect App ID" (numeric value)
   - Update `APP_STORE_APP_ID` in codemagic.yaml if different from `6752909710`

### **Step 2: Create App in App Store Connect (if needed)**

1. **Click "+" → "New App"**
2. **Fill in**:
   - **Platform**: iOS
   - **Name**: "CUBS Employee Management"
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: `com.cubstechnical.employee`
   - **SKU**: `cubs-employee-management-ios`
3. **Click "Create"**
4. **Wait 5-10 minutes** for Apple to generate certificates

### **Step 3: Create/Update App Store Connect API Key**

1. **Go to App Store Connect → Users and Access → Keys**
2. **Click "Generate API Key" or "+"**
3. **Fill in**:
   - **Name**: `Codemagic iOS Deployment`
   - **Access**: `App Manager` or `Admin`
   - **Apps**: Select your app or leave blank for all apps
4. **Click "Generate"**
5. **Download the .p8 file** (you can only download it once!)
6. **Note down**:
   - **Key ID** (10-character string)
   - **Issuer ID** (UUID format)

### **Step 4: Configure Codemagic Integration**

1. **Go to Codemagic → Teams → Integrations**
2. **Click "Apple Developer Portal"**
3. **Click "Add integration"**
4. **Fill in**:
   - **Integration name**: `appstorekey` (must match codemagic.yaml)
   - **Issuer ID**: From Step 3
   - **Key ID**: From Step 3
   - **Private key**: Upload the .p8 file
5. **Click "Add integration"**

### **Step 5: Update Codemagic Configuration**

If the integration name is different, update your `codemagic.yaml`:

```yaml
integrations:
  app_store_connect: your-integration-name  # Update this to match your integration
```

### **Step 6: Test the Integration**

1. **Run a test build** in Codemagic
2. **Check the debug output** for:
   - ✅ "App Store Connect API key is available"
   - ✅ Available certificates (should show more than 0)
   - ✅ Successful export

## **Alternative Solutions**

### **Option 1: Use Different Bundle ID**
If the current bundle ID is causing issues, try:
- `com.cubstechnical.employeemgmt`
- `com.cubstechnical.cubsapp`
- `com.cubstechnical.employee2024`

### **Option 2: Manual Certificate Upload**
If automatic integration doesn't work:

1. **Download certificates manually** from Apple Developer Portal
2. **Upload to Codemagic** as environment variables
3. **Update codemagic.yaml** to use manual certificates

### **Option 3: Use EAS Build (Alternative)**
Consider switching to EAS Build for iOS deployment:
- More reliable certificate management
- Better integration with Expo/React Native
- Automatic certificate provisioning

## **Verification Checklist**

Before running the next build, verify:

- [ ] App exists in App Store Connect with correct bundle ID
- [ ] App Store Connect API key has correct permissions
- [ ] Codemagic integration is properly configured
- [ ] Integration name matches codemagic.yaml
- [ ] App Store Connect App ID is correct

## **Expected Results After Fix**

The next build should show:
```
Available certificates:
     1 valid identities found
     1) ABC1234567 "Apple Distribution: Your Team Name (GQCYASP5XS)"
```

And the export should succeed with either automatic or manual signing.

## **If Still Failing**

1. **Check Codemagic logs** for specific error messages
2. **Verify Apple Developer account** is active and paid
3. **Contact Codemagic support** if integration issues persist
4. **Consider using EAS Build** as an alternative deployment method
