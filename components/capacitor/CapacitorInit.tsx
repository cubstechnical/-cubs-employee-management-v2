'use client';

import { useEffect } from 'react';
import { CapacitorService } from '@/lib/capacitor';

export default function CapacitorInit() {
  useEffect(() => {
    // Initialize Capacitor service
    CapacitorService.initialize();

    // Check if we're in a mobile app environment
    if (typeof window !== 'undefined') {
      // Check for Capacitor availability
      const isCapacitorAvailable = !!(window.Capacitor);
      const isNativePlatform = !!(window.Capacitor && (window.Capacitor as any).isNativePlatform && (window.Capacitor as any).isNativePlatform());

      console.log('🔍 Capacitor detection:', {
        isCapacitorAvailable,
        isNativePlatform,
        platform: (window.Capacitor as any)?.getPlatform ? (window.Capacitor as any).getPlatform() : 'unknown'
      });

      if (isCapacitorAvailable) {
        if (isNativePlatform) {
          console.log('📱 Native mobile app detected - full initialization');

          // Add a delay to ensure Capacitor is fully ready
          setTimeout(() => {
            console.log('✅ Native mobile app fully initialized');
            // Trigger any mobile-specific initialization here
          }, 1000);
        } else {
          console.log('🌐 Web/PWA environment detected - minimal initialization');
        }
      } else {
        console.log('⚠️ Capacitor not available - running in web mode');
      }
    }
  }, []);

  return null; // This component doesn't render anything
}



