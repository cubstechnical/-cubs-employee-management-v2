'use client';

import { useState, useEffect } from 'react';
import { log } from '@/lib/utils/productionLogger';
import { MobileDiagnosticsService } from '@/lib/services/mobileDiagnostics';

interface DebugInfo {
  timestamp: string;
  userAgent: string;
  platform: string;
  isCapacitor: boolean;
  isNative: boolean;
  screenSize: { width: number; height: number };
  localStorage: boolean;
  sessionStorage: boolean;
  cookies: boolean;
  networkOnline: boolean;
  capacitorReady: boolean;
  appInitialized: boolean;
  mobileAppReady: boolean;
  errors: string[];
  warnings: string[];
}

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [diagnosticResults, setDiagnosticResults] = useState<any[]>([]);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);

  useEffect(() => {
    const collectDebugInfo = () => {
      try {
        const info: DebugInfo = {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          isCapacitor: !!(window as any).Capacitor,
          isNative: !!(window as any).Capacitor?.isNative,
          screenSize: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          localStorage: false,
          sessionStorage: false,
          cookies: false,
          networkOnline: navigator.onLine,
          capacitorReady: false,
          appInitialized: false,
          mobileAppReady: false,
          errors: [],
          warnings: []
        };

        // Test storage capabilities
        try {
          localStorage.setItem('debug-test', 'test');
          localStorage.removeItem('debug-test');
          info.localStorage = true;
        } catch (e) {
          info.errors.push(`localStorage failed: ${e}`);
        }

        try {
          sessionStorage.setItem('debug-test', 'test');
          sessionStorage.removeItem('debug-test');
          info.sessionStorage = true;
        } catch (e) {
          info.errors.push(`sessionStorage failed: ${e}`);
        }

        try {
          document.cookie = 'debug-test=value';
          info.cookies = document.cookie.includes('debug-test=value');
          document.cookie = 'debug-test=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        } catch (e) {
          info.errors.push(`cookies failed: ${e}`);
        }

        // Check for ready events
        info.capacitorReady = !!(window as any).__capacitorReady;
        info.appInitialized = !!(window as any).__appInitialized;
        info.mobileAppReady = !!(window as any).__mobileAppReady;

        setDebugInfo(info);
        log.info('Debug info collected:', info);
      } catch (error) {
        log.error('Error collecting debug info:', error);
        setErrors(prev => [...prev, `Debug collection failed: ${error}`]);
      }
    };

    collectDebugInfo();

    // Set up event listeners to track ready states
    const handleCapacitorReady = () => {
      (window as any).__capacitorReady = true;
      setDebugInfo(prev => prev ? { ...prev, capacitorReady: true } : null);
      log.info('capacitor-ready event received');
    };

    const handleAppInitialized = () => {
      (window as any).__appInitialized = true;
      setDebugInfo(prev => prev ? { ...prev, appInitialized: true } : null);
      log.info('app-initialized event received');
    };

    const handleMobileAppReady = () => {
      (window as any).__mobileAppReady = true;
      setDebugInfo(prev => prev ? { ...prev, mobileAppReady: true } : null);
      log.info('mobile-app-ready event received');
    };

    window.addEventListener('capacitor-ready', handleCapacitorReady);
    window.addEventListener('app-initialized', handleAppInitialized);
    window.addEventListener('mobile-app-ready', handleMobileAppReady);

    return () => {
      window.removeEventListener('capacitor-ready', handleCapacitorReady);
      window.removeEventListener('app-initialized', handleAppInitialized);
      window.removeEventListener('mobile-app-ready', handleMobileAppReady);
    };
  }, []);

  const triggerTestEvents = () => {
    log.info('Manually triggering test events...');

    // Dispatch test events
    window.dispatchEvent(new CustomEvent('capacitor-ready'));
    window.dispatchEvent(new CustomEvent('app-initialized'));
    window.dispatchEvent(new CustomEvent('mobile-app-ready'));

    // Force refresh debug info
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const clearStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      log.info('Storage cleared');
    } catch (error) {
      log.error('Error clearing storage:', error);
    }
  };

  const runComprehensiveDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const results = await MobileDiagnosticsService.runAllDiagnostics();
      setDiagnosticResults(results);
      MobileDiagnosticsService.logResults();
    } catch (error) {
      log.error('Error running diagnostics:', error);
      setErrors(prev => [...prev, `Diagnostics failed: ${error}`]);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            🔍 Mobile App Debug Dashboard
          </h1>

          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                📊 Current Status
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Platform:</span>
                  <div className="text-blue-600 dark:text-blue-400">
                    {debugInfo?.platform || 'Unknown'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Capacitor:</span>
                  <div className={`font-bold ${debugInfo?.isCapacitor ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo?.isCapacitor ? '✅ Yes' : '❌ No'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Native:</span>
                  <div className={`font-bold ${debugInfo?.isNative ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo?.isNative ? '✅ Yes' : '❌ No'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Network:</span>
                  <div className={`font-bold ${debugInfo?.networkOnline ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo?.networkOnline ? '✅ Online' : '❌ Offline'}
                  </div>
                </div>
              </div>
            </div>

            {/* Storage Status */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                💾 Storage Status
              </h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">localStorage:</span>
                  <div className={`font-bold ${debugInfo?.localStorage ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo?.localStorage ? '✅ Working' : '❌ Failed'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">sessionStorage:</span>
                  <div className={`font-bold ${debugInfo?.sessionStorage ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo?.sessionStorage ? '✅ Working' : '❌ Failed'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Cookies:</span>
                  <div className={`font-bold ${debugInfo?.cookies ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo?.cookies ? '✅ Working' : '❌ Failed'}
                  </div>
                </div>
              </div>
            </div>

            {/* Event Status */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                🎯 Event Status
              </h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">capacitor-ready:</span>
                  <div className={`font-bold ${debugInfo?.capacitorReady ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo?.capacitorReady ? '✅ Received' : '❌ Not Received'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">app-initialized:</span>
                  <div className={`font-bold ${debugInfo?.appInitialized ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo?.appInitialized ? '✅ Received' : '❌ Not Received'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">mobile-app-ready:</span>
                  <div className={`font-bold ${debugInfo?.mobileAppReady ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo?.mobileAppReady ? '✅ Received' : '❌ Not Received'}
                  </div>
                </div>
              </div>
            </div>

            {/* Screen Info */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                📱 Screen Information
              </h2>
              <div className="text-sm">
                <div><strong>Size:</strong> {debugInfo?.screenSize.width} x {debugInfo?.screenSize.height}</div>
                <div><strong>User Agent:</strong> {debugInfo?.userAgent}</div>
              </div>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                  ❌ Errors
                </h2>
                <div className="text-sm text-red-700 dark:text-red-300">
                  {errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                🔧 Debug Actions
              </h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={runComprehensiveDiagnostics}
                  disabled={isRunningDiagnostics}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {isRunningDiagnostics ? '🔍 Running...' : '🔍 Run Full Diagnostics'}
                </button>
                <button
                  onClick={triggerTestEvents}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  🚀 Trigger Test Events
                </button>
                <button
                  onClick={clearStorage}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  🗑️ Clear Storage
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  🔄 Reload Page
                </button>
              </div>
            </div>

            {/* Comprehensive Diagnostics Results */}
            {diagnosticResults.length > 0 && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-4">
                  📊 Comprehensive Diagnostics Results
                </h2>
                <div className="space-y-2">
                  {diagnosticResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">
                          {result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'}
                        </span>
                        <span className="font-medium">{result.test}</span>
                      </div>
                      <span className={`font-medium ${
                        result.status === 'pass' ? 'text-green-600' :
                        result.status === 'fail' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {result.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-indigo-600 dark:text-indigo-400">
                    View Detailed Results
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto">
                    {JSON.stringify(diagnosticResults, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            {/* Technical Details */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                🔍 Technical Details
              </h2>
              <details className="text-sm">
                <summary className="cursor-pointer text-blue-600 dark:text-blue-400">
                  Click to expand debug information
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
