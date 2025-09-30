import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.cubstechnical.employee',
  appName: 'CUBS Employee Management',
  webDir: 'out', // Must match Next.js static export output
  bundledWebRuntime: false, // Use local web runtime
  server: {
    androidScheme: 'https', // Required for Android
    iosScheme: 'cubs-employee',
    // Remove server.url for production (only for development)
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000, // Increased duration for better loading experience
      launchAutoHide: true,
      backgroundColor: "#111827",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true, // Show spinner to indicate loading
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#d3194f",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
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
    overrideUserAgent: 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36 CUBS-Employee-Management',
    // Enhanced Android optimizations
    backgroundColor: '#111827',
  }
};

export default config;
