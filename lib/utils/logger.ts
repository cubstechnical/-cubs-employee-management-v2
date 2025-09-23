/**
 * Production-ready logging utility
 * Replaces console.log statements with proper logging levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    // Set log level based on environment
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level}: ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('DEBUG', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message), ...args);
    }
  }

  // Production-safe logging for errors that should always be logged
  logError(error: Error, context?: string): void {
    const errorMessage = context ? `${context}: ${error.message}` : error.message;
    console.error(this.formatMessage('ERROR', errorMessage), {
      stack: error.stack,
      name: error.name,
    });
  }

  // Performance logging
  logPerformance(operation: string, duration: number, metadata?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('PERF', `${operation} took ${duration}ms`), metadata);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience functions for common use cases
export const log = {
  debug: (message: string, ...args: any[]) => logger.debug(message, ...args),
  info: (message: string, ...args: any[]) => logger.info(message, ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, ...args),
  error: (message: string, ...args: any[]) => logger.error(message, ...args),
  performance: (operation: string, duration: number, metadata?: any) => 
    logger.logPerformance(operation, duration, metadata),
  errorWithContext: (error: Error, context?: string) => logger.logError(error, context),
};
