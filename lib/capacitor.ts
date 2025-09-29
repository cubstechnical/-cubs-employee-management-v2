import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { log } from '@/lib/utils/productionLogger';

export class CapacitorService {
  private static isInitialized = false;

  static async initialize() {
    // Prevent multiple initializations
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

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

      // Configure splash screen with proper timing
      try {
        // Always dispatch capacitor-ready event after initialization, regardless of platform
        // This ensures the loading screen knows when initialization is complete
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            log.info('Capacitor initialization complete, dispatching capacitor-ready event');

            // Dispatch multiple events to ensure the loading screen gets notified
            window.dispatchEvent(new CustomEvent('capacitor-ready'));
            window.dispatchEvent(new CustomEvent('app-initialized'));
            window.dispatchEvent(new CustomEvent('mobile-app-ready'));

            // Also try to hide splash screen if on native platform
            if (Capacitor.isNativePlatform()) {
              SplashScreen.hide().catch(hideError => {
                log.warn('Error hiding splash screen:', hideError);
              });
            }

            // Add immediate visual feedback for debugging
            if (typeof window !== 'undefined') {
              // Use a very brief timeout to avoid blocking
              setTimeout(() => {
                try {
                  // This will show briefly if the app is responsive
                  console.log('✅ Capacitor events dispatched successfully');
                } catch (e) {
                  // Ignore console errors
                }
              }, 100);
            }
          }
        }, 500); // Even faster initialization
      } catch (error) {
        log.warn('Splash screen configuration failed:', error);
        // Even if splash screen fails, dispatch the ready event
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('capacitor-ready'));
            window.dispatchEvent(new CustomEvent('app-initialized'));
            window.dispatchEvent(new CustomEvent('mobile-app-ready'));
          }, 1000);
        }
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
          if (typeof window !== 'undefined' && confirm('Are you sure you want to exit the app?')) {
            App.exitApp();
          }
        } else {
          // Guard window.history access for SSR compatibility
          if (typeof window !== 'undefined' && window.history) {
            window.history.back();
          }
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
