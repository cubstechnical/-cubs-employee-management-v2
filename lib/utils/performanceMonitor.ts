import { log } from '@/lib/utils/productionLogger';
// Performance monitoring and optimization utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializePerformanceObservers();
    }
  }

  // Initialize performance observers for various metrics
  private initializePerformanceObservers() {
    try {
      // Observe navigation timing
      if ('PerformanceObserver' in window) {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              this.recordMetric('navigation', {
                name: 'pageLoad',
                value: (entry as PerformanceNavigationTiming).loadEventEnd - (entry as PerformanceNavigationTiming).fetchStart,
                timestamp: Date.now()
              });
            }
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);

        // Observe resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource' && entry.name.includes('api')) {
              this.recordMetric('apiCall', {
                name: entry.name,
                value: (entry as PerformanceResourceTiming).responseEnd - (entry as PerformanceResourceTiming).requestStart,
                timestamp: Date.now()
              });
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);

        // Observe largest contentful paint
        if ('LargestContentfulPaint' in window) {
          const lcpObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              this.recordMetric('lcp', {
                name: 'largestContentfulPaint',
                value: (entry as any).renderTime || (entry as any).loadTime || 0,
                timestamp: Date.now()
              });
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
          this.observers.push(lcpObserver);
        }
      }
    } catch (error) {
      log.warn('Performance monitoring initialization failed:', error);
    }
  }

  // Record a performance metric
  recordMetric(category: string, metric: PerformanceMetric) {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, []);
    }

    const categoryMetrics = this.metrics.get(category)!;
    categoryMetrics.push(metric);

    // Keep only last 100 metrics per category
    if (categoryMetrics.length > 100) {
      categoryMetrics.shift();
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      log.info(`📊 Performance: ${category} - ${metric.name}: ${metric.value.toFixed(2)}ms`);
    }
  }

  // Get average metric value for a category
  getAverageMetric(category: string, metricName?: string): number {
    const categoryMetrics = this.metrics.get(category);
    if (!categoryMetrics || categoryMetrics.length === 0) return 0;

    const relevantMetrics = metricName
      ? categoryMetrics.filter(m => m.name === metricName)
      : categoryMetrics;

    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / relevantMetrics.length;
  }

  // Get performance summary
  getPerformanceSummary(): PerformanceSummary {
    const navigationMetrics = this.metrics.get('navigation') || [];
    const apiMetrics = this.metrics.get('apiCall') || [];
    const lcpMetrics = this.metrics.get('lcp') || [];

    return {
      averagePageLoad: this.getAverageMetric('navigation', 'pageLoad'),
      averageApiResponse: this.getAverageMetric('apiCall'),
      averageLCP: this.getAverageMetric('lcp', 'largestContentfulPaint'),
      totalMetrics: {
        navigation: navigationMetrics.length,
        api: apiMetrics.length,
        lcp: lcpMetrics.length
      },
      recentMetrics: {
        navigation: navigationMetrics.slice(-5),
        api: apiMetrics.slice(-5),
        lcp: lcpMetrics.slice(-5)
      }
    };
  }

  // Performance optimization recommendations
  getOptimizationRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const summary = this.getPerformanceSummary();

    // Check page load time
    if (summary.averagePageLoad > 3000) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        title: 'Page Load Time Too High',
        description: `Average page load time is ${summary.averagePageLoad.toFixed(0)}ms, which is above the recommended 3 seconds.`,
        suggestions: [
          'Enable lazy loading for non-critical resources',
          'Optimize images and use modern formats (WebP)',
          'Minimize bundle size by code splitting',
          'Use CDN for static assets',
          'Implement service worker caching'
        ]
      });
    }

    // Check API response times
    if (summary.averageApiResponse > 1000) {
      recommendations.push({
        category: 'api',
        priority: 'high',
        title: 'Slow API Response Times',
        description: `Average API response time is ${summary.averageApiResponse.toFixed(0)}ms, which is above the recommended 1 second.`,
        suggestions: [
          'Implement API response caching',
          'Use pagination for large datasets',
          'Optimize database queries',
          'Add loading states and skeleton screens',
          'Consider API call batching'
        ]
      });
    }

    // Check LCP
    if (summary.averageLCP > 2500) {
      recommendations.push({
        category: 'ux',
        priority: 'medium',
        title: 'Large Contentful Paint Too High',
        description: `Average LCP is ${summary.averageLCP.toFixed(0)}ms, which is above the recommended 2.5 seconds.`,
        suggestions: [
          'Optimize critical rendering path',
          'Use font-display: swap for web fonts',
          'Prioritize above-the-fold content loading',
          'Remove render-blocking resources',
          'Use preconnect for external domains'
        ]
      });
    }

    return recommendations;
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        log.warn('Failed to disconnect performance observer:', error);
      }
    });
    this.observers = [];
  }
}

// Types
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

interface PerformanceSummary {
  averagePageLoad: number;
  averageApiResponse: number;
  averageLCP: number;
  totalMetrics: {
    navigation: number;
    api: number;
    lcp: number;
  };
  recentMetrics: {
    navigation: PerformanceMetric[];
    api: PerformanceMetric[];
    lcp: PerformanceMetric[];
  };
}

interface OptimizationRecommendation {
  category: 'performance' | 'api' | 'ux' | 'accessibility';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  suggestions: string[];
}

// Utility functions for common performance measurements
export function measureExecutionTime<T>(fn: () => T, label: string = 'Execution'): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();

  log.info(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);

  if (typeof window !== 'undefined') {
    PerformanceMonitor.getInstance().recordMetric('custom', {
      name: label,
      value: end - start,
      timestamp: Date.now()
    });
  }

  return result;
}

export function measureAsyncExecutionTime<T>(
  promise: Promise<T>,
  label: string = 'Async Execution'
): Promise<T> {
  const start = performance.now();

  return promise
    .then(result => {
      const end = performance.now();
      log.info(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);

      if (typeof window !== 'undefined') {
        PerformanceMonitor.getInstance().recordMetric('custom', {
          name: label,
          value: end - start,
          timestamp: Date.now()
        });
      }

      return result;
    })
    .catch(error => {
      const end = performance.now();
      log.error(`❌ ${label}: ${(end - start).toFixed(2)}ms (failed)`);

      if (typeof window !== 'undefined') {
        PerformanceMonitor.getInstance().recordMetric('custom', {
          name: `${label}_error`,
          value: end - start,
          timestamp: Date.now()
        });
      }

      throw error;
    });
}
