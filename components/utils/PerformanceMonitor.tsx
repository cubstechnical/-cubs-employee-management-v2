'use client';

import { useEffect } from 'react';
import { initializeErrorHandling, detectMemoryLeaks } from '@/lib/utils/performance';

export default function PerformanceMonitor() {
  useEffect(() => {
    // Initialize error handling for chunk loading errors
    initializeErrorHandling();

    // Monitor memory usage in development
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        detectMemoryLeaks();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, []);

  // This component doesn't render anything
  return null;
}
