// Performance monitoring and optimization utilities
import React from 'react';
import { log } from '@/lib/utils/productionLogger';

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  totalOperations: number;
  averageDuration: number;
  slowOperations: PerformanceMetric[];
  cacheHitRate: number;
  recommendations: string[];
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;
  private readonly MAX_METRICS = 1000; // Prevent memory leaks
  private readonly SLOW_THRESHOLD = 1000; // 1 second
  private readonly VERY_SLOW_THRESHOLD = 2000; // 2 seconds

  // Track operation performance
  track(operation: string, duration: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);

    // Prevent memory leaks by limiting stored metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS / 2);
    }

    // Log slow operations
    if (duration > this.VERY_SLOW_THRESHOLD) {
      log.warn(`🚨 Very slow operation: ${operation} took ${duration.toFixed(2)}ms`, metadata);
    } else if (duration > this.SLOW_THRESHOLD) {
      log.warn(`⚠️ Slow operation: ${operation} took ${duration.toFixed(2)}ms`, metadata);
    }
  }

  // Track cache performance
  trackCacheHit() {
    this.cacheHits++;
  }

  trackCacheMiss() {
    this.cacheMisses++;
  }

  // Get performance report
  getReport(): PerformanceReport {
    const recentMetrics = this.metrics.filter(
      m => Date.now() - m.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );

    const totalOperations = recentMetrics.length;
    const averageDuration = totalOperations > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations 
      : 0;

    const slowOperations = recentMetrics.filter(m => m.duration > this.SLOW_THRESHOLD);
    const cacheHitRate = (this.cacheHits + this.cacheMisses) > 0 
      ? this.cacheHits / (this.cacheHits + this.cacheMisses) 
      : 0;

    const recommendations: string[] = [];
    
    if (averageDuration > 500) {
      recommendations.push('Consider implementing more aggressive caching');
    }
    if (cacheHitRate < 0.3) {
      recommendations.push('Cache hit rate is low - review cache strategies');
    }
    if (slowOperations.length > 5) {
      recommendations.push('Multiple slow operations detected - optimize database queries');
    }

    return {
      totalOperations,
      averageDuration,
      slowOperations,
      cacheHitRate,
      recommendations
    };
  }

  // Clear metrics
  clear() {
    this.metrics = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  // Get metrics for specific operation
  getOperationMetrics(operation: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.operation === operation);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance decorator for functions
export function trackPerformance(operationName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();
      try {
        const result = await method.apply(this, args);
        const duration = performance.now() - startTime;
        performanceMonitor.track(operationName, duration, { args: args.length });
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        performanceMonitor.track(`${operationName}-error`, duration, { error: errorMessage });
        throw error;
      }
    };
  };
}

// React hook for performance tracking
export function usePerformanceTracking(operationName: string) {
  const startTime = React.useRef<number>(0);

  const startTracking = React.useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const endTracking = React.useCallback((metadata?: Record<string, any>) => {
    const duration = performance.now() - startTime.current;
    performanceMonitor.track(operationName, duration, metadata);
    return duration;
  }, [operationName]);

  return { startTracking, endTracking };
}

// Utility to measure async operations
export async function measureAsync<T>(
  operationName: string, 
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = performance.now();
  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    performanceMonitor.track(operationName, duration, metadata);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    performanceMonitor.track(`${operationName}-error`, duration, { 
      error: error instanceof Error ? error.message : 'Unknown error',
      ...metadata 
    });
    throw error;
  }
}

// Utility to measure sync operations
export function measureSync<T>(
  operationName: string, 
  operation: () => T,
  metadata?: Record<string, any>
): T {
  const startTime = performance.now();
  try {
    const result = operation();
    const duration = performance.now() - startTime;
    performanceMonitor.track(operationName, duration, metadata);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    performanceMonitor.track(`${operationName}-error`, duration, { 
      error: error instanceof Error ? error.message : 'Unknown error',
      ...metadata 
    });
    throw error;
  }
}

// Cache performance tracking
export function trackCacheHit() {
  performanceMonitor.trackCacheHit();
}

export function trackCacheMiss() {
  performanceMonitor.trackCacheMiss();
}

// Get performance report
export function getPerformanceReport(): PerformanceReport {
  return performanceMonitor.getReport();
}

// Clear performance data
export function clearPerformanceData() {
  performanceMonitor.clear();
}

// Log performance report to console
export function logPerformanceReport() {
  const report = getPerformanceReport();
  log.group('📊 Performance Report');
  log.info(`Total Operations: ${report.totalOperations}`);
  log.info(`Average Duration: ${report.averageDuration.toFixed(2)}ms`);
  log.info(`Cache Hit Rate: ${(report.cacheHitRate * 100).toFixed(1)}%`);
  log.info(`Slow Operations: ${report.slowOperations.length}`);
  
  if (report.slowOperations.length > 0) {
    log.group('🐌 Slow Operations:');
    report.slowOperations.forEach(op => {
      log.info(`${op.operation}: ${op.duration.toFixed(2)}ms`);
    });
    log.groupEnd();
  }
  
  if (report.recommendations.length > 0) {
    log.group('💡 Recommendations:');
    report.recommendations.forEach(rec => log.info(`• ${rec}`));
    log.groupEnd();
  }
  
  log.groupEnd();
}

