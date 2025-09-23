import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import { App } from '@capacitor/app';

export class CapacitorService {
  static async initialize() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Not running on native platform, skipping Capacitor initialization');
      return; // Only run on native platforms
    }

    try {
      console.log('Initializing Capacitor for mobile app...');
      
      // Configure status bar with error handling
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#111827' });
        console.log('Status bar configured successfully');
      } catch (error) {
        console.warn('Status bar configuration failed:', error);
      }

      // Configure splash screen with delay for better UX
      try {
        // Add a small delay to ensure splash screen is visible
        setTimeout(async () => {
          await SplashScreen.hide();
          console.log('Splash screen hidden');
        }, 1000);
      } catch (error) {
        console.warn('Splash screen configuration failed:', error);
      }

      // Configure keyboard with error handling
      try {
        await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
        await Keyboard.setStyle({ style: KeyboardStyle.Dark });
        console.log('Keyboard configured successfully');
      } catch (error) {
        console.warn('Keyboard configuration failed:', error);
      }

      // Handle app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active?', isActive);
        // Handle app state changes for better mobile experience
        if (isActive) {
          // App became active, refresh data if needed
          console.log('App became active, refreshing data...');
        }
      });

      // Handle back button (Android) with better logic
      App.addListener('backButton', ({ canGoBack }) => {
        console.log('Back button pressed, canGoBack:', canGoBack);
        if (!canGoBack) {
          // Show confirmation before exiting
          if (confirm('Are you sure you want to exit the app?')) {
            App.exitApp();
          }
        } else {
          window.history.back();
        }
      });

      // Handle app URL open for deep linking
      App.addListener('appUrlOpen', (data) => {
        console.log('App URL opened:', data);
        // Handle deep links here
      });

      console.log('Capacitor initialized successfully');
    } catch (error) {
      console.error('Error initializing Capacitor:', error);
      // Don't throw error, just log it to prevent app crashes
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
