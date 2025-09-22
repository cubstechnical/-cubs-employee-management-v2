"use client";

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderCount: number;
  lastRender: number;
}

export function PerformanceMonitor({ componentName }: { componentName: string }) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderCount: 0,
    lastRender: 0,
  });

  useEffect(() => {
    const startTime = performance.now();
    
    setMetrics(prev => ({
      loadTime: startTime,
      renderCount: prev.renderCount + 1,
      lastRender: Date.now(),
    }));

    // Log performance warnings in development
    if (process.env.NODE_ENV === 'development') {
      const renderTime = performance.now() - startTime;
      if (renderTime > 16) { // More than one frame (16ms at 60fps)
        console.warn(`🐌 ${componentName} render took ${renderTime.toFixed(2)}ms`);
      }
    }
  }, [componentName]); // Add dependency array to prevent infinite loop

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
}
