import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export const useMobileApp = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if mobile device for responsive design
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    setIsMobile(isMobileDevice);

    // Check if running in Capacitor native environment
    const isCapacitorNative = !!(window as any).Capacitor?.isNativePlatform?.();
    setIsNative(isCapacitorNative);

    // Initialize Capacitor plugins if in native environment
    if (isCapacitorNative) {
      initializeCapacitorPlugins();
    }


  }, []);

  const initializeCapacitorPlugins = async () => {
    try {
      // Dynamic import to avoid errors in web environment
      const { App } = await import('@capacitor/app');
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      const { SplashScreen } = await import('@capacitor/splash-screen');

      // Configure status bar
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#111827' });

      // Hide splash screen after initialization
      await SplashScreen.hide();

      // Initialize push notifications
      try {
        const { PushNotificationService } = await import('@/lib/services/pushNotifications');
        await PushNotificationService.initialize();
      } catch (pushError) {
        console.log('Push notifications not available:', pushError);
      }

      // Handle Android back button
      App.addListener('backButton', ({ canGoBack }) => {
        const isMainRoute = pathname === '/' || pathname === '/dashboard' || pathname === '/employees' || pathname === '/documents';
        
        if (canGoBack && !isMainRoute) {
          // Go back in navigation history
          window.history.back();
        } else if (isMainRoute) {
          // On main routes, minimize the app instead of closing
          App.minimizeApp();
        } else {
          // Fallback navigation
          router.push('/');
        }
      });

      // Handle app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          // App came to foreground - refresh data if needed
          document.dispatchEvent(new CustomEvent('app-foreground'));
        } else {
          // App went to background - save any pending data
          document.dispatchEvent(new CustomEvent('app-background'));
        }
      });

      // Handle deep links
      App.addListener('appUrlOpen', ({ url }) => {
        // Parse the URL and navigate appropriately
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        
        if (path && path !== '/') {
          router.push(path);
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize Capacitor plugins:', error);
    }
  };

  return {
    isMobile,
    isNative,
  };
};
