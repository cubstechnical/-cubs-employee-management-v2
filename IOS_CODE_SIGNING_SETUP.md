# iOS Automatic Code Signing Setup Guide for Codemagic

This guide will help you set up automatic iOS code signing for your Codemagic builds to ensure successful App Store Connect publishing.

## Problem Analysis

Your current iOS build was failing with:
- "No signing certificate 'iOS Distribution' found"
- "No profiles for 'com.cubstechnical.admin' were found"

This happened because the build disabled code signing but then tried to publish to App Store Connect, which requires properly signed IPAs.

## Solution Overview

The updated Codemagic configuration now uses **automatic code signing** - Codemagic will handle certificates and provisioning profiles for you. You only need to:

1. Set up an App Store Connect API Key
2. Configure your Apple Developer credentials in Codemagic
3. Enable automatic code signing

## Step 1: Create App Store Connect API Key

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Navigate to **Users and Access** → **Keys**
3. Click **+** to create a new API Key
4. Enter a name (e.g., "Codemagic CI")
5. Select **App Manager** access
6. Download the `.p8` file
7. Note the **Key ID** and **Issuer ID**

## Step 2: Configure Codemagic for Automatic Code Signing

### In Codemagic Dashboard:

1. Go to your app settings
2. Navigate to **Distribution** → **iOS code signing**
3. Enable **Automatic code signing**
4. Enter your Apple Developer credentials:
   - **Apple ID**: Your Apple Developer account email
   - **Password**: Your Apple Developer account password (or app-specific password)
   - **Team ID**: `GQCYASP5XS` (from your Xcode project)

## Step 3: Add App Store Connect API Key

### In Codemagic Environment Variables:

1. Go to **Environment variables**
2. Add these variables:

```
APP_STORE_CONNECT_PRIVATE_KEY = [Contents of your .p8 file]
APP_STORE_CONNECT_KEY_IDENTIFIER = [Key ID from Step 1]
APP_STORE_CONNECT_ISSUER_ID = [Issuer ID from Step 1]
```

## Step 4: Test Your Build

### Option A: Test Automatic Signing First (Recommended)
1. Run the **"iOS Build (Testing Only - Automatic Signing)"** workflow first
2. This will test if automatic signing works without trying to publish
3. Check the build log for:
   - ✅ "ARCHIVE SUCCEEDED"
   - ✅ IPA file generated in artifacts
   - ✅ No signing errors

### Option B: Test Full Publishing
1. Run the **"iOS Build (With Publishing)"** workflow
2. Codemagic will automatically:
   - Create/manage certificates and provisioning profiles
   - Sign your app
   - Export the IPA
   - Upload to TestFlight

## Step 5: Troubleshooting Profile Issues

### "No matching profiles found" Error
If you see this error, you need to create the App ID and provisioning profile:

1. **Go to Apple Developer Portal** → **Certificates, Identifiers & Profiles**
2. **Create App ID**:
   - Click **Identifiers** → **+**
   - Select **App IDs**
   - Bundle ID: `com.cubstechnical.admin`
   - Description: "Cubs Employee Management"
   - Capabilities: Enable what you need (if any)

3. **Create Provisioning Profile**:
   - Click **Profiles** → **+**
   - Select **App Store** (for distribution)
   - Select your App ID: `com.cubstechnical.admin`
   - Select your distribution certificate
   - Name: "Cubs Employee Management Distribution"
   - Download and keep for reference

4. **Alternative - Let Codemagic Handle It**:
   - Codemagic can create these automatically if you have the right permissions
   - Make sure your Apple Developer account has Admin or App Manager access

## What Codemagic Handles Automatically

With automatic code signing, Codemagic will:
- ✅ Create and manage iOS Distribution certificates
- ✅ Generate and maintain provisioning profiles
- ✅ Handle certificate renewals before expiration
- ✅ Sign your app with the correct entitlements
- ✅ Export properly formatted IPAs
- ✅ Upload to TestFlight/App Store Connect

## Troubleshooting

### Build Still Shows Manual Variables:
If you see old environment variables (XCODE_PROJECT, XCODE_SCHEME, etc.) in the build log:
- ✅ The codemagic.yaml has been updated correctly
- Wait a few minutes and try a new build (Codemagic may be using cached config)
- Or push a new commit to force fresh configuration

### Automatic Code Signing Issues:
- **"Failed to create certificate"**: Check your Apple Developer credentials are correct
- **"No provisioning profiles found"**: Ensure your app ID `com.cubstechnical.admin` exists in Apple Developer Portal
- **"Authentication failed"**: Verify your Apple ID and password (use app-specific password if 2FA is enabled)
- **"Invalid distribution type"**: Make sure you're using `app_store` for TestFlight/App Store
- **"Bundle identifier mismatch"**: Verify the bundle ID in your project matches `com.cubstechnical.admin`

### App Store Connect Issues:
- **"API key invalid"**: Verify your API key file content and Key ID/Issuer ID
- **"No permission to upload"**: Ensure your API key has "App Manager" access
- **"Bundle ID mismatch"**: Confirm your bundle ID is `com.cubstechnical.admin`
- **"App not found"**: Make sure your app is created in App Store Connect

### Build Issues:
- **"iOS platform not found"**: The workflow will automatically add it
- **"Pod install failed"**: Check your iOS dependencies in package.json
- **"Archive failed"**: Ensure your Xcode project builds locally first
- **"Code signing failed"**: Check that your Apple Developer account has the right permissions

### Apple Developer Account Issues:
- **"Insufficient permissions"**: Your account needs Admin or App Manager role
- **"Certificate expired"**: Codemagic should renew automatically, but you may need to revoke old ones
- **"Too many certificates"**: Clean up old unused certificates in Apple Developer Portal

## Updated Workflow Features

The new iOS workflow includes:

1. **Automatic Code Signing**: Codemagic handles certificates and profiles
2. **Automatic Platform Setup**: Adds iOS platform if missing
3. **Development Team Configuration**: Sets team ID automatically
4. **App Store Connect Publishing**: Automatically uploads to TestFlight/App Store
5. **Email Notifications**: Sends build status updates

## Next Steps

After setting up automatic code signing:

1. Test the build with the updated configuration
2. Verify the app appears in App Store Connect/TestFlight
3. Set up proper app metadata in App Store Connect
4. Configure beta testing if needed
5. Prepare for App Store submission

This setup is much simpler than manual code signing and is perfect for CI/CD workflows!
