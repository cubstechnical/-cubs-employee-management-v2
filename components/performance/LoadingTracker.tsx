'use client';

import { useEffect, useState } from 'react';

interface LoadingTrackerProps {
  onLoadComplete?: (loadTime: number) => void;
}

export default function LoadingTracker({ onLoadComplete }: LoadingTrackerProps) {
  const [startTime] = useState(() => performance.now());

  useEffect(() => {
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      console.log(`🚀 Dashboard loaded in ${loadTime.toFixed(2)}ms`);
      onLoadComplete?.(loadTime);
    };

    // Track when the component is fully mounted
    const timer = setTimeout(handleLoad, 0);
    
    return () => clearTimeout(timer);
  }, [startTime, onLoadComplete]);

  return null;
}
