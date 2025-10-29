/**
 * Production-safe logging utility
 * Removes console logs in production to improve performance
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Enhanced mobile detection that works in all environments
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const userAgent = navigator.userAgent || '';
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
      /; wv\)/.test(userAgent) || // Android WebView
      (window as any).Capacitor?.isNative ||
      (window as any).Capacitor?.platform
    );
  } catch (e) {
    return false;
  }
};

// Detect if we're in a Capacitor environment
const isCapacitor = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor;
};

// Only allow verbose logs in development and not in mobile/Capacitor
const allowVerboseLogs = isDevelopment && !isMobileDevice() && !isCapacitor();

// Debug info in development
if (isDevelopment && typeof window !== 'undefined') {
  console.log('Logger initialized with:', {
    env: process.env.NODE_ENV,
    isMobile: isMobileDevice(),
    isCapacitor: isCapacitor(),
    userAgent: navigator.userAgent,
    allowVerboseLogs
  });
}

// Production-safe console methods
export const log = {
  info: (...args: any[]) => {
    if (allowVerboseLogs) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (allowVerboseLogs) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  debug: (...args: any[]) => {
    if (allowVerboseLogs) {
      console.debug(...args);
    }
  },
  group: (label: string) => {
    if (allowVerboseLogs) {
      console.group(label);
    }
  },
  groupEnd: () => {
    if (allowVerboseLogs) {
      console.groupEnd();
    }
  }
};

// Performance logging (only in development)
export const perfLog = {
  start: (label: string) => {
    if (isDevelopment) {
      console.time(label);
    }
  },
  end: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  },
  mark: (label: string) => {
    if (isDevelopment) {
      console.timeStamp(label);
    }
  }
};

// Conditional logging based on environment
export const conditionalLog = {
  development: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  production: (...args: any[]) => {
    if (isProduction) {
      console.log(...args);
    }
  },
  always: (...args: any[]) => {
    console.log(...args);
  }
};

// Remove console methods in production or on mobile devices
if (isProduction || isMobileDevice() || isCapacitor()) {
  // Save original console methods
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
    info: console.info,
  };

  // No-op function
  const noop = (): void => {};
  
  // Enhanced error logging
  console.error = (...args: any[]): void => {
    // Only log errors that are actual errors
    const hasRealError = args.some(arg => {
      if (arg instanceof Error) return true;
      if (typeof arg === 'string') {
        const lowerArg = arg.toLowerCase();
        return lowerArg.includes('error') || 
               lowerArg.includes('failed') ||
               lowerArg.includes('exception') ||
               lowerArg.includes('invalid');
      }
      return false;
    });
    
    if (hasRealError) {
      // Use original console.error for better stack traces
      originalConsole.error.apply(console, args);
      
      // Optionally send error to error tracking service in production
      if (isProduction && typeof window !== 'undefined' && (window as any).Sentry) {
        try {
          (window as any).Sentry.captureException(args[0] || 'Unknown error occurred');
        } catch (e) {
          originalConsole.error('Error sending to Sentry:', e);
        }
      }
    }
  };
  
  // Override other console methods
  console.log = noop;
  console.warn = noop;
  console.debug = noop;
  console.info = noop;
  
  // Group methods
  console.group = noop;
  console.groupEnd = noop;
  console.groupCollapsed = noop;
  
  // Timing methods
  console.time = noop;
  console.timeEnd = noop;
  console.timeLog = noop;
  console.timeStamp = noop;
  
  // Other methods
  console.table = noop;
  console.clear = noop;
  console.count = noop;
  console.countReset = noop;
  console.dir = noop;
  console.dirxml = noop;
  
  // Make it non-configurable and non-writable
  try {
    Object.defineProperty(window, 'console', {
      value: console,
      configurable: false,
      writable: false
    });
  } catch (e) {
    // Ignore errors in strict mode
  }
}

export default log;
