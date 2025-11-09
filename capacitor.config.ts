import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.cubstechnical.admin',
  appName: 'CUBS Employee Management',
  webDir: 'out', // Use static export output for mobile
  server: {
    androidScheme: 'https', // Required for Android
    iosScheme: 'cubs-employee',
    // IMPORTANT: No 'url' property = app uses local files (native app behavior)
    // Setting 'url' makes the app load from the web, which causes:
    // 1. Links opening in browser instead of staying in app
    // 2. Slower performance (requires internet)
    // 3. API routes won't work (405 errors)
    // 
    // For production native apps, use local files (no 'url' property)
    // The app will be self-contained and work offline
    // 
    // For development/testing, you can temporarily add:
    // url: 'http://localhost:3000' or 'https://cubsgroups.com'
    // 
    // To update the app, rebuild and release a new version to App Store
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0, // No splash screen duration
      launchAutoHide: true,
      backgroundColor: "#ffffff", // White background
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false, // No spinner
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff", // White spinner (invisible)
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: false, // No dialog
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#111827',
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
    App: {
      // App configuration
    }
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#111827',
    allowsLinkPreview: false,
    handleApplicationNotifications: true,
    scheme: 'CUBS Employee Management',
    // Enhanced iOS optimizations
    preferredContentMode: 'mobile', // Optimize for mobile screens
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    appendUserAgent: 'CUBS-Employee-Management',
    // Don't override user agent - it breaks Capacitor's internal file serving
    // Enhanced Android optimizations
    backgroundColor: '#111827',
  }
};

export default config;
