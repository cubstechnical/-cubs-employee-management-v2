import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

// Check if running on web platform
const isWeb = typeof window !== 'undefined' && (!(window as any).Capacitor || window.location.protocol === 'http:' || window.location.protocol === 'https:');

export function useMobileApp() {
  useEffect(() => {
    const initializeMobileApp = async () => {
      try {
        // Skip mobile-specific initialization on web platform
        if (isWeb) {
          return;
        }

        // Set up status bar
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#111827' });

        // Hide splash screen
        await SplashScreen.hide();

        // Set up app listeners
        App.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            App.exitApp();
          }
        });

        App.addListener('appStateChange', ({ isActive }) => {
          // Handle app state changes silently
        });

        App.addListener('appUrlOpen', (data) => {
          // Handle deep links silently
        });
      } catch (error) {
        // Handle mobile initialization errors silently
      }
    };

    initializeMobileApp();
  }, []);
}
