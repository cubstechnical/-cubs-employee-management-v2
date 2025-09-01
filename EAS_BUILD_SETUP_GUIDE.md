# EAS Build Setup Guide for Capacitor Project

This guide will help you set up Expo Application Services (EAS) Build for your Capacitor project, allowing you to build iOS apps without needing a Mac.

## Prerequisites

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev)
2. **Apple Developer Account**: Required for iOS builds
3. **App Store Connect API Key**: For automated submissions

## Quick Setup

### 1. Install Dependencies

```bash
npm install
node scripts/setup-eas-build.js
```

### 2. Login to Expo

```bash
eas login
```

### 3. Configure Your Project

```bash
eas build:setup
```

This will guide you through setting up:
- iOS credentials (provisioning profiles, certificates)
- Android credentials (keystore)
- App Store Connect API key

## Manual iOS Credentials Setup

### Create App Store Connect API Key

1. Go to [App Store Connect](https://appstoreconnect.apple.com/access/api)
2. Click "Keys" tab
3. Click the "+" button to create a new key
4. Enter a name and select "App Manager" access
5. Download the `.p8` file
6. Save it as `./private_keys/AuthKey.p8`
7. Note the **Key ID** and **Issuer ID**

### Configure EAS Credentials

```bash
# For iOS
eas credentials --platform ios

# For Android
eas credentials --platform android
```

## Environment Variables

Set these in your EAS dashboard or locally:

```bash
# Required for EAS Build
EXPO_APPLE_ID=your-apple-id@example.com
EXPO_APPLE_PASSWORD=your-app-specific-password
APP_STORE_CONNECT_KEY_ID=your-key-id
APP_STORE_CONNECT_ISSUER_ID=your-issuer-id

# Optional
NODE_ENV=production
EXPO_PUBLIC_API_URL=https://your-api-url.com
```

## Building Your App

### Development Build
```bash
npm run eas:build:preview
```

### Production Build for iOS
```bash
npm run eas:build:ios:production
```

### Production Build for Android
```bash
npm run eas:build:android:production
```

### Build for Both Platforms
```bash
npm run eas:build:production
```

## Submitting to App Stores

### Submit iOS to App Store
```bash
npm run eas:submit:ios
```

### Submit Android to Play Store
```bash
npm run eas:submit:android
```

## Project Configuration Files

### expo.json
Contains your app configuration including:
- App name and bundle identifier
- Icons and splash screens
- Platform-specific settings

### eas.json
Contains build profiles:
- `development`: For testing
- `preview`: For internal distribution
- `production`: For store submission

### capacitor.config.ts
Your existing Capacitor configuration (unchanged)

## Troubleshooting

### Common Issues

1. **"No provisioning profile found"**
   - Ensure your bundle identifier matches your Apple Developer account
   - Regenerate credentials: `eas credentials --platform ios`

2. **"App Store Connect API Key not found"**
   - Verify your `.p8` file is in `./private_keys/AuthKey.p8`
   - Check your Key ID and Issuer ID in environment variables

3. **Build fails with dependency issues**
   - Ensure all dependencies are compatible with EAS Build
   - Check the build logs for specific error messages

### Getting Help

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Forums](https://forums.expo.dev/)
- [Discord Community](https://discord.gg/expo)

## Advanced Configuration

### Custom Build Scripts

You can modify the build process by updating your `eas.json`:

```json
{
  "build": {
    "production": {
      "ios": {
        "resourceClass": "m-medium",
        "distribution": "store",
        "prebuildCommand": "npm run build:mobile"
      }
    }
  }
}
```

### Environment-Specific Builds

Create different configurations for staging/production:

```json
{
  "build": {
    "staging": {
      "extends": "production",
      "env": {
        "NODE_ENV": "staging"
      }
    }
  }
}
```

## Security Notes

- Never commit private keys or credentials to version control
- Use EAS secrets for sensitive environment variables
- Rotate App Store Connect API keys regularly
- Keep your Apple Developer account secure

## Next Steps

1. Test your build with `eas build --platform ios`
2. Submit a test build to TestFlight
3. Configure automated builds with GitHub Actions
4. Set up release channels for different environments

Happy building! 🎉
