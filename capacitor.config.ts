import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cubstechnical.admin',
  appName: 'CUBS Visa Management',
  webDir: 'dist',
  server: {
    url: 'https://cubsgroups.com',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#111827",
      showSpinner: true,
      spinnerColor: "#ffffff",
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small"
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#111827',
      overlaysWebView: false
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },
    App: {
      backButtonDefaultHref: 'exit',
      handleDeepLinksAutomatically: true,
      hardwareBackButtonNavigation: true
    },
    Browser: {
      presentationStyle: 'popover'
    }
  },
  ios: {
    scheme: 'cubsvisamanagement',
    webContentsDebuggingEnabled: false,
    scrollEnabled: true,
    allowsLinkPreview: false,
    overrideUserAgent: 'CUBS-Visa-Management-App',
    contentInset: 'automatic',
    backgroundColor: '#111827'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#111827',
    appendUserAgent: 'CUBS-Visa-Management-App',
    overrideUserAgent: 'CUBS-Visa-Management-App'
  }
};

export default config;
