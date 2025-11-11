/**
 * Mobile Navigation Utilities
 * Handles navigation and link opening in Capacitor mobile apps vs web
 */

import { Capacitor } from '@capacitor/core';

/**
 * Check if running in a native mobile app
 */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  return Capacitor.isNativePlatform();
}

/**
 * Open a URL - uses Capacitor Browser plugin in mobile, window.open in web
 */
export async function openUrl(url: string, options?: { target?: string }): Promise<void> {
  if (isNativeApp()) {
    // In mobile app, keep navigation inside the WebView
    if (typeof window !== 'undefined') {
      window.location.href = url;
      return;
    }
  } else {
    // In web, use standard window.open
    window.open(url, options?.target || '_blank', 'noopener,noreferrer');
  }
}

/**
 * Navigate to a route - uses router in web, prevents browser opening in mobile
 */
export function navigateTo(path: string, router?: any): void {
  if (isNativeApp()) {
    // In mobile app, use window.location to navigate within the app
    // This keeps navigation within the Capacitor WebView
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  } else {
    // In web, use Next.js router if available, otherwise window.location
    if (router && typeof router.push === 'function') {
      router.push(path);
    } else if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  }
}

/**
 * Open document URL - optimized for mobile apps
 */
export async function openDocument(url: string): Promise<void> {
  if (isNativeApp()) {
    // In mobile app, keep navigation inside the WebView
    if (typeof window !== 'undefined') {
      window.location.href = url;
      return;
    }
  } else {
    // In web, open in new tab
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}

