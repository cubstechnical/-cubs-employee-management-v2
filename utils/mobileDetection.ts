import { log } from '@/lib/utils/productionLogger';
/**
 * Mobile Detection Utility
 * Simple, reliable mobile detection that works across all browsers
 */

export const isMobileDevice = (): boolean => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  
  try {
    // More precise mobile detection
    const isSmallScreen = window.innerWidth < 768; // Only consider screens < 768px as mobile
    const isTouchDevice = 'ontouchstart' in window || (navigator.maxTouchPoints ? navigator.maxTouchPoints > 0 : false);
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
    
    // Only return true if it's actually a mobile device (small screen AND mobile user agent)
    // OR if it's a very small screen (phone-sized)
    return (isSmallScreen && isMobileUserAgent) || window.innerWidth < 480;
  } catch (error) {
    // Fallback to false if any error occurs
    return false;
  }
};

export const isSmallScreen = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.innerWidth < 1024;
  } catch (error) {
    return false;
  }
};

export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  try {
    return 'ontouchstart' in window || (navigator.maxTouchPoints ? navigator.maxTouchPoints > 0 : false);
  } catch (error) {
    return false;
  }
};

export const getScreenSize = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  
  try {
    const width = window.innerWidth;
    
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  } catch (error) {
    return 'desktop';
  }
};

export const addMobileClass = (): void => {
  if (typeof document === 'undefined') return;

  try {
    if (isMobileDevice()) {
      document.body.classList.add('mobile-device');
    } else {
      document.body.classList.remove('mobile-device');
    }
  } catch (error) {
    // Silently handle any errors
  }
};

export const isCapacitorApp = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const userAgent = navigator.userAgent || '';
    
    // Check for Capacitor-specific indicators
    const isCapacitor = !!window.Capacitor;
    const hasCapacitorPlugins = !!window.Capacitor?.isNative;
    const userAgentContainsCapacitor = /Capacitor/i.test(userAgent);
    
    // Enhanced iPhone detection for ALL iPhone models
    const isIPhone = /iPhone/.test(userAgent);
    const isIPad = /iPad/.test(userAgent);
    const isIPod = /iPod/.test(userAgent);
    const isIOSDevice = isIPhone || isIPad || isIPod;
    
    // Check if it's an iOS app (not Safari browser)
    const isIOSApp = isIOSDevice && 
                     !/Safari/.test(userAgent) &&
                     !/Chrome/.test(userAgent) &&
                     !/Firefox/.test(userAgent) &&
                     !/Edge/.test(userAgent);
    
    // Check for Capacitor in window object
    const hasCapacitorWindow = !!(window as any).Capacitor;
    
    // Check for iOS WKWebView (Capacitor uses this)
    const isWKWebView = /AppleWebKit/.test(userAgent) && 
                       !/Safari/.test(userAgent) &&
                       isIOSDevice;
    
    // Check for iOS version patterns (iPhone 6, 7, 8, X, 11, 12, 13, 14, 15, 16, 17, etc.)
    const isIPhoneModel = /iPhone OS|iPhone/.test(userAgent) && 
                         !/Safari/.test(userAgent);
    
    // Check for iOS app indicators
    const hasIOSAppIndicators = /Mobile\/[A-Z0-9]+/.test(userAgent) && isIOSDevice;
    
    // Check for Capacitor-specific window properties
    const hasCapacitorProperties = !!(window as any).Capacitor?.isNative || 
                                   !!(window as any).Capacitor?.platform;

    return isCapacitor || 
           hasCapacitorPlugins || 
           userAgentContainsCapacitor || 
           isIOSApp || 
           hasCapacitorWindow || 
           isWKWebView ||
           isIPhoneModel ||
           hasIOSAppIndicators ||
           hasCapacitorProperties;
  } catch (error) {
    return false;
  }
};

export const isNativePlatform = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const userAgent = navigator.userAgent || '';
    
    // Check for native platform indicators
    const capacitor = !!window.Capacitor;
    const isNative = !!window.Capacitor?.isNative;
    
    // Enhanced iOS native app detection for ALL iPhone models
    const isIPhone = /iPhone/.test(userAgent);
    const isIPad = /iPad/.test(userAgent);
    const isIPod = /iPod/.test(userAgent);
    const isIOSDevice = isIPhone || isIPad || isIPod;
    
    // Check for iOS native app (not Safari browser)
    const isIOSNative = isIOSDevice && 
                        !/Safari/.test(userAgent) &&
                        !/Chrome/.test(userAgent) &&
                        !/Firefox/.test(userAgent) &&
                        !/Edge/.test(userAgent);
    
    // Check for Android native app
    const isAndroidNative = /Android/.test(userAgent) && 
                           !/Chrome|Firefox|Safari|Edge/.test(userAgent);
    
    // Check for iOS version patterns (all iPhone models)
    const isIPhoneModel = /iPhone OS|iPhone/.test(userAgent) && 
                         !/Safari/.test(userAgent);
    
    // Check for iOS app indicators
    const hasIOSAppIndicators = /Mobile\/[A-Z0-9]+/.test(userAgent) && isIOSDevice;
    
    // Check for Capacitor-specific properties
    const hasCapacitorProperties = !!(window as any).Capacitor?.isNative || 
                                   !!(window as any).Capacitor?.platform;

    return capacitor || 
           isNative || 
           isIOSNative || 
           isAndroidNative ||
           isIPhoneModel ||
           hasIOSAppIndicators ||
           hasCapacitorProperties;
  } catch (error) {
    return false;
  }
};

/**
 * Enhanced iPhone detection for ALL iPhone models
 * Detects iPhone 6, 7, 8, X, 11, 12, 13, 14, 15, 16, 17, etc.
 */
export const isIPhoneDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const userAgent = navigator.userAgent || '';
    
    // Basic iPhone detection
    const isIPhone = /iPhone/.test(userAgent);
    
    // Check for iPhone OS patterns
    const isIPhoneOS = /iPhone OS/.test(userAgent);
    
    // Check for iPhone model patterns (iPhone 6, 7, 8, X, 11, 12, 13, 14, 15, 16, 17, etc.)
    const isIPhoneModel = /iPhone\s*[0-9]+/.test(userAgent);
    
    // Check for iPhone in app context (not Safari)
    const isIPhoneApp = isIPhone && !/Safari/.test(userAgent);
    
    // Check for iPhone with iOS version
    const isIPhoneWithIOS = /iPhone.*OS\s*[0-9]+/.test(userAgent);
    
    // Check for iPhone with Mobile pattern
    const isIPhoneMobile = /iPhone.*Mobile/.test(userAgent);
    
    return isIPhone || isIPhoneOS || isIPhoneModel || isIPhoneApp || isIPhoneWithIOS || isIPhoneMobile;
  } catch (error) {
    return false;
  }
};

/**
 * Get iPhone model information
 */
export const getIPhoneModel = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const userAgent = navigator.userAgent || '';
    
    if (!isIPhoneDevice()) return null;
    
    // Extract iPhone model from user agent
    const iphoneMatch = userAgent.match(/iPhone\s*([0-9]+)/);
    if (iphoneMatch) {
      return `iPhone ${iphoneMatch[1]}`;
    }
    
    // Check for iPhone OS version
    const iosMatch = userAgent.match(/iPhone OS\s*([0-9_]+)/);
    if (iosMatch) {
      return `iPhone (iOS ${iosMatch[1].replace(/_/g, '.')})`;
    }
    
    return 'iPhone';
  } catch (error) {
    return null;
  }
};

/**
 * Check if device is iPhone in Capacitor app
 */
export const isIPhoneCapacitorApp = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const userAgent = navigator.userAgent || '';
    
    // Must be iPhone
    if (!isIPhoneDevice()) return false;
    
    // Must be in app context (not Safari)
    const isInApp = !/Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    
    // Check for Capacitor indicators
    const hasCapacitor = !!window.Capacitor;
    const hasCapacitorNative = !!(window as any).Capacitor?.isNative;
    const hasCapacitorPlatform = !!(window as any).Capacitor?.platform;
    
    // Check for WKWebView (Capacitor uses this)
    const isWKWebView = /AppleWebKit/.test(userAgent) && !/Safari/.test(userAgent);
    
    // Check for iOS app indicators
    const hasIOSAppIndicators = /Mobile\/[A-Z0-9]+/.test(userAgent);
    
    return isInApp && (hasCapacitor || hasCapacitorNative || hasCapacitorPlatform || isWKWebView || hasIOSAppIndicators);
  } catch (error) {
    return false;
  }
};

export const suppressMobileWarnings = (): void => {
  if (typeof window === 'undefined') return;

  try {
    // Suppress common mobile app warnings
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');

      // Suppress specific warnings we know are harmless
      if (
        message.includes('Not running on native platform') ||
        message.includes('MIME type') ||
        message.includes('text/css') ||
        message.includes('executable') ||
        message.includes('strict MIME type checking') ||
        message.includes('script from') ||
        message.includes('skipp') // Capacitor skip message
      ) {
        // Log as warning instead of error for better visibility in development
        if (process.env.NODE_ENV === 'development') {
          log.warn('[SUPPRESSED]', ...args);
        }
        return;
      }

      // Call original error for other messages
      originalError.apply(console, args);
    };
  } catch (error) {
    // If we can't suppress warnings, just continue
    log.warn('Could not suppress mobile warnings:', error);
  }
};
