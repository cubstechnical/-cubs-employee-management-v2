/**
 * Production-safe logging utility
 * Removes console logs in production to improve performance
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
// Detect Capacitor (native mobile)
const isNativeMobile = typeof window !== 'undefined' && (window as any).Capacitor;
// Suppress logs on native mobile even in development to avoid noisy debug console
const allowVerboseLogs = isDevelopment && !isNativeMobile;

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

// Remove console methods in production
if (isProduction || isNativeMobile) {
  // Override console methods to be no-ops in production
  const noop = () => {};
  
  // Keep error logging for production debugging
  // console.error = console.error; // Keep errors
  
  // Remove other console methods
  console.log = noop;
  console.warn = noop;
  console.debug = noop;
  console.info = noop;
  console.group = noop;
  console.groupEnd = noop;
  console.time = noop;
  console.timeEnd = noop;
  console.timeStamp = noop;
}

export default log;
