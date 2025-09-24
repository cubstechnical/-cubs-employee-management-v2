// Performance utilities for production optimization

export class PerformanceOptimizer {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  // Cache with TTL
  static setCache(key: string, data: any, ttl: number = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  static getCache(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  static clearCache(pattern?: string) {
    if (pattern) {
      for (const [key] of this.cache) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Debounce function calls
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }

  // Throttle function calls
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func.apply(null, args);
      }
    };
  }

  // Lazy load images
  static setupLazyLoading() {
    if (typeof window === 'undefined') return;

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.classList.remove('blur-sm');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  // Preload critical resources
  static preloadCriticalResources() {
    if (typeof window === 'undefined') return;

    const criticalResources = [
      '/assets/cubs.webp',
      '/assets/appicon.png'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  // Optimize bundle loading
  static async loadModule(importFn: () => Promise<any>) {
    try {
      const module = await importFn();
      return module.default || module;
    } catch (error) {
      console.error('Failed to load module:', error);
      return null;
    }
  }

  // Memory cleanup
  static cleanupMemory() {
    // Clear old cache entries
    const now = Date.now();
    for (const [key, item] of this.cache) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  // Performance monitoring
  static measurePerformance(name: string, fn: () => void | Promise<void>) {
    const start = performance.now();
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.then(() => {
        const end = performance.now();
        console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
      });
    } else {
      const end = performance.now();
      console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
    }
  }

  // Check if device is low-end
  static isLowEndDevice(): boolean {
    if (typeof navigator === 'undefined') return false;

    // Check memory (if available)
    const memory = (navigator as any).deviceMemory;
    if (memory && memory <= 4) return true;

    // Check CPU cores (if available)
    const cores = navigator.hardwareConcurrency;
    if (cores && cores <= 2) return true;

    // Check connection type
    const connection = (navigator as any).connection;
    if (connection) {
      const slowConnections = ['slow-2g', '2g', '3g'];
      if (slowConnections.includes(connection.effectiveType)) return true;
    }

    return false;
  }

  // Adaptive performance settings
  static getPerformanceSettings() {
    const isLowEnd = this.isLowEndDevice();
    
    return {
      enableAnimations: !isLowEnd,
      enableTransitions: !isLowEnd,
      cacheTimeout: isLowEnd ? 600000 : 300000, // 10min vs 5min
      batchSize: isLowEnd ? 10 : 20,
      debounceDelay: isLowEnd ? 500 : 300,
      enableVirtualization: !isLowEnd
    };
  }
}

// Initialize performance optimizations
if (typeof window !== 'undefined') {
  // Setup lazy loading
  document.addEventListener('DOMContentLoaded', () => {
    PerformanceOptimizer.setupLazyLoading();
    PerformanceOptimizer.preloadCriticalResources();
  });

  // Cleanup memory periodically
  setInterval(() => {
    PerformanceOptimizer.cleanupMemory();
  }, 300000); // Every 5 minutes

  // Monitor performance
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      console.log('📊 Page Load Performance:', {
        loadTime: `${navigation.loadEventEnd - navigation.loadEventStart}ms`,
        domReady: `${navigation.domContentLoadedEventEnd - navigation.navigationStart}ms`,
        totalTime: `${navigation.loadEventEnd - navigation.navigationStart}ms`
      });
    }, 1000);
  });
}
