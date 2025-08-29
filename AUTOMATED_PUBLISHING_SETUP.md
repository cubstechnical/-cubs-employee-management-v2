# 🚀 Automated iOS Publishing Setup with Codemagic

This guide will help you set up **fully automated iOS publishing** to TestFlight using Codemagic. No manual uploads required!

## 📋 Prerequisites

1. **Apple Developer Account** with App Store Connect access
2. **Codemagic Account** (already set up)
3. **App Store Connect API Key** (we'll create this)

## 🔑 Step 1: Create App Store Connect API Key

### 1.1 Go to App Store Connect
1. Visit: [https://appstoreconnect.apple.com/access/api](https://appstoreconnect.apple.com/access/api)
2. Click **"Keys"** tab
3. Click **"+"** to create a new API Key

### 1.2 Configure the API Key
```
Name: Codemagic CI/CD Key
Access: App Manager (most permissive)
```

### 1.3 Download and Save the Key
1. **Download the `.p8` file** (save it securely)
2. **Note the Key ID** (format: `A1B2C3D4E5`)
3. **Note the Issuer ID** (format: `12345678-1234-1234-1234-123456789abc`)

## ⚙️ Step 2: Configure Codemagic Environment Variables

### 2.1 Go to Codemagic Dashboard
1. Visit: [https://codemagic.io/apps](https://codemagic.io/apps)
2. Select your app
3. Go to **"Environment Variables"** tab

### 2.2 Add Required Variables

Add these **three variables**:

#### Variable 1: APP_STORE_CONNECT_API_KEY
```
Variable name: APP_STORE_CONNECT_API_KEY
Variable value: [PASTE ENTIRE .p8 FILE CONTENT HERE]
Variable group: (leave empty)
Secure: ✅ Check this box
```

#### Variable 2: APP_STORE_CONNECT_KEY_ID
```
Variable name: APP_STORE_CONNECT_KEY_ID
Variable value: A1B2C3D4E5 (your Key ID)
Variable group: (leave empty)
Secure: ❌ Leave unchecked
```

#### Variable 3: APP_STORE_CONNECT_ISSUER_ID
```
Variable name: APP_STORE_CONNECT_ISSUER_ID
Variable value: 12345678-1234-1234-1234-123456789abc (your Issuer ID)
Variable group: (leave empty)
Secure: ❌ Leave unchecked
```

## 📱 Step 3: Set Up TestFlight Beta Groups (Optional)

### 3.1 Create Beta Group in App Store Connect
1. Go to [App Store Connect → TestFlight](https://appstoreconnect.apple.com/testflight)
2. Click **"Internal Testing"** tab
3. Click **"+"** to create a new group
4. Name it **"Internal Testers"**
5. Add your test users

### 3.2 Update Codemagic Configuration
The workflow is already configured to use this group:
```yaml
beta_groups:
  - "Internal Testers"
```

## 🚀 Step 4: Test Your Automated Publishing

### 4.1 Trigger a Build
1. Go to your Codemagic app dashboard
2. Click **"Start Build"**
3. Select **"ios-capacitor-build"** workflow
4. Click **"Start Build"**

### 4.2 Monitor the Build
1. Watch the build logs in real-time
2. The build will:
   - ✅ Build your Next.js app
   - ✅ Sync with Capacitor
   - ✅ Create iOS archive
   - ✅ Export IPA file
   - ✅ **Auto-upload to TestFlight** ⬅️ NEW!

### 4.3 Verify in TestFlight
1. Go to [App Store Connect → TestFlight](https://appstoreconnect.apple.com/testflight)
2. Check **"iOS Builds"** tab
3. Your new build should appear automatically
4. Wait 10-15 minutes for processing

## 📊 What Happens Automatically

Once configured, every build will:

1. **Build Process** (15-30 minutes)
   - Install dependencies
   - Build Next.js production app
   - Sync with Capacitor
   - Install CocoaPods
   - Build iOS archive
   - Export signed IPA

2. **Automated Publishing** (2-3 minutes)
   - Upload IPA to App Store Connect
   - Submit to TestFlight
   - Add to "Internal Testers" group
   - Send email notifications

3. **Email Notifications**
   - Success/failure emails to: `info@cubstechnical.com`

## 🔧 Troubleshooting

### Publishing Fails?
**Check these:**

1. **API Key Format**: Ensure `.p8` file content is pasted correctly (no extra spaces)
2. **Key ID**: Verify it matches App Store Connect (case-sensitive)
3. **Issuer ID**: Verify it matches your account
4. **Bundle ID**: Ensure `com.cubstechnical.admin` matches your App Store Connect app

### Build Succeeds but Publishing Fails?
**Common issues:**

1. **Beta Group Missing**: Create "Internal Testers" group in App Store Connect
2. **Permissions**: Ensure API key has "App Manager" access
3. **Bundle ID Mismatch**: Verify bundle ID matches your App Store Connect app

### TestFlight Processing Takes Too Long?
- **Normal**: 10-15 minutes
- **Check Status**: Look for "Processing" vs "Ready to Test"
- **Refresh Page**: Sometimes the page needs a refresh

## 📋 Complete Workflow Summary

```
Git Push → Codemagic Build → iOS Archive → Auto Upload → TestFlight → Email Notification
```

### Manual Steps (One-time Setup):
1. ✅ Create App Store Connect API Key
2. ✅ Configure Codemagic environment variables
3. ✅ Set up TestFlight beta group
4. ✅ Test the automated workflow

### Automated Steps (Every Build):
1. ✅ Code push triggers build
2. ✅ Codemagic builds iOS app
3. ✅ IPA uploaded to TestFlight automatically
4. ✅ Testers get email notifications
5. ✅ Build available in TestFlight app

## 🎯 Pro Tips

- **Build Frequency**: Every push to main branch
- **Build Time**: 15-30 minutes total
- **Free Tier**: 500 builds/month with Codemagic
- **Notifications**: Get emails on every build status
- **Parallel Builds**: Multiple builds can run simultaneously

## 📞 Need Help?

**If automated publishing fails:**

1. **Check Codemagic Build Logs** - Look for specific error messages
2. **Verify Environment Variables** - Ensure all three are set correctly
3. **Test Manual Upload** - Download IPA and upload manually to verify it works
4. **Contact Support** - Codemagic has excellent documentation

**Your automated iOS publishing is now ready!** 🚀

Every time you push code, Codemagic will build your iOS app and automatically publish it to TestFlight. No Mac required!
