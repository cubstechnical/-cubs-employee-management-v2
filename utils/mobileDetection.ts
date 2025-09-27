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
    // More robust check: ensure Capacitor exists and has native platform capability
    const capacitor = window.Capacitor;
    if (!capacitor) return false;

    // Check if isNativePlatform method exists and returns true
    const isNativeMethod = (capacitor as any).isNativePlatform;
    if (typeof isNativeMethod !== 'function') return false;

    return isNativeMethod();
  } catch (error) {
    // Log error in development but don't break functionality
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error detecting Capacitor app:', error);
    }
    return false;
  }
};

export const isNativePlatform = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    // Simple check: if Capacitor exists and is native, it's a native platform
    return !!(window.Capacitor && (window.Capacitor as any).isNativePlatform && (window.Capacitor as any).isNativePlatform());
  } catch (error) {
    return false;
  }
};

// Simple iPhone detection - just check if it's an iPhone
export const isIPhoneDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const userAgent = navigator.userAgent || '';
    return /iPhone/.test(userAgent);
  } catch (error) {
    return false;
  }
};

// Simple iPhone Capacitor app detection
export const isIPhoneCapacitorApp = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    // Must be iPhone and have Capacitor
    return isIPhoneDevice() && isCapacitorApp();
  } catch (error) {
    return false;
  }
};

export const suppressMobileWarnings = (): void => {
  if (typeof window === 'undefined') return;

  try {
    // Suppress only the most common harmless mobile warnings
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');

      // Suppress specific warnings we know are harmless
      if (
        message.includes('Not running on native platform')
      ) {
        // Log as warning instead of error for better visibility in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('[SUPPRESSED]', ...args);
        }
        return;
      }

      // Call original error for other messages
      originalError.apply(console, args);
    };
  } catch (error) {
    // If we can't suppress warnings, just continue
    console.warn('Could not suppress mobile warnings:', error);
  }
};
