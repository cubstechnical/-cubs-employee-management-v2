import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.cubstechnical.admin',
  appName: 'CUBS Employee Management',
  webDir: 'out', // Use static export output for mobile
  // Keep using local assets (webDir: 'out'), but allow in-app navigation to these domains
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'cubsgroups.com',
      '*.cubsgroups.com',
      's3.us-east-005.backblazeb2.com',
      '*.backblazeb2.com',
      'appassets.androidplatform.net'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000, // Show splash for 2 seconds minimum
      launchAutoHide: false, // Don't auto-hide, let app control when to hide
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
