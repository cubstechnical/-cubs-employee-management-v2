'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ErrorBoundaryHookProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface ErrorState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('ErrorBoundaryHook caught an error:', event.error);
      setError(event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('ErrorBoundaryHook caught an unhandled rejection:', event.reason);
      setError(new Error(event.reason));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const resetError = () => {
    setError(null);
  };

  return { error, resetError };
}

export default function ErrorBoundaryHook({ 
  children, 
  fallback, 
  onError 
}: ErrorBoundaryHookProps) {
  const [errorState, setErrorState] = useState<ErrorState>({ hasError: false });

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      const errorInfo = {
        componentStack: error.stack || 'No stack trace available',
        message: error.message,
        name: error.name
      };

      console.error('ErrorBoundaryHook caught an error:', error, errorInfo);
      
      setErrorState({ hasError: true, error, errorInfo });

      // Call the onError callback if provided
      if (onError) {
        onError(error, errorInfo);
      }

      // Log to external service (e.g., Sentry) in production
      if (process.env.NODE_ENV === 'production') {
        // You can integrate with Sentry or other error tracking services here
        // Sentry.captureException(error, { extra: errorInfo });
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(event.reason);
      const errorInfo = {
        componentStack: error.stack || 'No stack trace available',
        message: error.message,
        name: error.name
      };

      console.error('ErrorBoundaryHook caught an unhandled rejection:', error, errorInfo);
      
      setErrorState({ hasError: true, error, errorInfo });

      if (onError) {
        onError(error, errorInfo);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  const handleRetry = () => {
    setErrorState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  if (errorState.hasError) {
    // Custom fallback UI
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default error UI
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Something went wrong
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && errorState.error && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Error Details (Development)
              </summary>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-40">
                <div className="mb-2">
                  <strong>Error:</strong> {errorState.error.message}
                </div>
                {errorState.error.stack && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1">{errorState.error.stack}</pre>
                  </div>
                )}
                {errorState.errorInfo && (
                  <div className="mt-2">
                    <strong>Component Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1">{errorState.errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleRetry}
              className="w-full"
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Try Again
            </Button>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="flex-1"
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Go Back
              </Button>
              
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="flex-1"
                icon={<Home className="w-4 h-4" />}
              >
                Go Home
              </Button>
            </div>
          </div>

          {/* Support Contact */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Need help? Contact support at{' '}
              <a
                href="mailto:support@cubstechnical.com"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                support@cubstechnical.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

