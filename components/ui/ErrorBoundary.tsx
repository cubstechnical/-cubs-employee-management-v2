'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import Button from './Button';
import Card from './Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log to monitoring service if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }

    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 React Error Boundary');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleRefresh = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = '/dashboard';
    }
  };

  handleReportBug = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    const errorDetails = {
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Create mailto link with error details
    const subject = encodeURIComponent('CUBS App Error Report');
    const body = encodeURIComponent(`
Error Report:
${JSON.stringify(errorDetails, null, 2)}

Please describe what you were doing when this error occurred:
[Your description here]
    `);

    window.open(`mailto:info@cubstechnical.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 safe-area-inset-top safe-area-inset-bottom">
          <Card className="max-w-lg w-full p-6 sm:p-8 text-center mx-4">
            <div className="mb-6">
              <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                We&apos;re sorry, but something unexpected happened. Don&apos;t worry, your data is safe.
              </p>
            </div>

            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-left">
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2 text-sm sm:text-base">
                  Error Details (Development Only)
                </h3>
                <div className="text-xs sm:text-sm text-red-700 dark:text-red-300 font-mono overflow-auto max-h-24 sm:max-h-32">
                  <p className="mb-2"><strong>Message:</strong> {this.state.error.message}</p>
                  <p><strong>Stack:</strong></p>
                  <pre className="whitespace-pre-wrap text-xs">
                    {this.state.error.stack}
                  </pre>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={this.handleRefresh}
                className="w-full bg-[#d3194f] hover:bg-[#b0173a] text-white py-3 sm:py-2 touch-manipulation"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 py-3 sm:py-2 touch-manipulation"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>

                <Button
                  onClick={this.handleReportBug}
                  variant="outline"
                  className="flex-1 py-3 sm:py-2 touch-manipulation"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Report Bug
                </Button>
              </div>
            </div>

            {/* Additional help */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                If this problem persists, please contact{' '}
                <a 
                  href="mailto:info@cubstechnical.com" 
                  className="text-[#d3194f] hover:underline"
                >
                  info@cubstechnical.com
                </a>
              </p>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Export the ErrorBoundary as both named and default export
export const ErrorBoundary = ErrorBoundaryClass;
export default ErrorBoundaryClass;

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for handling errors in functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    console.error('Manual error report:', error);
    
    // Log to monitoring service
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: errorInfo
        }
      });
    }
    
    // You could also trigger a state update to show an error message
    throw error; // Re-throw to trigger error boundary
  };
}