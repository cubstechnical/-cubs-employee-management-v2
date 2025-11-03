import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.cubstechnical.employee',
  appName: 'CUBS Employee Management',
  webDir: 'out', // Use static export output for mobile
  server: {
    androidScheme: 'https', // Required for Android
    iosScheme: 'cubs-employee',
    // Load production site directly so web deploys auto-update the app UI
    url: 'https://cubsgroups.com',
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
