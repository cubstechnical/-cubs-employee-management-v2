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