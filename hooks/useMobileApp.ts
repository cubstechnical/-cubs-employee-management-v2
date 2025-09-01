import { useEffect, useState } from 'react';

export function useMobileApp() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const initializeMobileApp = async () => {
      try {
        // Check if running on web platform
        const isWeb = typeof window !== 'undefined' && 
          (!(window as any).Capacitor || 
           window.location.protocol === 'http:' || 
           window.location.protocol === 'https:');

        // Skip mobile-specific initialization on web platform
        if (isWeb) {
          return;
        }

        // Dynamic imports for better code splitting
        const [
          { App },
          { StatusBar, Style },
          { SplashScreen }
        ] = await Promise.all([
          import('@capacitor/app'),
          import('@capacitor/status-bar'),
          import('@capacitor/splash-screen')
        ]);

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
  }, [isClient]);
}
