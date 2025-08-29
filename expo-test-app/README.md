# CUBS Visa Management - Development Test App

This is a development testing app built with Expo for testing with Expo Go on mobile devices.

## How to Use with Expo Go

### Prerequisites
1. Download **Expo Go** app from:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Testing Your App

1. **Start the development server** (already running):
   ```bash
   cd expo-test-app
   npx expo start --tunnel
   ```

2. **Scan the QR Code**:
   - The terminal will show a QR code
   - Open Expo Go on your phone
   - Scan the QR code with your phone's camera
   - The app will load automatically

3. **Test Features**:
   - Server connectivity test
   - Mobile UI preview
   - Development testing

## What This App Does

- **Server Connection Test**: Tests connectivity to your Next.js backend
- **Mobile UI Preview**: Preview how your app looks on mobile
- **Development Testing**: Test new features before building with Capacitor

## Your Main App

Your main application is built with:
- **Next.js** for the web interface
- **Capacitor** for mobile builds
- **EAS Build** for iOS builds without Mac

### Building Production App

```bash
# Go back to main project directory
cd ..

# Build for iOS (production)
npm run eas:build:ios:production

# Submit to App Store
npm run eas:submit:ios
```

## Development Workflow

1. **Test with Expo Go**: Use this app for quick development testing
2. **Build with EAS**: Use EAS Build for production iOS builds
3. **Submit to Stores**: Submit your built apps to app stores

## Troubleshooting

### Can't connect to server?
- Check your internet connection
- Verify the server URL in the app
- Make sure your Next.js server is running

### QR code not working?
- Try restarting the development server
- Use `--tunnel` flag for network issues
- Check firewall settings

### App not loading?
- Clear Expo Go app cache
- Restart the development server
- Check console for error messages

## Support

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Go FAQ](https://docs.expo.dev/get-started/expo-go/)
- [EAS Build Guide](https://docs.expo.dev/build/introduction/)
