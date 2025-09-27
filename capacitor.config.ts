import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.cubstechnical.employee',
  appName: 'CUBS Employee Management',
  webDir: 'out',
  server: {
    // PRODUCTION: Use deployed web app URL
    // // // url: 'https://your-deployed-app.vercel.app', // Production URL
    
    // DEVELOPMENT: Use network IP (mobile devices can't access localhost!)
    url: 'http://192.168.29.12:3000', // Development: network IP for mobile access
    
    androidScheme: 'https',
    allowNavigation: [
      'http://localhost:3000',
      'http://192.168.29.12:3000', // Your network IP
      'https://cubsgroups.com',
      'https://*.cubsgroups.com',
      'https://f005.backblazeb2.com',
      'https://s3.us-east-005.backblazeb2.com'
    ],
    cleartext: true // Allow localhost for development
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#111827",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
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
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    appendUserAgent: 'CUBS-Employee-Management',
    overrideUserAgent: 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36 CUBS-Employee-Management',
  }
};

export default config;
