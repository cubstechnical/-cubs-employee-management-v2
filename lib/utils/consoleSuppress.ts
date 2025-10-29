/**
 * Early console suppression for mobile devices
 * This MUST be imported FIRST before any other modules to ensure console is suppressed before any logs
 */

// Immediately check if we're on mobile/Capacitor
const isMobileOrCapacitor = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  
  try {
    const userAgent = navigator.userAgent || '';
    const isAndroidWebView = /Android/i.test(userAgent) && /; wv\)/i.test(userAgent);
    const isCapacitorNative = !!(window as any).Capacitor?.isNative || !!(window as any).Capacitor?.platform;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    return isAndroidWebView || isCapacitorNative || isMobileUA;
  } catch (e) {
    return false;
  }
};

// Immediately suppress console on mobile - runs at module load time
if (typeof window !== 'undefined' && isMobileOrCapacitor()) {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
    error: console.error,
  };

  const noop = () => {};

  // Override all console methods except error
  console.log = noop;
  console.warn = noop;
  console.info = noop;
  console.debug = noop;
  console.group = noop;
  console.groupEnd = noop;
  console.groupCollapsed = noop;
  console.time = noop;
  console.timeEnd = noop;
  console.timeLog = noop;
  console.table = noop;
  console.count = noop;
  console.countReset = noop;
  console.dir = noop;
  console.dirxml = noop;
  console.clear = noop;

  // Keep console.error but filter it
  console.error = (...args: any[]) => {
    const hasRealError = args.some(arg => {
      if (arg instanceof Error) return true;
      if (typeof arg === 'string') {
        const lower = arg.toLowerCase();
        return lower.includes('error') || lower.includes('exception') || lower.includes('failed');
      }
      return false;
    });

    if (hasRealError) {
      originalConsole.error.apply(console, args);
    }
  };

  // Lock the console object
  try {
    Object.defineProperty(window, 'console', {
      value: console,
      configurable: false,
      writable: false,
    });
  } catch (e) {
    // Ignore if we can't lock it
  }
}

export {};
