'use client';

import { useEffect } from 'react';
import { CapacitorService } from '@/lib/capacitor';

export default function CapacitorInit() {
  useEffect(() => {
    // Simple Capacitor initialization - no complex auth logic
    CapacitorService.initialize();

    // Simple mobile detection and basic setup
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNative) {
      console.log('📱 Mobile app detected - basic initialization complete');

      // Add a small delay to ensure everything is ready
      setTimeout(() => {
        console.log('✅ Mobile app ready');
      }, 500);
    }
  }, []);

  return null; // This component doesn't render anything
}



