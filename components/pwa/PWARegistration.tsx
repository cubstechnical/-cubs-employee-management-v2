'use client';

import { useEffect } from 'react';
import { log } from '@/lib/utils/productionLogger';
import { isCapacitorApp } from '@/utils/mobileDetection';

export default function PWARegistration() {
  useEffect(() => {
    // Skip service worker registration in Capacitor apps
    if (isCapacitorApp()) {
      log.info('Skipping PWA registration in Capacitor app');
      return;
    }

    // Register service worker for PWA functionality (web only)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            log.info('SW registered: ', registration);
          })
          .catch((registrationError) => {
            log.info('SW registration failed: ', registrationError);
          });
      });
    }

    // Handle PWA install prompt (web only, not in Capacitor apps)
    if (!isCapacitorApp()) {
      const handleBeforeInstallPrompt = (e: Event) => {
        // Don't prevent default - let browser show native install prompt
        log.info('PWA install prompt available');
      };

      const handleAppInstalled = () => {
        log.info('PWA was installed');
      };

      // Add event listeners for logging purposes only
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      // Cleanup (web only)
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  return null; // This component doesn't render anything visible
}



