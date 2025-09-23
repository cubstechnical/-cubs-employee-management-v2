'use client';

import { useEffect } from 'react';
import { CapacitorService } from '@/lib/capacitor';

export default function CapacitorInit() {
  useEffect(() => {
    // Initialize Capacitor when the app loads
    CapacitorService.initialize();
  }, []);

  return null; // This component doesn't render anything
}



