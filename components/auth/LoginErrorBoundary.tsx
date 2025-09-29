'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Smartphone, Wifi, RotateCcw } from 'lucide-react';
import { log } from '@/lib/utils/productionLogger';
import { isCapacitorApp } from '@/utils/mobileDetection';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
  isOnline: boolean;
}

export class LoginErrorBoundary extends Component<Props, State> {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      retryCount: 0,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    log.error('LoginErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with Sentry or other error tracking services here
      log.error('Production login error:', { error, errorInfo });
    }
  }

  componentDidMount() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  handleOnline = () => {
    this.setState({ isOnline: true });
  };

  handleOffline = () => {
    this.setState({ isOnline: false });
  };

  handleRetry = () => {
    const { retryCount } = this.state;
    const newRetryCount = retryCount + 1;

    if (newRetryCount <= 3) {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: newRetryCount
      });
      log.info(`LoginErrorBoundary: Retry attempt ${newRetryCount}`);
    } else {
      // After 3 retries, do a force refresh
      this.handleForceRefresh();
    }
  };

  handleForceRefresh = () => {
    if (typeof window !== 'undefined') {
      try {
        // Clear all app data and reload
        localStorage.clear();
        sessionStorage.clear();

        // Clear service worker caches if available
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }

        // Reload the app
        window.location.reload();
      } catch (error) {
        log.error('LoginErrorBoundary: Force refresh failed:', error);
        // Ultimate fallback
        window.location.href = '/';
      }
    }
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      try {
        // Clear any cached data that might be causing issues
        localStorage.clear();
        sessionStorage.clear();
        // Navigate to home
        window.location.href = '/';
      } catch (error) {
        log.error('LoginErrorBoundary: Failed to navigate home:', error);
        // Fallback to reload
        window.location.reload();
      }
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isMobile = isCapacitorApp();
      const { retryCount, isOnline } = this.state;
      const canRetry = retryCount < 3;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 safe-area-all">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Login Error
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred while loading the login page.'}
            </p>

            {/* Network Status */}
            <div className="flex items-center justify-center mb-4">
              {isOnline ? (
                <div className="flex items-center text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-full">
                  <Wifi className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Online</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-full">
                  <Wifi className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Offline</span>
                </div>
              )}
            </div>

            {/* Retry Status */}
            {retryCount > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Retry attempt {retryCount} of 3
                </p>
              </div>
            )}

            <div className="space-y-3">
              {canRetry ? (
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-[#d3194f] hover:bg-[#a91542] text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again ({3 - retryCount} attempts left)
                </button>
              ) : (
                <button
                  onClick={this.handleForceRefresh}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Force Refresh App
                </button>
              )}

              <button
                onClick={this.handleGoHome}
                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </button>
            </div>

            {/* Enhanced Mobile-specific troubleshooting */}
            {isMobile && (
              <div className="mt-6 space-y-3">
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <Smartphone className="h-4 w-4 mr-1" />
                    Mobile Troubleshooting:
                  </h3>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Check your internet connection</li>
                    <li>• Try switching between WiFi and mobile data</li>
                    <li>• Try closing and reopening the app</li>
                    <li>• Restart your device if the problem persists</li>
                    <li>• Make sure you have the latest app version</li>
                  </ul>
                </div>

                {!isOnline && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      📱 You&apos;re currently offline. Please check your internet connection and try again.
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    🔧 If the problem persists, try clearing your browser/app data or contact support.
                  </p>
                </div>
              </div>
            )}

            {/* Development error details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left text-sm text-gray-500 dark:text-gray-400">
                <summary className="cursor-pointer mb-2 font-medium">Error Details (Development)</summary>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LoginErrorBoundary;
