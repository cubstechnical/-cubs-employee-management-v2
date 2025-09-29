import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.cubstechnical.employee',
  appName: 'CUBS Employee Management',
  webDir: 'out', // Always use out directory for Capacitor builds
  server: {
    // Enhanced server configuration for better mobile performance
    hostname: 'localhost',
    iosScheme: 'cubs-employee',
    androidScheme: 'https',
    allowNavigation: [
      'cubsgroups.com',
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '192.168.1.0/24', // Allow local network access
      '10.0.0.0/8',     // Allow local network access
    ],
    cleartext: true, // Allow HTTP for development
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
