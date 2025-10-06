'use client';

import React, { useEffect, useState } from 'react';
import { isCapacitorApp } from '@/utils/mobileDetection';
import { log } from '@/lib/utils/productionLogger';

interface MobileLoadingScreenProps {
  isLoading: boolean;
}

export default function MobileLoadingScreen({ isLoading }: MobileLoadingScreenProps) {
  const [showExtendedLoading, setShowExtendedLoading] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // Listen for app ready event
    const handleAppReady = () => {
      log.info('MobileLoadingScreen: App ready event received');
      setIsAppReady(true);
    };

    if (typeof window !== 'undefined') {
      // Listen for multiple ready events
      const events = ['capacitor-ready', 'app-initialized', 'mobile-app-ready'];
      events.forEach(event => {
        window.addEventListener(event, handleAppReady);
        log.info(`MobileLoadingScreen: Listening for ${event}`);
      });

      // Also listen for when the DOM is fully loaded
      const handleDOMContentLoaded = () => {
        log.info('MobileLoadingScreen: DOM loaded, app should be ready');
        // Give it a moment for React to finish rendering
        setTimeout(() => setIsAppReady(true), 300);
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
      } else {
        // DOM is already loaded, set ready after a short delay
        setTimeout(() => setIsAppReady(true), 300);
      }

      // Add immediate debugging for mobile app
      if (isCapacitorApp()) {
        log.info('MobileLoadingScreen: Mobile app detected, starting aggressive debugging');

        // Show immediate alert for debugging
        const alertTimer = setTimeout(() => {
          if (!isAppReady) {
            alert('🔍 Mobile App Debug: Loading screen active. Check if events are firing.');
          }
        }, 1000);

        // Force set ready after 3 seconds as emergency fallback
        const fallbackTimer = setTimeout(() => {
          if (!isAppReady) {
            log.warn('MobileLoadingScreen: Emergency fallback - forcing app ready');
            setIsAppReady(true);
          }
        }, 3000);

        return () => {
          clearTimeout(alertTimer);
          clearTimeout(fallbackTimer);
          events.forEach(event => {
            window.removeEventListener(event, handleAppReady);
          });
          document.removeEventListener('DOMContentLoaded', handleDOMContentLoaded);
        };
      }

      return () => {
        events.forEach(event => {
          window.removeEventListener(event, handleAppReady);
        });
        document.removeEventListener('DOMContentLoaded', handleDOMContentLoaded);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // If loading takes longer than 3 seconds, show extended loading message
    if (isLoading && !isAppReady) {
      const timer = setTimeout(() => {
        setShowExtendedLoading(true);
        log.warn('MobileLoadingScreen: Extended loading detected');
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowExtendedLoading(false);
    }
  }, [isLoading, isAppReady]);

  // Multiple fallback mechanisms to prevent infinite loading
  useEffect(() => {
    if (isLoading && !isAppReady) {
      // Primary fallback: Hide loading screen after 5 seconds
      const fallbackTimer = setTimeout(() => {
        log.warn('MobileLoadingScreen: Primary fallback timeout reached, hiding loading screen');
        setIsAppReady(true);
      }, 5000);

      // Secondary fallback: Force hide after 10 seconds (emergency)
      const emergencyTimer = setTimeout(() => {
        log.error('MobileLoadingScreen: EMERGENCY fallback - forcing hide after 10 seconds');
        setIsAppReady(true);
      }, 10000);

      return () => {
        clearTimeout(fallbackTimer);
        clearTimeout(emergencyTimer);
      };
    }
  }, [isLoading, isAppReady]);

  // Always show loading screen on mobile apps to prevent white screen
  // Also show on any mobile device to prevent white screens
  // Hide when app is ready or not loading
  if ((!isCapacitorApp() && !isLoading) || isAppReady) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center z-50 safe-area-all">
      <div className="text-center max-w-sm mx-auto px-6">
        {/* Logo/Brand */}
        <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-[#d3194f] font-bold text-2xl">C</div>
        </div>

        {/* Loading Spinner */}
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#d3194f] mx-auto"></div>
          <div className="absolute inset-0 animate-pulse rounded-full h-12 w-12 border-2 border-[#d3194f] opacity-20 mx-auto"></div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
            {showExtendedLoading ? 'Still Loading...' : 'Loading CUBS App...'}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {showExtendedLoading
              ? 'Taking longer than expected. Please wait...'
              : 'Initializing your experience'
            }
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-1 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full animate-pulse ${
                showExtendedLoading ? 'bg-[#d3194f]' : 'bg-gray-300'
              }`}
              style={{
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>

        {/* Manual Escape Button - appears after extended loading */}
        {showExtendedLoading && (
          <div className="mt-6 space-y-2">
            <button
              onClick={() => {
                log.warn('Manual escape: User dismissed loading screen');
                setIsAppReady(true);
              }}
              className="px-4 py-2 text-sm bg-[#d3194f] text-white rounded-lg hover:bg-[#b01640] transition-colors"
            >
              ⚠️ Continue Anyway
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Click if app is not loading
            </p>
          </div>
        )}
        
        {/* Debug functionality removed for production */}
      </div>
    </div>
  );
}
