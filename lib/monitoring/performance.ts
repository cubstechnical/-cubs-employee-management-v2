'use client';

// Performance monitoring utilities
export interface PerformanceMetric {
  name: string;
  value: number;
  id: string;
  delta: number;
  entries: PerformanceEntry[];
}

export interface WebVitalMetric extends PerformanceMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
}

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  FID: { good: 100, needsImprovement: 300 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 600, needsImprovement: 1500 },
  renderTime: { good: 16, needsImprovement: 50 },
  memoryUsage: { good: 50, needsImprovement: 100 },
  bundleSize: { good: 500, needsImprovement: 1000 }
} as const;

// Performance status
export type PerformanceStatus = 'good' | 'needs-improvement' | 'poor';

export function getPerformanceStatus(
  value: number, 
  thresholds: { good: number; needsImprovement: number }
): PerformanceStatus {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

// Core Web Vitals tracking
export function trackWebVitals(metric: WebVitalMetric) {
  if (typeof window === 'undefined') return;

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const status = getPerformanceStatus(metric.value, PERFORMANCE_THRESHOLDS[metric.name]);
    const emoji = status === 'good' ? '✅' : status === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`${emoji} ${metric.name}: ${metric.value.toFixed(2)}ms (${status})`);
  }

  // Send to analytics service in production
  if (process.env.NODE_ENV === 'production') {
    // You can integrate with Google Analytics, Sentry, or other monitoring services
    sendToAnalytics(metric);
  }
}

// Send metrics to analytics service
function sendToAnalytics(metric: WebVitalMetric) {
  try {
    // Example: Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'web_vital', {
        event_category: 'Web Vitals',
        event_label: metric.name,
        value: Math.round(metric.value),
        custom_map: {
          metric_id: metric.id,
          metric_delta: metric.delta
        }
      });
    }

    // Example: Custom analytics endpoint
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        id: metric.id,
        delta: metric.delta,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    }).catch(error => {
      console.warn('Failed to send web vitals to analytics:', error);
    });
  } catch (error) {
    console.warn('Error sending web vitals:', error);
  }
}

// Memory usage monitoring
export function getMemoryUsage() {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    return null;
  }

  const memory = (performance as any).memory;
  return {
    used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
    total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
    limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
    percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
  };
}

// Network information
export function getNetworkInfo() {
  if (typeof window === 'undefined' || !('connection' in navigator)) {
    return null;
  }

  const connection = (navigator as any).connection;
  return {
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0,
    saveData: connection.saveData || false
  };
}

// Bundle size estimation
export function estimateBundleSize(): number {
  if (typeof window === 'undefined') return 0;

  const scripts = document.querySelectorAll('script[src]');
  let totalSize = 0;

  scripts.forEach(script => {
    const src = script.getAttribute('src');
    if (src && src.includes('_next/static')) {
      // Rough estimation based on common chunk sizes
      if (src.includes('main')) totalSize += 150; // Main bundle
      else if (src.includes('framework')) totalSize += 50; // Framework
      else if (src.includes('commons')) totalSize += 30; // Commons
      else totalSize += 20; // Other chunks
    }
  });

  return totalSize;
}

// Performance budget checking
export function checkPerformanceBudget() {
  const memory = getMemoryUsage();
  const network = getNetworkInfo();
  const bundleSize = estimateBundleSize();

  const budget = {
    memory: {
      current: memory?.used || 0,
      limit: PERFORMANCE_THRESHOLDS.memoryUsage.good,
      status: memory ? getPerformanceStatus(memory.used, PERFORMANCE_THRESHOLDS.memoryUsage) : 'unknown'
    },
    bundle: {
      current: bundleSize,
      limit: PERFORMANCE_THRESHOLDS.bundleSize.good,
      status: getPerformanceStatus(bundleSize, PERFORMANCE_THRESHOLDS.bundleSize)
    },
    network: {
      type: network?.effectiveType || 'unknown',
      slow: network?.effectiveType === '2g' || network?.effectiveType === 'slow-2g'
    }
  };

  return budget;
}

// Performance monitoring class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor memory usage
    this.observeMemoryUsage();
    
    // Monitor long tasks
    this.observeLongTasks();
  }

  private observeWebVitals() {
    try {
      // LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        trackWebVitals({
          name: 'LCP',
          value: lastEntry.startTime,
          id: lastEntry.name,
          delta: lastEntry.startTime,
          entries: [lastEntry]
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // FID
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as any; // FirstInput entry has processingStart
          trackWebVitals({
            name: 'FID',
            value: fidEntry.processingStart - fidEntry.startTime,
            id: fidEntry.name,
            delta: fidEntry.processingStart - fidEntry.startTime,
            entries: [entry]
          });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // CLS
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        trackWebVitals({
          name: 'CLS',
          value: clsValue,
          id: 'cls',
          delta: clsValue,
          entries: []
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      console.warn('Failed to observe web vitals:', error);
    }
  }

  private observeMemoryUsage() {
    if (!('memory' in performance)) return;

    setInterval(() => {
      const memory = getMemoryUsage();
      if (memory && memory.percentage > 80) {
        console.warn(`⚠️ High memory usage: ${memory.percentage}% (${memory.used}MB)`);
      }
    }, 30000); // Check every 30 seconds
  }

  private observeLongTasks() {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn(`🐌 Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (error) {
      console.warn('Failed to observe long tasks:', error);
    }
  }

  stopMonitoring() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }
}

// Initialize performance monitoring
export function initializePerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  const monitor = PerformanceMonitor.getInstance();
  monitor.startMonitoring();

  // Log performance budget
  const budget = checkPerformanceBudget();
  console.log('📊 Performance Budget:', budget);
}

// Network error handling
export function handleNetworkError(error: Error, context: string) {
  console.error(`Network error in ${context}:`, error);
  
  // Log to monitoring service
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/error-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        context,
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : 'server',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
      })
    }).catch(() => {
      // Silently fail if error reporting fails
    });
  }
}

// Export for global use
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}