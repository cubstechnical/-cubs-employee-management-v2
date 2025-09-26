import { log } from '@/lib/utils/productionLogger';
// Enhanced error handling for production iOS app
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: Error[] = [];
  private maxQueueSize = 10;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Log error with context
  logError(error: Error, context: string = 'Unknown', severity: 'low' | 'medium' | 'high' = 'medium') {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      severity,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR'
    };

    // Add to queue
    this.errorQueue.push(error);
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift(); // Remove oldest error
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      log.group(`🚨 Error (${severity.toUpperCase()}): ${context}`);
      log.error(error);
      log.info('Error Info:', errorInfo);
      log.groupEnd();
    }

    // Send to monitoring service if available
    this.sendToMonitoring(errorInfo);
  }

  // Handle network errors specifically
  handleNetworkError(error: Error, context: string) {
    if (error.message.includes('fetch') || error.message.includes('network')) {
      this.logError(error, `Network Error: ${context}`, 'high');

      // Show user-friendly message
      if (typeof window !== 'undefined') {
        // Could dispatch to a toast notification system
        log.warn('Network error occurred, showing offline indicator');
      }
    } else {
      this.logError(error, context);
    }
  }

  // Handle authentication errors
  handleAuthError(error: Error, context: string) {
    if (error.message.includes('auth') || error.message.includes('token') || error.message.includes('session')) {
      this.logError(error, `Authentication Error: ${context}`, 'high');

      // Clear invalid session data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cubs_session_persisted');
        localStorage.removeItem('cubs_last_login');
      }
    } else {
      this.logError(error, context);
    }
  }

  // Get recent errors for debugging
  getRecentErrors(): Error[] {
    return [...this.errorQueue];
  }

  // Clear error queue
  clearErrors() {
    this.errorQueue = [];
  }

  // Send error to monitoring service
  private sendToMonitoring(errorInfo: any) {
    // In a real app, you would send this to Sentry, LogRocket, etc.
    // For now, we'll just store in localStorage for debugging
    if (typeof window !== 'undefined') {
      try {
        const existingLogs = JSON.parse(localStorage.getItem('cubs_error_logs') || '[]');
        existingLogs.push(errorInfo);

        // Keep only last 50 errors
        if (existingLogs.length > 50) {
          existingLogs.splice(0, existingLogs.length - 50);
        }

        localStorage.setItem('cubs_error_logs', JSON.stringify(existingLogs));
      } catch (storageError) {
        log.warn('Failed to store error logs:', storageError);
      }
    }
  }

  // Get error logs from storage
  static getStoredErrorLogs(): any[] {
    if (typeof window === 'undefined') return [];

    try {
      return JSON.parse(localStorage.getItem('cubs_error_logs') || '[]');
    } catch {
      return [];
    }
  }
}

// Global error boundary hook
export function useErrorHandler() {
  const errorHandler = ErrorHandler.getInstance();

  const handleError = (error: Error, context: string = 'Unknown') => {
    errorHandler.logError(error, context);

    // Re-throw for React error boundary
    throw error;
  };

  const handleNetworkError = (error: Error, context: string) => {
    errorHandler.handleNetworkError(error, context);
  };

  const handleAuthError = (error: Error, context: string) => {
    errorHandler.handleAuthError(error, context);
  };

  return {
    handleError,
    handleNetworkError,
    handleAuthError,
    getRecentErrors: () => errorHandler.getRecentErrors(),
    clearErrors: () => errorHandler.clearErrors(),
    getStoredLogs: ErrorHandler.getStoredErrorLogs
  };
}

// React hook for error handling in components
export function useComponentErrorHandler(componentName: string) {
  const { handleError, handleNetworkError, handleAuthError } = useErrorHandler();

  const handleComponentError = (error: Error, context?: string) => {
    handleError(error, `${componentName}: ${context || 'Component Error'}`);
  };

  const handleComponentNetworkError = (error: Error, context?: string) => {
    handleNetworkError(error, `${componentName}: ${context || 'Network Error'}`);
  };

  const handleComponentAuthError = (error: Error, context?: string) => {
    handleAuthError(error, `${componentName}: ${context || 'Auth Error'}`);
  };

  return {
    handleComponentError,
    handleComponentNetworkError,
    handleComponentAuthError
  };
}
