'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorBoundary as ErrorHandler } from '@/lib/monitoring/performance';
import Button from './Button';
import Card from './Card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our error handler
    const errorReport = ErrorHandler.catch(error, errorInfo);

    // Update state with error ID for reference
    this.setState({ errorId: errorReport.timestamp });

    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console for development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="text-center space-y-6">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </div>

              {/* Error Message */}
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Something went wrong
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  We encountered an unexpected error. Please try again or go back to the home page.
                </p>
              </div>

              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={this.handleRetry}
                  icon={<RefreshCw className="w-4 h-4" />}
                  className="w-full"
                >
                  Try Again
                </Button>

                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  icon={<Home className="w-4 h-4" />}
                  className="w-full"
                >
                  Go Home
                </Button>
              </div>

              {/* Error ID for support */}
              {this.state.errorId && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Error ID: {this.state.errorId.split('T')[1]?.replace(/[:.]/g, '') || this.state.errorId}
                </p>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for functional components to use error boundary
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    ErrorHandler.catch(error, errorInfo);
  };
}
