'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Mail } from 'lucide-react';
import Button from '@/components/ui/Button';
import { log } from '@/lib/utils/productionLogger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    log.error('AppErrorBoundary caught an error:', error, errorInfo);
    
    // Log to external service (e.g., Sentry) in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with Sentry or other error tracking services here
      // Sentry.captureException(error, { extra: errorInfo });
    }

    // You could also send error reports to your backend
    this.reportErrorToBackend(error, errorInfo);
  }

  reportErrorToBackend = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      const { getApiUrl } = await import('@/lib/utils/apiClient');
      await fetch(getApiUrl('api/error-report'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
          errorInfo: {
            componentStack: errorInfo.componentStack,
          },
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (reportError) {
      log.error('Failed to report error to backend:', reportError);
    }
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleGoBack = () => {
    window.history.back();
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            {/* Error Icon */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Application Error
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                We&apos;re sorry, but something went wrong with the application.
              </p>
            </div>

            {/* Error Details Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    What happened?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    The application encountered an unexpected error. This could be due to a temporary issue or a bug in the system.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    What can you do?
                  </h3>
                  <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Try refreshing the page</li>
                    <li>• Go back to the previous page</li>
                    <li>• Return to the home page</li>
                    <li>• Contact support if the problem persists</li>
                  </ul>
                </div>

                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Technical Details (Development)
                    </summary>
                    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-48">
                      <div className="mb-2">
                        <strong>Error:</strong> {this.state.error.message}
                      </div>
                      {this.state.error.stack && (
                        <div>
                          <strong>Stack:</strong>
                          <pre className="whitespace-pre-wrap mt-1">{this.state.error.stack}</pre>
                        </div>
                      )}
                      {this.state.errorInfo && (
                        <div className="mt-2">
                          <strong>Component Stack:</strong>
                          <pre className="whitespace-pre-wrap mt-1">{this.state.errorInfo.componentStack}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={this.handleRefresh}
                className="w-full"
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Refresh Page
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={this.handleGoBack}
                  variant="outline"
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  Go Back
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  icon={<Home className="w-4 h-4" />}
                >
                  Go Home
                </Button>
              </div>
            </div>

            {/* Support Contact */}
            <div className="mt-8 text-center">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Need Help?
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  If this error persists, please contact our support team.
                </p>
                <a
                  href="mailto:support@cubstechnical.com"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  support@cubstechnical.com
                </a>
              </div>
            </div>

            {/* Error ID for Support */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Error ID: {this.state.error?.message?.substring(0, 8) || 'UNKNOWN'}-{Date.now().toString(36)}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;

