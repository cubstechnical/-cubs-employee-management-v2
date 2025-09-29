/**
 * Mobile Crash Detection Hook
 * Helps identify and debug mobile-specific crashes in production
 */

import { useEffect, useCallback, useState } from 'react';
import { log } from '@/lib/utils/productionLogger';
import { isCapacitorApp } from '@/utils/mobileDetection';

interface CrashReport {
  error: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: number;
  platform: string;
  isMobile: boolean;
  storageCapabilities: {
    localStorage: boolean;
    sessionStorage: boolean;
    cookies: boolean;
  };
}

// Storage capability detection utility (available globally)
export const detectStorageCapabilities = () => {
  if (typeof window === 'undefined') {
    return { localStorage: false, sessionStorage: false, cookies: false };
  }

  let localStorage = false;
  let sessionStorage = false;
  let cookies = false;

  try {
    const ls = window.localStorage;
    if (ls) {
      ls.setItem('test', 'test');
      ls.removeItem('test');
      localStorage = true;
    }
  } catch (error) {
    console.warn('localStorage capability check failed:', error);
  }

  try {
    const ss = window.sessionStorage;
    if (ss) {
      ss.setItem('test', 'test');
      ss.removeItem('test');
      sessionStorage = true;
    }
  } catch (error) {
    console.warn('sessionStorage capability check failed:', error);
  }

  try {
    document.cookie = 'test=value';
    cookies = document.cookie.includes('test=value');
    document.cookie = 'test=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  } catch (error) {
    console.warn('Cookie capability check failed:', error);
  }

  return { localStorage, sessionStorage, cookies };
};

export const useMobileCrashDetection = () => {
  const detectStorageCapabilitiesCallback = useCallback(() => detectStorageCapabilities(), []);

  const handleError = useCallback((event: ErrorEvent) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Mobile Crash Detected:', event);
    }

    const crashReport: CrashReport = {
      error: event.message,
      stack: event.error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      platform: isCapacitorApp() ? 'capacitor' : 'web',
      isMobile: isCapacitorApp(),
      storageCapabilities: detectStorageCapabilities()
    };

    // Log crash report
    log.error('Mobile Crash Report:', crashReport);

    // In production, you could send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service (replace with your service)
      // errorTrackingService.captureException(event.error, { extra: crashReport });
    }
  }, [detectStorageCapabilities]);

  const handleUnhandledRejection = useCallback((event: PromiseRejectionEvent) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Unhandled Promise Rejection:', event);
    }

    const crashReport: CrashReport = {
      error: event.reason?.message || 'Unhandled Promise Rejection',
      stack: event.reason?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      platform: isCapacitorApp() ? 'capacitor' : 'web',
      isMobile: isCapacitorApp(),
      storageCapabilities: detectStorageCapabilities()
    };

    log.error('Mobile Unhandled Rejection:', crashReport);

    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
    }
  }, [detectStorageCapabilities]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Global error handlers
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Log initial capabilities for debugging
    const capabilities = detectStorageCapabilities();
    log.info('Mobile Crash Detection: Storage capabilities detected', capabilities);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleError, handleUnhandledRejection, detectStorageCapabilities]);

  // Return detection utilities for manual use
  return {
    detectStorageCapabilities,
    handleError,
    handleUnhandledRejection
  };
};

// Hook for detecting mobile-specific issues
export const useMobileDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState<{
    isCapacitor: boolean;
    platform: string;
    userAgent: string;
    viewport: { width: number; height: number };
    storage: { localStorage: boolean; sessionStorage: boolean; cookies: boolean };
    network: { online: boolean; connection?: string };
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const getDiagnostics = () => {
      const storage = detectStorageCapabilities();

      return {
        isCapacitor: isCapacitorApp(),
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        storage,
        network: {
          online: navigator.onLine,
          connection: (navigator as any).connection?.effectiveType
        }
      };
    };

    setDiagnostics(getDiagnostics());

    // Update on resize
    const handleResize = () => {
      setDiagnostics(prev => prev ? { ...prev, viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }} : null);
    };

    // Update on online/offline
    const handleOnline = () => {
      setDiagnostics(prev => prev ? { ...prev, network: { ...prev.network, online: true }} : null);
    };

    const handleOffline = () => {
      setDiagnostics(prev => prev ? { ...prev, network: { ...prev.network, online: false }} : null);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return diagnostics;
};
