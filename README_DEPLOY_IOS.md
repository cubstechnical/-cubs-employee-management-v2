# 🚀 iOS Deployment Guide for Codemagic

This guide explains how to deploy the CUBS Employee Management iOS app to TestFlight using Codemagic CI/CD.

## 📋 Prerequisites

### Apple Developer Account Requirements
- **Apple Developer Program** membership ($99/year)
- **App Manager** or **Admin** role in App Store Connect
- **App Store Connect API Key** with appropriate permissions

### Required Apple Roles
1. **App Manager** - Can manage apps and upload builds
2. **Admin** - Full access to all features
3. **Developer** - Can create certificates and provisioning profiles

## 🔑 App Store Connect API Key Setup

### Step 1: Create API Key in App Store Connect
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **Users and Access** → **Keys** → **App Store Connect API**
3. Click **Generate API Key** or **+** button
4. Fill in the details:
   - **Name**: `Codemagic iOS Deployment`
   - **Access**: `App Manager` or `Admin`
   - **Apps**: Select your app or leave blank for all apps
5. Click **Generate**
6. **Download the .p8 file** (you can only download it once!)
7. Note down:
   - **Key ID** (10-character string)
   - **Issuer ID** (UUID format)

### Step 2: Configure Codemagic Integration
1. Go to [Codemagic](https://codemagic.io) and sign in
2. Navigate to **Teams** → **Integrations** → **Apple Developer Portal**
3. Click **Add integration**
4. Fill in the details:
   - **Integration name**: `Apple Developer Portal`
   - **Issuer ID**: Your App Store Connect Issuer ID
   - **Key ID**: Your API Key ID
   - **Private key**: Upload the .p8 file
5. Click **Add integration**

## 🏗️ Codemagic Workflow Configuration

### Available Workflows

#### 1. **iOS TestFlight Release** (Production)
- **Purpose**: Build signed IPA and upload to TestFlight
- **Trigger**: Manual or on push to `main` branch
- **Duration**: ~15-20 minutes
- **Output**: Signed IPA uploaded to TestFlight

#### 2. **iOS Simulator Build** (Testing)
- **Purpose**: Fast build validation without signing
- **Trigger**: Manual or on pull requests
- **Duration**: ~5-10 minutes
- **Output**: Unsigned app for simulator testing

### Environment Variables

The following variables are configured in `codemagic.yaml`:

```yaml
vars:
  BUNDLE_ID: "com.cubstechnical.admin"
  XCODE_WORKSPACE: "ios/App/App.xcworkspace"
  XCODE_SCHEME: "App"
  APP_STORE_APP_ID: "YOUR_APP_STORE_APP_ID"  # Replace with actual ID
```

### Required Codemagic Environment Variables

You need to set these in your Codemagic team settings:

1. **APP_STORE_APP_ID**: Your App Store Connect App ID (numeric)
   - Find this in App Store Connect → Your App → App Information
   - Example: `1234567890`

## 🚀 How to Trigger Builds

### Method 1: Manual Trigger
1. Go to your Codemagic app dashboard
2. Click **Start new build**
3. Select the workflow: **iOS TestFlight Release**
4. Choose the branch: `main`
5. Click **Start build**

### Method 2: Automatic Trigger
- Push to `main` branch automatically triggers the TestFlight release workflow
- Pull requests trigger the simulator build workflow

### Method 3: API Trigger
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CODEMAGIC_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"appId": "YOUR_APP_ID", "workflowId": "ios-testflight-release", "branch": "main"}' \
  https://api.codemagic.io/builds
```

## 📱 Build Process

### What Happens During Build
1. **Environment Setup**: Mac Mini M2 with latest Xcode
2. **Dependencies**: Install Node.js, npm, CocoaPods
3. **Web Build**: Build Next.js app with static export
4. **Capacitor Sync**: Copy web assets to iOS project
5. **iOS Dependencies**: Install CocoaPods dependencies
6. **Build Number**: Auto-increment build number
7. **Code Signing**: Apply provisioning profiles
8. **Archive**: Create signed IPA
9. **Upload**: Upload to TestFlight automatically

### Build Artifacts
- **App.ipa**: Signed iOS app ready for distribution
- **App.xcarchive**: Xcode archive with debug symbols
- **xcodebuild.log**: Detailed build logs

## 🧪 Testing the Build

### Before Production Release
1. **Run Simulator Build**: Test the build process without signing
2. **Check Build Logs**: Verify no errors in the build process
3. **Test on Device**: Use TestFlight for device testing

### TestFlight Testing
1. **Internal Testing**: Add team members to TestFlight
2. **External Testing**: Add external testers (up to 10,000)
3. **Beta Groups**: Organize testers into groups
4. **Feedback**: Collect feedback through TestFlight

## 🔧 Troubleshooting

### Common Issues

#### Build Fails with "No matching provisioning profile"
- **Solution**: Ensure Apple Developer Portal integration is properly configured
- **Check**: Bundle identifier matches in Xcode project and Codemagic

#### Build Fails with "Code signing error"
- **Solution**: Verify API key has correct permissions
- **Check**: App Manager or Admin role assigned

#### Upload Fails to TestFlight
- **Solution**: Check App Store Connect App ID is correct
- **Check**: App exists in App Store Connect

#### Build Takes Too Long
- **Solution**: Use Mac Mini M2 instance (already configured)
- **Check**: Build duration limit is set to 120 minutes

### Debug Steps
1. **Check Build Logs**: Look for specific error messages
2. **Verify Environment**: Ensure all environment variables are set
3. **Test Locally**: Run `npm run build:ios` locally to test
4. **Check Dependencies**: Ensure all npm and CocoaPods dependencies are up to date

## 📊 Monitoring and Notifications

### Email Notifications
- **Success**: Build completed and uploaded to TestFlight
- **Failure**: Build failed with error details
- **Recipients**: info@cubstechnical.com

### Build Status
- **In Progress**: Build is running
- **Success**: IPA uploaded to TestFlight
- **Failed**: Build failed, check logs
- **Cancelled**: Build was cancelled

## 🎯 Success Criteria

### Build Success Indicators
- ✅ **Build completes** within 120 minutes
- ✅ **IPA is generated** and signed
- ✅ **Upload to TestFlight** succeeds
- ✅ **Email notification** sent
- ✅ **App appears** in TestFlight within 15 minutes

### TestFlight Success Indicators
- ✅ **App appears** in TestFlight builds
- ✅ **Processing completes** (10-15 minutes)
- ✅ **Ready for testing** status
- ✅ **Testers can install** the app

## 📞 Support

### Codemagic Support
- **Documentation**: [Codemagic Docs](https://docs.codemagic.io)
- **Community**: [Codemagic Community](https://community.codemagic.io)
- **Support**: [Codemagic Support](https://codemagic.io/contact)

### Apple Developer Support
- **Documentation**: [Apple Developer Docs](https://developer.apple.com/documentation)
- **Support**: [Apple Developer Support](https://developer.apple.com/support)

## 🔄 Next Steps

After successful TestFlight deployment:

1. **Internal Testing**: Test the app thoroughly
2. **External Testing**: Add external testers if needed
3. **App Store Submission**: Prepare for App Store review
4. **Release**: Submit for App Store review

---

**Last Updated**: $(date)  
**Version**: 1.0  
**Status**: ✅ Ready for Production
