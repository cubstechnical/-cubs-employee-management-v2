'use client';

import { useEffect } from 'react';
import { log } from '@/lib/utils/productionLogger';

export default function PWARegistration() {
  useEffect(() => {
    // Register service worker for PWA functionality
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

    // Handle PWA install prompt (let browser handle it naturally)
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

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return null; // This component doesn't render anything visible
}



