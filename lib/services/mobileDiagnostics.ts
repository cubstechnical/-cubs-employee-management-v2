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
  private static isRunning = false;

  /**
   * Run all diagnostic tests
   */
  static async runAllDiagnostics(): Promise<DiagnosticResult[]> {
    if (this.isRunning) {
      log.warn('Diagnostics already running, skipping duplicate call');
      return this.results;
    }

    this.isRunning = true;
    this.results = [];

    log.info('Starting comprehensive mobile app diagnostics...');

    try {
      // Basic environment checks
      await this.checkEnvironment();
      await this.checkCapacitor();
      await this.checkStorage();
      await this.checkNetwork();
      await this.checkEvents();
      await this.checkTiming();

      log.info('Diagnostics completed:', this.results);

      // Store results in localStorage for later retrieval
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('mobile-diagnostics-results', JSON.stringify({
            timestamp: new Date().toISOString(),
            results: this.results,
            userAgent: navigator.userAgent,
            platform: navigator.platform
          }));
          log.info('Diagnostics results stored in localStorage');
        } catch (storageError) {
          log.warn('Failed to store diagnostics in localStorage:', storageError);
        }
      }
    } catch (error) {
      log.error('Diagnostics failed:', error);
      this.results.push({
        test: 'Diagnostics System',
        status: 'fail',
        message: `Diagnostics execution failed: ${error}`,
        details: { error }
      });
    } finally {
      this.isRunning = false;
    }

    return this.results;
  }

  /**
   * Get stored diagnostic results from localStorage
   */
  static getStoredResults(): any {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem('mobile-diagnostics-results');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      log.warn('Failed to retrieve stored diagnostics:', error);
      return null;
    }
  }

  /**
   * Export diagnostic data as downloadable JSON file
   */
  static exportDiagnostics(): void {
    if (typeof window === 'undefined') return;

    try {
      const storedResults = this.getStoredResults();
      const diagnosticData = {
        timestamp: new Date().toISOString(),
        currentResults: this.results,
        storedResults,
        environment: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          isCapacitor: !!(window as any).Capacitor,
          isNative: !!(window as any).Capacitor?.isNative,
          screenSize: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      };

      const dataStr = JSON.stringify(diagnosticData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mobile-app-diagnostics-${new Date().toISOString().slice(0, 19)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      log.info('Diagnostics exported successfully');
    } catch (error) {
      log.error('Failed to export diagnostics:', error);
    }
  }

  /**
   * Display diagnostics in alert (for mobile debugging)
   */
  static showDiagnosticsAlert(): void {
    if (typeof window === 'undefined') return;

    try {
      const results = this.results;
      const summary = results.map(r =>
        `${r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⚠️'} ${r.test}: ${r.message}`
      ).join('\n');

      const storedResults = this.getStoredResults();
      const alertMessage = `
🔍 MOBILE APP DIAGNOSTICS

${summary}

📊 Summary:
✅ ${results.filter(r => r.status === 'pass').length} Passed
⚠️ ${results.filter(r => r.status === 'warning').length} Warnings
❌ ${results.filter(r => r.status === 'fail').length} Failed

📱 Environment:
- Platform: ${navigator.platform}
- Capacitor: ${!!(window as any).Capacitor ? 'Yes' : 'No'}
- Native: ${!!(window as any).Capacitor?.isNative ? 'Yes' : 'No'}

💾 Storage Test: ${this.testStorage() ? '✅ Working' : '❌ Failed'}

🔗 To share this data:
1. Take screenshot of this alert
2. Or use browser DevTools > Console > Copy diagnostic data

⚠️ If you see failures, the mobile app may have issues.
`;

      alert(alertMessage);

      // Also log to console for copying
      console.log('=== MOBILE APP DIAGNOSTICS ===');
      console.log('Summary:', summary);
      console.log('Full Results:', results);
      console.log('Stored Results:', storedResults);
      console.log('=== END DIAGNOSTICS ===');

    } catch (error) {
      log.error('Failed to show diagnostics alert:', error);
      alert(`Error showing diagnostics: ${error}`);
    }
  }

  /**
   * Quick storage test
   */
  private static testStorage(): boolean {
    try {
      localStorage.setItem('test', 'test');
      const result = localStorage.getItem('test') === 'test';
      localStorage.removeItem('test');
      return result;
    } catch {
      return false;
    }
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
