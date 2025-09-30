'use client';

import { useEffect } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { isCapacitorApp } from '@/utils/mobileDetection';

export default function HideSplashScreen() {
  useEffect(() => {
    if (isCapacitorApp()) {
      // Hide splash screen immediately
      SplashScreen.hide().catch(() => {
        // Ignore errors if splash screen is already hidden
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
