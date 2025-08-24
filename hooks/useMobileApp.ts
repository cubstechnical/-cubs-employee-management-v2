import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export function useMobileApp() {
  useEffect(() => {
    const initializeMobileApp = async () => {
      try {
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
          console.log('App state changed. Is active?', isActive);
        });

        App.addListener('appUrlOpen', (data) => {
          console.log('App opened with URL:', data.url);
        });

        console.log('Mobile app initialized successfully');
      } catch (error) {
        console.error('Error initializing mobile app:', error);
      }
    };

    initializeMobileApp();
  }, []);
}
