import React, { useEffect, useRef } from 'react';
import { log } from '@/lib/utils/productionLogger';

export function usePerformance(operationName: string) {
  const startTime = useRef<number>(0);
  const endTime = useRef<number>(0);

  const startTimer = () => {
    startTime.current = performance.now();
  };

  const endTimer = () => {
    endTime.current = performance.now();
    const duration = endTime.current - startTime.current;
    
    // Log performance metrics
    if (duration > 500) {
      log.warn(`⚠️ Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`);
    } else {
      log.info(`✅ ${operationName} completed in ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  };

  return { startTimer, endTimer };
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRan = React.useRef<number>(Date.now());

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
} 