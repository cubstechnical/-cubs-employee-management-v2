'use client';

import React, { useEffect, useState } from 'react';
import { isCapacitorApp } from '@/utils/mobileDetection';
import { log } from '@/lib/utils/productionLogger';

interface MobileLoadingScreenProps {
  isLoading: boolean;
}

export default function MobileLoadingScreen({ isLoading }: MobileLoadingScreenProps) {
  const [showExtendedLoading, setShowExtendedLoading] = useState(false);

  useEffect(() => {
    // If loading takes longer than 3 seconds, show extended loading message
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowExtendedLoading(true);
        log.warn('MobileLoadingScreen: Extended loading detected');
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowExtendedLoading(false);
    }
  }, [isLoading]);

  // Always show loading screen on mobile apps to prevent white screen
  if (!isCapacitorApp()) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center z-50 safe-area-all">
      <div className="text-center max-w-sm mx-auto px-6">
        {/* Logo/Brand */}
        <div className="w-20 h-20 bg-gradient-to-br from-[#d3194f] to-[#a91542] rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
          <span className="text-white font-bold text-2xl">C</span>
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
