import { useEffect, useState } from 'react';
import { log } from '@/lib/utils/productionLogger';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [isPWA, setIsPWA] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const checkPWA = () => {
      // More comprehensive PWA detection
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as any).standalone ||
                              document.referrer.includes('android-app://');
      
      // Check for mobile browser in PWA-like mode
      const isMobileBrowser = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 1024;
      
      // Also check for PWA indicators
      const isPWAIndicator = window.location.protocol === 'https:' && 
                            ('serviceWorker' in navigator) &&
                            (window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as any).standalone);
      
      // Enhanced PWA detection for mobile browsers
      const isMobilePWA = isMobileBrowser && isTouchDevice && (isSmallScreen || isStandaloneMode);
      
      const pwaMode = isStandaloneMode || isPWAIndicator || isMobilePWA;
      
      setIsStandalone(isStandaloneMode);
      setIsPWA(pwaMode);
      
      log.info('🔍 Enhanced PWA Detection:', {
        isStandaloneMode,
        isPWAIndicator,
        isMobilePWA,
        pwaMode,
        displayMode: window.matchMedia('(display-mode: standalone)').matches,
        standalone: (window.navigator as any).standalone,
        referrer: document.referrer,
        protocol: window.location.protocol,
        serviceWorker: 'serviceWorker' in navigator,
        isMobileBrowser,
        isTouchDevice,
        isSmallScreen,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      });
    };

    // Check if app is installable
    const checkInstallability = () => {
      // Listen for the beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        // Don't prevent default - let the PWARegistration component handle it
        setInstallPrompt(e as any);
        setIsInstallable(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Check if already installed
      window.addEventListener('appinstalled', () => {
        setIsInstallable(false);
        setInstallPrompt(null);
        log.info('PWA was installed');
      });

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    };

    // Check for mobile device
    const checkMobile = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                      window.innerWidth < 768;
      
      if (isMobile) {
        // Add mobile-specific classes
        document.body.classList.add('mobile-device');
      }
    };

    checkPWA();
    checkMobile();
    const cleanup = checkInstallability();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      checkPWA();
    };

    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      cleanup();
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        log.info('User accepted the install prompt');
        setIsInstallable(false);
        setInstallPrompt(null);
        return true;
      } else {
        log.info('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      log.error('Error during app installation:', error);
      return false;
    }
  };

  return {
    isPWA,
    isInstallable,
    isStandalone,
    installApp,
    installPrompt: !!installPrompt
  };
}
