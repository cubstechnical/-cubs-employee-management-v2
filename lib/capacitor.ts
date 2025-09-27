import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { log } from '@/lib/utils/productionLogger';

export class CapacitorService {
  static async initialize() {
    // Always run Capacitor initialization - check for native platform inside try block
    try {
      log.info('Initializing Capacitor for mobile app...');

      // Configure status bar with error handling (only on native platforms)
      try {
        if (Capacitor.isNativePlatform()) {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#111827' });
          log.info('Status bar configured successfully');
        }
      } catch (error) {
        log.warn('Status bar configuration failed:', error);
      }

      // Configure splash screen with delay for better UX
      try {
        if (Capacitor.isNativePlatform()) {
          // Add a longer delay to ensure splash screen is visible and app is ready
          setTimeout(async () => {
            try {
              await SplashScreen.hide();
              log.info('Splash screen hidden');
            } catch (hideError) {
              log.warn('Error hiding splash screen:', hideError);
            }
          }, 2000); // Increased delay for better mobile experience
        }
      } catch (error) {
        log.warn('Splash screen configuration failed:', error);
      }

      // Configure keyboard with error handling (only on native platforms)
      try {
        if (Capacitor.isNativePlatform()) {
          await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
          await Keyboard.setStyle({ style: KeyboardStyle.Dark });
          log.info('Keyboard configured successfully');
        }
      } catch (error) {
        log.warn('Keyboard configuration failed:', error);
      }

      // Handle app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        log.info('App state changed. Is active?', isActive);
        // Handle app state changes for better mobile experience
        if (isActive) {
          // App became active, refresh data if needed
          log.info('App became active, refreshing data...');
        }
      });

      // Handle back button (Android) with better logic
      App.addListener('backButton', ({ canGoBack }) => {
        log.info('Back button pressed, canGoBack:', canGoBack);
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
        log.info('App URL opened:', data);
        // Handle deep links here
      });

      log.info('Capacitor initialized successfully');
    } catch (error) {
      log.error('Error initializing Capacitor:', error);
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
        log.error('Error hiding splash screen:', error);
      }
    }
  }

  static async showSplashScreen() {
    if (Capacitor.isNativePlatform()) {
      try {
        await SplashScreen.show();
      } catch (error) {
        log.error('Error showing splash screen:', error);
      }
    }
  }
}
