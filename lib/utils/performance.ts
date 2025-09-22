// Performance monitoring and optimization utilities

export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now();
  
  try {
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const end = performance.now();
        console.log(`Performance: ${name} took ${end - start}ms`);
      });
    } else {
      const end = performance.now();
      console.log(`Performance: ${name} took ${end - start}ms`);
      return result;
    }
  } catch (error) {
    const end = performance.now();
    console.error(`Performance: ${name} failed after ${end - start}ms`, error);
    throw error;
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined;
  
  return (...args: Parameters<T>) => {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memory leak detection
export function detectMemoryLeaks() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const memory = (performance as any).memory;
    if (memory) {
      console.log('Memory usage:', {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
      });
    }
  }
}

// Chunk loading error handler
export function handleChunkError(error: Error) {
  if (error.message.includes('Loading chunk') || error.message.includes('ChunkLoadError')) {
    console.warn('Chunk loading error detected, reloading page:', error.message);
    
    // Clear caches
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    
    // Clear localStorage cache
    try {
      localStorage.removeItem('app-cache');
      localStorage.removeItem('supabase.auth.token');
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }
    
    // Reload page
    window.location.reload();
  }
}

// Initialize chunk error handling
export function initializeErrorHandling() {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      handleChunkError(event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason instanceof Error) {
        handleChunkError(event.reason);
      }
    });
  }
}
