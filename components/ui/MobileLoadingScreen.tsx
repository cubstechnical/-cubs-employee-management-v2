'use client';

import React from 'react';
import { isCapacitorApp } from '@/utils/mobileDetection';

interface MobileLoadingScreenProps {
  isLoading: boolean;
}

export default function MobileLoadingScreen({ isLoading }: MobileLoadingScreenProps) {
  if (!isLoading || !isCapacitorApp()) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50 safe-area-all">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#d3194f] rounded-full flex items-center justify-center mb-4 mx-auto">
          <span className="text-white font-bold text-xl">C</span>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d3194f] mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Loading CUBS App...</p>
      </div>
    </div>
  );
}
