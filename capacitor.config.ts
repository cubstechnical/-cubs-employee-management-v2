import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cubstechnical.admin',
  appName: 'CUBS Visa Management',
  webDir: 'out',
  server: {
    url: 'https://cubsgroups.com',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#111827",
      showSpinner: true,
      spinnerColor: "#ffffff"
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#111827'
    },
    Keyboard: {
      resize: 'body',
      style: 'dark'
    },
    App: {
      backButtonDefaultHref: 'exit'
    }
  },
  ios: {
    scheme: 'cubsvisamanagement',
    webContentsDebuggingEnabled: false,
    scrollEnabled: true,
    allowsLinkPreview: false,
    overrideUserAgent: 'CUBS-Visa-Management-App'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
