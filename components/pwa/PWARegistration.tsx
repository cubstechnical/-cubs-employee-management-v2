'use client';

import { useEffect, useState } from 'react';
import { log } from '@/lib/utils/productionLogger';

export default function PWARegistration() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

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

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      log.info('PWA was installed');
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      log.info('User accepted the PWA install prompt');
      setDeferredPrompt(null);
    } else {
      log.info('User dismissed the PWA install prompt');
    }
  };

  return (
    <div id="pwa-install-button" className={`${!deferredPrompt || isInstalled ? 'hidden' : ''}`}>
      <button
        onClick={handleInstallClick}
        className="fixed bottom-4 right-4 z-50 bg-[#d3194f] text-white px-4 py-2 rounded-full shadow-lg hover:bg-[#b81542] transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Install App
      </button>
    </div>
  );
}



