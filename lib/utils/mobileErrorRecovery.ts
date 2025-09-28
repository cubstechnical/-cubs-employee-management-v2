'use client';

// Mobile-specific error recovery for Capacitor apps
export class MobileErrorRecovery {
  private static isInitialized = false;
  private static retryCount = 0;
  private static maxRetries = 3;

  static init() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    
    this.isInitialized = true;
    
    // Global error handler for mobile
    window.addEventListener('error', (event) => {
      console.error('Mobile Error:', event.error);
      this.handleError(event.error);
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Mobile Unhandled Promise Rejection:', event.reason);
      this.handleError(event.reason);
    });

    // Check app health periodically
    setInterval(() => {
      this.checkAppHealth();
    }, 30000); // Check every 30 seconds
  }

  private static handleError(error: any) {
    console.error('🚨 Mobile Error Recovery:', error);
    
    // Try to recover from common mobile errors
    if (error?.message?.includes('Cannot read properties') || 
        error?.message?.includes('undefined') ||
        error?.message?.includes('null')) {
      console.log('🔄 Attempting to recover from property access error...');
      this.attemptRecovery();
    }
  }

  private static attemptRecovery() {
    if (this.retryCount >= this.maxRetries) {
      console.error('❌ Max retries reached, showing error screen');
      this.showErrorScreen();
      return;
    }

    this.retryCount++;
    console.log(`🔄 Recovery attempt ${this.retryCount}/${this.maxRetries}`);

    // Try different recovery strategies
    setTimeout(() => {
      // Strategy 1: Reload the page
      if (this.retryCount === 1) {
        if (typeof window !== 'undefined' && (window as any).location) {
          (window as any).location.reload();
        }
      }
      // Strategy 2: Clear cache and reload
      else if (this.retryCount === 2) {
        if (typeof window !== 'undefined' && (window as any).location) {
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name));
              if ((window as any).location) (window as any).location.reload();
            });
          } else {
            (window as any).location.reload();
          }
        }
      }
      // Strategy 3: Clear localStorage and reload
      else {
        try {
          if (typeof localStorage !== 'undefined') localStorage.clear();
          if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
        } catch (e) {
          // Ignore storage errors
        }
        if (typeof window !== 'undefined' && (window as any).location) {
          (window as any).location.reload();
        }
      }
    }, 1000 * this.retryCount);
  }

  private static checkAppHealth() {
    // Check if the app is properly loaded
    const rootElement = document.getElementById('__next');
    if (!rootElement || rootElement.children.length === 0) {
      console.warn('⚠️ App root not found, attempting recovery...');
      this.attemptRecovery();
    }
  }

  private static showErrorScreen() {
    document.body.innerHTML = `
      <div style="
        display: flex; 
        justify-content: center; 
        align-items: center; 
        height: 100vh; 
        background: #111827; 
        color: white; 
        text-align: center; 
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div>
          <h2 style="color: #d3194f; margin-bottom: 20px;">App Recovery Failed</h2>
          <p style="margin-bottom: 20px;">The app encountered multiple errors and couldn't recover automatically.</p>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button 
              onclick="window.location.reload()" 
              style="
                background: #d3194f; 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 6px; 
                cursor: pointer;
                font-size: 16px;
              "
            >
              Restart App
            </button>
            <button 
              onclick="if(confirm('This will clear all app data. Continue?')) { localStorage.clear(); sessionStorage.clear(); window.location.reload(); }" 
              style="
                background: #374151; 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 6px; 
                cursor: pointer;
                font-size: 16px;
              "
            >
              Clear Data & Restart
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

// Initialize on import
if (typeof window !== 'undefined') {
  MobileErrorRecovery.init();
}
