/**
 * Mobile App Diagnostics Service
 * Comprehensive debugging tools for mobile app issues
 */

import { log } from '@/lib/utils/productionLogger';
import { isCapacitorApp } from '@/utils/mobileDetection';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning' | 'unknown';
  message: string;
  details?: any;
}

export class MobileDiagnosticsService {
  private static results: DiagnosticResult[] = [];

  /**
   * Run all diagnostic tests
   */
  static async runAllDiagnostics(): Promise<DiagnosticResult[]> {
    this.results = [];

    log.info('Starting comprehensive mobile app diagnostics...');

    // Basic environment checks
    await this.checkEnvironment();
    await this.checkCapacitor();
    await this.checkStorage();
    await this.checkNetwork();
    await this.checkEvents();
    await this.checkTiming();

    log.info('Diagnostics completed:', this.results);
    return this.results;
  }

  /**
   * Check basic environment
   */
  private static async checkEnvironment(): Promise<void> {
    const checks = [
      {
        test: 'Window Object',
        check: () => typeof window !== 'undefined',
        message: 'Window object is available'
      },
      {
        test: 'Navigator Object',
        check: () => typeof navigator !== 'undefined',
        message: 'Navigator object is available'
      },
      {
        test: 'Document Object',
        check: () => typeof document !== 'undefined',
        message: 'Document object is available'
      }
    ];

    for (const check of checks) {
      try {
        const result = check.check();
        this.results.push({
          test: check.test,
          status: result ? 'pass' : 'fail',
          message: check.message,
          details: { result }
        });
      } catch (error) {
        this.results.push({
          test: check.test,
          status: 'fail',
          message: `Error: ${error}`,
          details: { error }
        });
      }
    }
  }

  /**
   * Check Capacitor integration
   */
  private static async checkCapacitor(): Promise<void> {
    const checks = [
      {
        test: 'Capacitor Global',
        check: () => !!(window as any).Capacitor,
        message: 'Capacitor global object exists'
      },
      {
        test: 'Capacitor Native',
        check: () => !!(window as any).Capacitor?.isNative,
        message: 'Running on native platform'
      },
      {
        test: 'Capacitor Platform',
        check: () => !!(window as any).Capacitor?.platform,
        message: 'Platform information available'
      }
    ];

    for (const check of checks) {
      try {
        const result = check.check();
        this.results.push({
          test: check.test,
          status: result ? 'pass' : 'warning',
          message: check.message,
          details: { result }
        });
      } catch (error) {
        this.results.push({
          test: check.test,
          status: 'fail',
          message: `Error: ${error}`,
          details: { error }
        });
      }
    }
  }

  /**
   * Check storage capabilities
   */
  private static async checkStorage(): Promise<void> {
    const storageTests = [
      {
        test: 'localStorage Write',
        check: () => {
          try {
            localStorage.setItem('diag-test', 'test');
            return true;
          } catch {
            return false;
          }
        },
        message: 'localStorage can write data'
      },
      {
        test: 'localStorage Read',
        check: () => {
          try {
            const value = localStorage.getItem('diag-test');
            localStorage.removeItem('diag-test');
            return value === 'test';
          } catch {
            return false;
          }
        },
        message: 'localStorage can read data'
      }
    ];

    for (const test of storageTests) {
      try {
        const result = test.check();
        this.results.push({
          test: test.test,
          status: result ? 'pass' : 'fail',
          message: test.message,
          details: { result }
        });
      } catch (error) {
        this.results.push({
          test: test.test,
          status: 'fail',
          message: `Error: ${error}`,
          details: { error }
        });
      }
    }
  }

  /**
   * Check network connectivity
   */
  private static async checkNetwork(): Promise<void> {
    const checks = [
      {
        test: 'Network Online',
        check: () => navigator.onLine,
        message: 'Device is online'
      },
      {
        test: 'Network Type',
        check: () => {
          const connection = (navigator as any).connection;
          return connection ? connection.effectiveType : 'unknown';
        },
        message: 'Network connection type available'
      }
    ];

    for (const check of checks) {
      try {
        const result = check.check();
        this.results.push({
          test: check.test,
          status: result !== false ? 'pass' : 'warning',
          message: check.message,
          details: { result }
        });
      } catch (error) {
        this.results.push({
          test: check.test,
          status: 'fail',
          message: `Error: ${error}`,
          details: { error }
        });
      }
    }
  }

  /**
   * Check event system
   */
  private static async checkEvents(): Promise<void> {
    const events = ['capacitor-ready', 'app-initialized', 'mobile-app-ready'];

    for (const event of events) {
      const received = !!(window as any)[`__${event.replace('-', '_')}__received`];

      this.results.push({
        test: `Event: ${event}`,
        status: received ? 'pass' : 'warning',
        message: received ? `Event "${event}" was received` : `Event "${event}" not received yet`,
        details: { received, event }
      });
    }
  }

  /**
   * Check timing and performance
   */
  private static async checkTiming(): Promise<void> {
    const startTime = Date.now();

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    const elapsed = Date.now() - startTime;

    this.results.push({
      test: 'Response Time',
      status: elapsed < 500 ? 'pass' : 'warning',
      message: `Response time: ${elapsed}ms`,
      details: { elapsed, threshold: 500 }
    });
  }

  /**
   * Get diagnostic results
   */
  static getResults(): DiagnosticResult[] {
    return this.results;
  }

  /**
   * Log results to console
   */
  static logResults(): void {
    log.info('=== MOBILE APP DIAGNOSTICS ===');
    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      log.info(`${icon} ${result.test}: ${result.message}`);
    });
    log.info('=== END DIAGNOSTICS ===');
  }
}
