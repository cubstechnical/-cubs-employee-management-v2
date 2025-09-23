'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface UnifiedErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string;
  showNetworkStatus?: boolean;
  onRetry?: () => void;
}

interface UnifiedErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isOnline: boolean;
}

export class UnifiedErrorBoundary extends Component<UnifiedErrorBoundaryProps, UnifiedErrorBoundaryState> {
  constructor(props: UnifiedErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
    };
  }

  static getDerivedStateFromError(error: Error): Partial<UnifiedErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.context || 'component'}:`, error, errorInfo);
    this.setState({ errorInfo });
    
    // Show user-friendly error message
    toast.error(`Something went wrong in ${this.props.context || 'the application'}. Please try again.`);
  }

  componentDidMount() {
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
  }

  handleOnline = () => {
    this.setState({ isOnline: true });
  };

  handleOffline = () => {
    this.setState({ isOnline: false });
  };

  handleRetry = () => {
    if (this.props.onRetry) {
      this.props.onRetry();
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {this.props.context ? `${this.props.context} Error` : 'Something went wrong'}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            {/* Network Status */}
            {this.props.showNetworkStatus && (
              <div className="flex items-center justify-center mb-4">
                {this.state.isOnline ? (
                  <div className="flex items-center text-green-600">
                    <Wifi className="h-4 w-4 mr-2" />
                    <span className="text-sm">Online</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <WifiOff className="h-4 w-4 mr-2" />
                    <span className="text-sm">Offline</span>
                  </div>
                )}
              </div>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <Home className="h-4 w-4 mr-2" />
                Reload Page
              </button>
            </div>

            {/* Troubleshooting tips */}
            <div className="mt-6 text-left">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Troubleshooting Tips:
              </h3>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Check your internet connection</li>
                <li>• Try refreshing the page</li>
                <li>• Clear your browser cache</li>
                <li>• Contact support if the problem persists</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default UnifiedErrorBoundary;
