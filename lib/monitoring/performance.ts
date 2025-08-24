import { useEffect } from 'react';

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
}

export function usePerformanceMonitoring(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    // Log component mount time
    console.log(`🏁 ${componentName} started loading at ${startTime.toFixed(2)}ms`);

    // Mark the component as loaded
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // Log performance data
    if (loadTime > 100) {
      console.warn(`⚠️ ${componentName} took ${loadTime.toFixed(2)}ms to load (>100ms)`);
    } else {
      console.log(`✅ ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
    }

    // Cleanup function
    return () => {
      const unmountTime = performance.now();
      console.log(`🔄 ${componentName} unmounted at ${unmountTime.toFixed(2)}ms`);
    };
  }, [componentName]);
}

export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`📊 ${name} took ${duration.toFixed(2)}ms`);
  
  if (duration > 500) {
    console.warn(`⚠️ Performance warning: ${name} took ${duration.toFixed(2)}ms (>500ms)`);
  }
  
  return result;
}

export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`📊 ${name} took ${duration.toFixed(2)}ms`);
  
  if (duration > 1000) {
    console.warn(`⚠️ Performance warning: ${name} took ${duration.toFixed(2)}ms (>1000ms)`);
  }
  
  return result;
}

export class PerformanceMonitor {
  private static entries: PerformanceEntry[] = [];
  
  static start(name: string): void {
    const startTime = performance.now();
    this.entries.push({ name, startTime, duration: 0 });
  }
  
  static end(name: string): number {
    const endTime = performance.now();
    const entry = this.entries.find(e => e.name === name && e.duration === 0);
    
    if (entry) {
      entry.duration = endTime - entry.startTime;
      console.log(`📊 ${name}: ${entry.duration.toFixed(2)}ms`);
      return entry.duration;
    }
    
    console.warn(`⚠️ No matching start entry found for: ${name}`);
    return 0;
  }
  
  static getReport(): PerformanceEntry[] {
    return this.entries.filter(e => e.duration > 0);
  }
  
  static clear(): void {
    this.entries = [];
  }
}

// Web-vitals reporting to Sentry (browser)
export function reportWebVitalsToSentry() {
  // No-op; layout injects a lightweight reporter script to avoid adding a dependency.
}

// Error boundary for React components
export class ErrorBoundary {
  static catch(error: Error, errorInfo?: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // In a real app, you'd send this to your error reporting service
    // For now, we'll just log it
    const errorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      componentStack: errorInfo?.componentStack || 'unknown',
    };

    // Store error locally for debugging
    if (typeof window !== 'undefined') {
      const existingErrors = JSON.parse(localStorage.getItem('error_logs') || '[]');
      existingErrors.push(errorReport);
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      localStorage.setItem('error_logs', JSON.stringify(existingErrors));
    }

    return errorReport;
  }
}

// Network error handler
export function handleNetworkError(error: any, context?: string) {
  const networkError = {
    type: 'network',
    context: context || 'unknown',
    message: error.message || 'Network error',
    status: error.status || 'unknown',
    url: error.url || 'unknown',
    timestamp: new Date().toISOString(),
  };

  console.error('Network Error:', networkError);

  // Store network errors for offline analysis
  if (typeof window !== 'undefined') {
    const existingErrors = JSON.parse(localStorage.getItem('network_errors') || '[]');
    existingErrors.push(networkError);
    if (existingErrors.length > 20) {
      existingErrors.splice(0, existingErrors.length - 20);
    }
    localStorage.setItem('network_errors', JSON.stringify(existingErrors));
  }

  return networkError;
}

// Performance monitoring for mobile devices
export function monitorMobilePerformance() {
  if (typeof window === 'undefined') return;

  // Monitor memory usage on mobile devices
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log(`📱 Memory Usage: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB / ${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`);

    if (memory.usedJSHeapSize > memory.totalJSHeapSize * 0.8) {
      console.warn('⚠️ High memory usage detected - potential memory leak');
    }
  }

  // Monitor battery status
  if ('getBattery' in navigator) {
    (navigator as any).getBattery().then((battery: any) => {
      console.log(`🔋 Battery Level: ${Math.round(battery.level * 100)}%`);
      if (battery.level < 0.2 && !battery.charging) {
        console.warn('⚠️ Low battery detected - consider reducing animations');
      }
    });
  }
}