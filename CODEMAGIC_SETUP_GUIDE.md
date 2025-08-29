# Codemagic Setup Guide for iOS Builds (No Mac Required)

This guide will help you set up Codemagic to build your iOS app without needing a Mac computer.

## 📋 Prerequisites

1. **Codemagic Account**: Sign up at [codemagic.io](https://codemagic.io)
2. **Apple Developer Account**: Required for App Store Connect
3. **App Store Connect API Key**: For automated publishing (optional)

## 🚀 Step-by-Step Setup

### Step 1: Connect Your Repository

1. **Go to Codemagic Dashboard**: [codemagic.io/apps](https://codemagic.io/apps)
2. **Click "Add Application"**
3. **Connect your Git repository** (GitHub, GitLab, Bitbucket)
4. **Select your repository** containing this project

### Step 2: Configure Build Settings

1. **Workflow**: Select `ios-capacitor-build`
2. **Branch**: Choose your main branch (usually `main` or `master`)
3. **Build Triggers**:
   - ✅ Push to branch
   - ✅ Pull request
   - ✅ Manual trigger

### Step 3: Set Up Environment Variables

1. **Go to "Environment Variables"** in your app settings
2. **Add the following variables** (use the template file as reference):

#### Required Variables:
```
NODE_ENV=production
CI=true
```

#### Optional (for publishing):
```
APP_STORE_CONNECT_API_KEY=<your-private-key-content>
APP_STORE_CONNECT_KEY_ID=<your-key-id>
APP_STORE_CONNECT_ISSUER_ID=<your-issuer-id>
```

### Step 4: Configure Code Signing (Optional)

For **automatic publishing**, you'll need:

1. **App Store Connect API Key**:
   - Go to [App Store Connect → Users and Access → Keys](https://appstoreconnect.apple.com/access/api)
   - Create a new API Key with "App Manager" access
   - Download the `.p8` file
   - Copy the entire content of the `.p8` file to `APP_STORE_CONNECT_API_KEY`
   - Note the Key ID and Issuer ID

2. **Add to Environment Variables**:
   ```
   APP_STORE_CONNECT_API_KEY=<content-of-your-p8-file>
   APP_STORE_CONNECT_KEY_ID=<your-key-id>
   APP_STORE_CONNECT_ISSUER_ID=<your-issuer-id>
   ```

### Step 5: Test Your First Build

1. **Click "Start Build"** in Codemagic
2. **Select the `ios-capacitor-build` workflow**
3. **Monitor the build logs** in real-time
4. **Download the IPA file** from the artifacts section

## 📱 Manual Upload Process

If you don't set up automatic publishing, here's how to manually upload:

### After Build Completes:

1. **Download the IPA file** from Codemagic artifacts
2. **Go to App Store Connect**: [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
3. **Navigate to "TestFlight" → "iOS Builds"**
4. **Click "+" to upload a new build**
5. **Drag and drop your `.ipa` file**
6. **Wait 10-15 minutes** for processing
7. **Add to TestFlight** for testing

## 🔧 Troubleshooting

### Build Fails with "Scheme not found":

**Solution**: The workflow automatically handles the Xcode scheme configuration.

### Pod Install Fails:

**Solution**: Make sure your `ios/App/Podfile` is properly configured.

### Archive Creation Fails:

**Solution**: Check that your Capacitor configuration is correct.

### Publishing Fails:

**Solution**:
1. Verify your App Store Connect API Key is correct
2. Ensure the bundle identifier matches your App Store Connect app
3. Check that you have the right permissions

## 📊 Build Workflow Details

The `ios-capacitor-build` workflow does:

1. **Install Dependencies**: `npm ci`
2. **Build Next.js**: `npm run build`
3. **Sync Capacitor**: `npx cap sync ios`
4. **Install Pods**: `pod install`
5. **Build iOS App**: Creates unsigned archive
6. **Export IPA**: Creates `.ipa` file for upload
7. **Verify**: Confirms build artifacts

## 🎯 What You'll Get

After successful build:
- ✅ **IPA file** ready for App Store Connect
- ✅ **Build artifacts** for download
- ✅ **Email notifications** on build status
- ✅ **TestFlight ready** builds

## 🚀 Next Steps

1. **Set up your first build** and test it
2. **Configure publishing** for automatic uploads
3. **Set up Android builds** using the existing workflow
4. **Configure web deployment** for your Next.js app

## 💡 Pro Tips

- **Build Time**: iOS builds typically take 15-30 minutes
- **Storage**: Codemagic provides 500 free builds per month
- **Parallel Builds**: You can run multiple builds simultaneously
- **Webhooks**: Integrate with Slack/Discord for notifications

## 📞 Support

- **Codemagic Docs**: [docs.codemagic.io](https://docs.codemagic.io)
- **App Store Connect**: [developer.apple.com/support/app-store-connect](https://developer.apple.com/support/app-store-connect)
- **Capacitor Docs**: [capacitorjs.com/docs](https://capacitorjs.com/docs)

Your iOS build setup is now ready! 🎉