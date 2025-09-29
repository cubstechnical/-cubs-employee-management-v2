'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { log } from '@/lib/utils/productionLogger';

interface IOSLoadingScreenProps {
  children: React.ReactNode;
}

export default function IOSLoadingScreen({ children }: IOSLoadingScreenProps) {
  const [isIOSReady, setIsIOSReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      log.warn('iOS loading timeout reached, showing app anyway');
      setShowTimeout(true);
      setIsIOSReady(true);
    }, 8000); // 8 second timeout

    const initializeIOS = async () => {
      try {
        setLoadingMessage('Checking iOS environment...');

        // Check if running on iOS with better detection
        let isIOS = false;
        try {
          isIOS = Capacitor.getPlatform() === 'ios';
        } catch (error) {
          log.warn('Could not detect platform, assuming web:', error);
        }

        if (!isIOS) {
          log.info('Not iOS platform, skipping iOS-specific initialization');
          clearTimeout(timeout);
          setIsIOSReady(true);
          return;
        }

        log.info('iOS platform detected, initializing iOS-specific features');
        setLoadingMessage('Loading iOS dependencies...');

        // Wait for Capacitor to be ready with proper checks
        const checkCapacitorReady = () => {
          return new Promise<void>((resolve) => {
            const check = () => {
              if (window.Capacitor && (window.Capacitor as any).isNativePlatform && (window.Capacitor as any).isNativePlatform()) {
                resolve();
              } else {
                setTimeout(check, 100);
              }
            };
            check();
          });
        };

        await Promise.race([
          checkCapacitorReady(),
          new Promise(resolve => setTimeout(resolve, 2000)) // Max 2 seconds
        ]);

        setLoadingMessage('Finalizing setup...');

        // Additional iOS-specific setup
        try {
          // Ensure safe area is handled
          if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            try {
              document.body.classList.add('ios-safe-area');
            } catch (error) {
              // Ignore DOM manipulation errors during SSR
            }
          }
        } catch (error) {
          log.warn('Could not add iOS safe area class:', error);
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        log.info('iOS initialization completed successfully');
        clearTimeout(timeout);
        setIsIOSReady(true);
      } catch (error) {
        log.error('iOS initialization error:', error);
        // Still show the app even if initialization fails
        clearTimeout(timeout);
        setIsIOSReady(true);
      }
    };

    // Listen for capacitor ready event to speed up initialization
    const handleCapacitorReady = () => {
      log.info('Capacitor ready event received, speeding up iOS init');
      clearTimeout(timeout);
      setIsIOSReady(true);
    };

    window.addEventListener('capacitorReady', handleCapacitorReady);
    initializeIOS();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('capacitorReady', handleCapacitorReady);
    };
  }, []);

  // Show timeout message if loading takes too long
  const shouldShowLoading = !isIOSReady && !showTimeout;

  if (shouldShowLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center safe-area-all">
        <div className="text-center space-y-4 px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3194f] mx-auto"></div>
          <p className="text-white text-lg font-medium">{loadingMessage}</p>
          <p className="text-gray-400 text-sm">Please wait...</p>
          {loadingMessage.includes('Finalizing') && (
            <p className="text-gray-500 text-xs">This may take a moment on first launch</p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
