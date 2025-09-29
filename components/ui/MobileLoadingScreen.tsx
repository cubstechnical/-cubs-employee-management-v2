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

      return () => {
        events.forEach(event => {
          window.removeEventListener(event, handleAppReady);
        });
        document.removeEventListener('DOMContentLoaded', handleDOMContentLoaded);
      };
    }
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
          <img
            src="/assets/cubs.webp"
            alt="CUBS Technical Logo"
            className="w-12 h-12 object-contain"
            onError={(e) => {
              // Fallback to "C" if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = '<span class="text-[#d3194f] font-bold text-2xl">C</span>';
            }}
          />
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
      </div>
    </div>
  );
}
