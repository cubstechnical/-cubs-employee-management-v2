# 🔧 iOS Export Troubleshooting Guide

## **Current Error Analysis**
```
error: exportArchive No signing certificate "iOS Distribution" found
error: exportArchive No profiles for 'com.cubstechnical.employee' were found
```

## **Root Causes & Solutions**

### **1. App Store Connect Integration Issues**

#### **Problem**: The `appstorekey` integration is not properly configured
#### **Solution**: 
1. **Check Codemagic Integration**:
   - Go to Codemagic → Teams → Integrations
   - Verify "Apple Developer Portal" integration exists
   - Ensure it's named `appstorekey` (or update the codemagic.yaml)

2. **Verify API Key Permissions**:
   - Go to App Store Connect → Users and Access → Keys
   - Check that your API key has "App Manager" or "Admin" access
   - Ensure it's not expired

### **2. Bundle ID Mismatch**

#### **Problem**: Bundle ID `com.cubstechnical.employee` doesn't exist in App Store Connect
#### **Solution**:
1. **Check App Store Connect**:
   - Go to App Store Connect → My Apps
   - Look for an app with bundle ID `com.cubstechnical.employee`
   - If it doesn't exist, create it

2. **Create App in App Store Connect**:
   - Click "+" → "New App"
   - Platform: iOS
   - Name: "CUBS Employee Management"
   - Bundle ID: `com.cubstechnical.employee`
   - SKU: `cubs-employee-management-ios`

### **3. App Store Connect App ID Mismatch**

#### **Problem**: The App ID `6752909710` might be incorrect
#### **Solution**:
1. **Get Correct App ID**:
   - In App Store Connect, go to your app
   - Look for "App Store Connect App ID" (numeric value)
   - Update the `APP_STORE_APP_ID` in codemagic.yaml

### **4. Automatic Signing Issues**

#### **Problem**: Apple's automatic signing is not working
#### **Solution**: Use manual signing as fallback

## **Immediate Fixes to Try**

### **Fix 1: Update Codemagic Configuration**

Update your `codemagic.yaml` to use manual signing as a fallback:

```yaml
workflows:
  ios-testflight-release:
    name: iOS TestFlight Release
    max_build_duration: 120
    environment:
      xcode: latest
      cocoapods: default
      node: 20.11.0
      vars:
        BUNDLE_ID: "com.cubstechnical.employee"
        XCODE_WORKSPACE: "ios/App/App.xcworkspace"
        XCODE_SCHEME: "App"
        APP_STORE_APP_ID: "6752909710"  # Verify this is correct
        DEVELOPMENT_TEAM: "GQCYASP5XS"
    integrations:
      app_store_connect: appstorekey
    scripts:
      # ... existing scripts ...
      - name: Export IPA with fallback
        script: |
          echo "📦 Exporting IPA with fallback options..."
          cd ios/App
          
          # Try automatic signing first
          echo "Attempting export with automatic signing..."
          if xcodebuild -exportArchive \
            -archivePath ../../build/ios/archive/App.xcarchive \
            -exportPath ../../build/ios/ipa \
            -exportOptionsPlist ExportOptions.plist \
            -verbose; then
            echo "✅ Export successful with automatic signing"
          else
            echo "❌ Automatic signing failed, trying manual signing..."
            
            # Create manual signing ExportOptions.plist
            cat > ExportOptions_manual.plist << 'EOF'
          <?xml version="1.0" encoding="UTF-8"?>
          <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
          <plist version="1.0">
          <dict>
              <key>method</key>
              <string>app-store</string>
              <key>teamID</key>
              <string>GQCYASP5XS</string>
              <key>uploadBitcode</key>
              <false/>
              <key>uploadSymbols</key>
              <true/>
              <key>compileBitcode</key>
              <false/>
              <key>stripSwiftSymbols</key>
              <true/>
              <key>thinning</key>
              <string>&lt;none&gt;</string>
              <key>destination</key>
              <string>export</string>
              <key>signingStyle</key>
              <string>manual</string>
          </dict>
          </plist>
          EOF
            
            # Try manual signing
            if xcodebuild -exportArchive \
              -archivePath ../../build/ios/archive/App.xcarchive \
              -exportPath ../../build/ios/ipa \
              -exportOptionsPlist ExportOptions_manual.plist \
              -verbose; then
              echo "✅ Export successful with manual signing"
            else
              echo "❌ Both automatic and manual signing failed"
              exit 1
            fi
          fi
          
          cd ../..
```

### **Fix 2: Verify App Store Connect Setup**

1. **Check if app exists**:
   - Go to App Store Connect → My Apps
   - Look for "CUBS Employee Management" or bundle ID `com.cubstechnical.employee`

2. **If app doesn't exist, create it**:
   - Click "+" → "New App"
   - Platform: iOS
   - Name: "CUBS Employee Management"
   - Bundle ID: `com.cubstechnical.employee`
   - SKU: `cubs-employee-management-ios`

3. **Get correct App ID**:
   - After creating the app, note the "App Store Connect App ID"
   - Update `APP_STORE_APP_ID` in codemagic.yaml

### **Fix 3: Check Codemagic Integration**

1. **Verify integration name**:
   - In Codemagic, go to Teams → Integrations
   - Check that the integration is named `appstorekey`
   - If not, either rename it or update the codemagic.yaml

2. **Test integration**:
   - Try running a simple build to test the integration
   - Check the logs for any integration-related errors

## **Debugging Steps**

### **Step 1: Check App Store Connect**
```bash
# In Codemagic, add this debug script
- name: Debug App Store Connect
  script: |
    echo "🔍 Debugging App Store Connect setup..."
    echo "Bundle ID: $BUNDLE_ID"
    echo "App Store App ID: $APP_STORE_APP_ID"
    echo "Development Team: $DEVELOPMENT_TEAM"
    
    # Check if we can access App Store Connect
    if [ -n "$APP_STORE_CONNECT_API_KEY" ]; then
      echo "✅ App Store Connect API key is available"
    else
      echo "❌ App Store Connect API key is not available"
    fi
```

### **Step 2: Verify Project Configuration**
```bash
# Add this to your Codemagic workflow
- name: Debug Project Configuration
  script: |
    echo "🔍 Debugging project configuration..."
    cd ios/App
    
    echo "Checking DEVELOPMENT_TEAM:"
    grep -n "DEVELOPMENT_TEAM" App.xcodeproj/project.pbxproj
    
    echo "Checking CODE_SIGN_STYLE:"
    grep -n "CODE_SIGN_STYLE" App.xcodeproj/project.pbxproj
    
    echo "Checking Bundle ID:"
    grep -n "PRODUCT_BUNDLE_IDENTIFIER" App.xcodeproj/project.pbxproj
    
    cd ../..
```

## **Quick Fixes to Try**

### **Option 1: Use Different Bundle ID**
If the current bundle ID is causing issues, try:
- `com.cubstechnical.employeemgmt`
- `com.cubstechnical.cubsapp`
- `com.cubstechnical.employee2024`

### **Option 2: Use Manual Signing**
Update ExportOptions.plist to use manual signing:
```xml
<key>signingStyle</key>
<string>manual</string>
<key>signingCertificate</key>
<string>Apple Distribution</string>
```

### **Option 3: Check Team ID**
Verify that `GQCYASP5XS` is the correct team ID:
- Go to Apple Developer → Membership
- Check your Team ID

## **Next Steps**

1. **Try the fallback configuration** above
2. **Verify App Store Connect setup**
3. **Check Codemagic integration**
4. **Run a test build** with debug information
5. **Check the logs** for specific error messages

The most likely issue is that the app doesn't exist in App Store Connect with the correct bundle ID, or the Codemagic integration isn't properly configured.
