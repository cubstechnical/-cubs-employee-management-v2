/**
 * Mobile Detection Utility
 * Simple, reliable mobile detection that works across all browsers
 */

export const isMobileDevice = (): boolean => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return false;
  
  // Simple and reliable mobile detection
  const isSmallScreen = window.innerWidth < 1024;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return isSmallScreen || isTouchDevice;
};

export const isSmallScreen = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 1024;
};

export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const getScreenSize = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

export const addMobileClass = (): void => {
  if (typeof document === 'undefined') return;
  
  if (isMobileDevice()) {
    document.body.classList.add('mobile-device');
  } else {
    document.body.classList.remove('mobile-device');
  }
};
