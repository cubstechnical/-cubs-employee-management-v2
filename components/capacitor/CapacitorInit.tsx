'use client';

import { useEffect, useState } from 'react';
import { CapacitorService } from '@/lib/capacitor';
import { log } from '@/lib/utils/productionLogger';

export default function CapacitorInit() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let initTimeout: NodeJS.Timeout;

    const initializeCapacitor = async () => {
      try {
        log.info('🚀 Starting Capacitor initialization...');

        // Initialize Capacitor service
        await CapacitorService.initialize();
        setIsInitialized(true);

        // Check if we're in a mobile app environment with better detection
        if (typeof window !== 'undefined') {
          const checkCapacitorEnvironment = () => {
            try {
              const isCapacitorAvailable = !!(window.Capacitor);
              const isNativePlatform = !!(window.Capacitor && (window.Capacitor as any).isNativePlatform && (window.Capacitor as any).isNativePlatform());
              const platform = (window.Capacitor as any)?.getPlatform ? (window.Capacitor as any).getPlatform() : 'unknown';

              log.info('🔍 Capacitor environment detection:', {
                isCapacitorAvailable,
                isNativePlatform,
                platform,
                userAgent: navigator.userAgent
              });

              if (isCapacitorAvailable && isNativePlatform) {
                log.info('📱 Native mobile app detected - enabling full mobile features');

                // Mark as fully initialized after a short delay to ensure everything is ready
                initTimeout = setTimeout(() => {
                  log.info('✅ Native mobile app fully initialized and ready');
                  // Dispatch custom event for other components to listen to
                  window.dispatchEvent(new CustomEvent('capacitorReady'));
                }, 500);
              } else if (isCapacitorAvailable) {
                log.info('🌐 PWA/Capacitor web environment detected');
                // Still dispatch ready event for PWA compatibility
                window.dispatchEvent(new CustomEvent('capacitorReady'));
              } else {
                log.info('⚠️ Standard web environment - no Capacitor detected');
                // Still dispatch ready event for consistency
                window.dispatchEvent(new CustomEvent('capacitorReady'));
              }
            } catch (error) {
              log.error('❌ Error during Capacitor environment detection:', error);
              // Still dispatch ready event to prevent app from hanging
              window.dispatchEvent(new CustomEvent('capacitorReady'));
            }
          };

          // Wait for DOM to be ready, then check environment
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkCapacitorEnvironment);
          } else {
            checkCapacitorEnvironment();
          }
        }
      } catch (error) {
        log.error('❌ Capacitor initialization failed:', error);
        // Ensure we still mark as initialized to prevent app from hanging
        setIsInitialized(true);
        window.dispatchEvent(new CustomEvent('capacitorReady'));
      }
    };

    initializeCapacitor();

    return () => {
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
    };
  }, []);

  return null; // This component doesn't render anything
}



