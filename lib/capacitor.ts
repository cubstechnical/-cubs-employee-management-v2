import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import { App } from '@capacitor/app';

export class CapacitorService {
  static async initialize() {
    if (!Capacitor.isNativePlatform()) {
      return; // Only run on native platforms
    }

    try {
      // Configure status bar
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#111827' });

      // Configure splash screen
      await SplashScreen.hide();

      // Configure keyboard
      await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
      await Keyboard.setStyle({ style: KeyboardStyle.Dark });

      // Handle app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active?', isActive);
      });

      // Handle back button (Android)
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp();
        } else {
          window.history.back();
        }
      });

      console.log('Capacitor initialized successfully');
    } catch (error) {
      console.error('Error initializing Capacitor:', error);
    }
  }

  static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  static getPlatform(): string {
    return Capacitor.getPlatform();
  }

  static async hideSplashScreen() {
    if (Capacitor.isNativePlatform()) {
      try {
        await SplashScreen.hide();
      } catch (error) {
        console.error('Error hiding splash screen:', error);
      }
    }
  }

  static async showSplashScreen() {
    if (Capacitor.isNativePlatform()) {
      try {
        await SplashScreen.show();
      } catch (error) {
        console.error('Error showing splash screen:', error);
      }
    }
  }
}
