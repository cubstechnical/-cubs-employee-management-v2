"use client";

import { useEffect, useState, useRef } from 'react';

interface WebVitals {
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
}

interface PerformanceMetrics {
  vitals: WebVitals;
  memory?: {
    used: number;
    total: number;
    limit: number;
  };
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  renderTime: number;
  bundleSize?: number;
}

export function CoreWebVitals() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    vitals: {},
    renderTime: 0,
  });
  
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || hasInitialized.current) return;
    
    hasInitialized.current = true;
    const startTime = performance.now();

    // Simple, one-time measurement
    const measureMetrics = () => {
      // Measure memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memory: {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
          }
        }));
      }

      // Measure connection info
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setMetrics(prev => ({
          ...prev,
          connection: {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
          }
        }));
      }

      // Measure render time
      const renderTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, renderTime }));

      // Log performance warnings only once
      if (renderTime > 16) {
        console.warn('🐌 Initial render time is slow:', renderTime.toFixed(2) + 'ms (target: <16ms)');
      }
    };

    // Run measurements after a short delay
    setTimeout(measureMetrics, 1000);
  }, []); // Empty dependency array - run only once

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getVitalStatus = (value: number, thresholds: { good: number; needsImprovement: number }) => {
    if (value <= thresholds.good) return { status: 'good', color: 'text-green-600' };
    if (value <= thresholds.needsImprovement) return { status: 'needs-improvement', color: 'text-yellow-600' };
    return { status: 'poor', color: 'text-red-600' };
  };

  const lcpStatus = metrics.vitals.LCP ? getVitalStatus(metrics.vitals.LCP, { good: 2500, needsImprovement: 4000 }) : null;
  const fidStatus = metrics.vitals.FID ? getVitalStatus(metrics.vitals.FID, { good: 100, needsImprovement: 300 }) : null;
  const clsStatus = metrics.vitals.CLS ? getVitalStatus(metrics.vitals.CLS, { good: 0.1, needsImprovement: 0.25 }) : null;

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 text-white text-xs p-3 rounded-lg z-50 max-w-sm">
      <div className="font-semibold mb-2">📊 Core Web Vitals</div>
      
      <div className="space-y-1">
        {metrics.vitals.LCP && (
          <div className="flex justify-between">
            <span>LCP:</span>
            <span className={lcpStatus?.color}>
              {metrics.vitals.LCP.toFixed(0)}ms
            </span>
          </div>
        )}
        
        {metrics.vitals.FID && (
          <div className="flex justify-between">
            <span>FID:</span>
            <span className={fidStatus?.color}>
              {metrics.vitals.FID.toFixed(0)}ms
            </span>
          </div>
        )}
        
        {metrics.vitals.CLS && (
          <div className="flex justify-between">
            <span>CLS:</span>
            <span className={clsStatus?.color}>
              {metrics.vitals.CLS.toFixed(3)}
            </span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span>Render:</span>
          <span className={metrics.renderTime > 16 ? 'text-red-600' : 'text-green-600'}>
            {metrics.renderTime.toFixed(1)}ms
          </span>
        </div>
        
        {metrics.memory && (
          <div className="flex justify-between">
            <span>Memory:</span>
            <span className={metrics.memory.used > 50 ? 'text-yellow-600' : 'text-green-600'}>
              {metrics.memory.used}MB
            </span>
          </div>
        )}
        
        {metrics.connection && (
          <div className="flex justify-between">
            <span>Connection:</span>
            <span className="text-blue-400">
              {metrics.connection.effectiveType}
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400">
        Performance monitoring active
      </div>
    </div>
  );
}
