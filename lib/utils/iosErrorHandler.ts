'use client';

// iOS-specific error handling for Capacitor apps
export class IOSErrorHandler {
  private static isInitialized = false;

  static init() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    
    this.isInitialized = true;
    
    // Global error handler for iOS
    window.addEventListener('error', (event) => {
      console.error('iOS Error:', event.error);
      this.handleError(event.error);
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('iOS Unhandled Promise Rejection:', event.reason);
      this.handleError(event.reason);
    });

    // Capacitor-specific error handling
    if (window.Capacitor && (window.Capacitor as any).addListener) {
      (window.Capacitor as any).addListener('appStateChange', ({ isActive }: { isActive: boolean }) => {
        if (isActive) {
          console.log('📱 App became active');
          this.checkAppHealth();
        }
      });
    }
  }

  private static handleError(error: any) {
    console.error('🚨 iOS Error Handler:', error);
    
    // Try to recover from common iOS errors
    if (error?.message?.includes('Cannot read properties')) {
      console.log('🔄 Attempting to recover from property access error...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  private static checkAppHealth() {
    // Check if the app is properly loaded
    const rootElement = document.getElementById('__next');
    if (!rootElement || rootElement.children.length === 0) {
      console.warn('⚠️ App root not found, attempting recovery...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }
}

// Don't auto-initialize - let components handle error recovery
// This prevents conflicts with other error handling systems
