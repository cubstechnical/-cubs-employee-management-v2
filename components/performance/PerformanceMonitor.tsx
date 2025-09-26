"use client";

import React, { useEffect, useState, useRef } from 'react';
import { log } from '@/lib/utils/productionLogger';

interface PerformanceMetrics {
  loadTime: number;
  renderCount: number;
  lastRender: number;
}

const PerformanceMonitorComponent = ({ componentName }: { componentName: string }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderCount: 0,
    lastRender: 0,
  });

  const renderCountRef = useRef(0);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const startTime = performance.now();
    
    // Only increment render count after initial mount to prevent memory leak
    if (!isInitialMount.current) {
      renderCountRef.current += 1;
    } else {
      isInitialMount.current = false;
    }
    
    setMetrics(prev => ({
      loadTime: startTime,
      renderCount: renderCountRef.current,
      lastRender: Date.now(),
    }));

    // Log performance warnings in development
    if (process.env.NODE_ENV === 'development') {
      const renderTime = performance.now() - startTime;
      if (renderTime > 16) { // More than one frame (16ms at 60fps)
        log.warn(`🐌 ${componentName} render took ${renderTime.toFixed(2)}ms`);
      }
    }
  }, [componentName]);

  // Reset render count periodically to prevent memory growth
  useEffect(() => {
    const resetInterval = setInterval(() => {
      renderCountRef.current = 0;
      setMetrics(prev => ({ ...prev, renderCount: 0 }));
    }, 60000); // Reset every minute

    return () => clearInterval(resetInterval);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded z-50">
      <div>{componentName}</div>
      <div>Renders: {metrics.renderCount}</div>
      <div>Last: {new Date(metrics.lastRender).toLocaleTimeString()}</div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const PerformanceMonitor = React.memo(PerformanceMonitorComponent);
