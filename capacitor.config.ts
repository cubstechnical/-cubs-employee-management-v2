import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cubstechnical.admin',
  appName: 'CUBS Visa Management',
  webDir: 'out',
  server: {
    url: 'https://cubsgroups.com',
    cleartext: false,
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      keystorePassword: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    }
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'CUBS Visa Management',
    webContentsDebuggingEnabled: false,
    scrollEnabled: true,
    allowsLinkPreview: false,
    overrideUserAgent: 'CUBSAdmin/1.0 Mobile Safari'
  },
  plugins: {
    App: {
      handleDeepLinksAutomatically: true,
      hardwareBackButtonNavigation: true
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#111827',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: false
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'dark',
      backgroundColor: '#111827',
      animated: true
    },
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
