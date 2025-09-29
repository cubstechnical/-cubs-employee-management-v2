'use client';

import { useState, useEffect } from 'react';
import { isCapacitorApp } from '@/utils/mobileDetection';
import { log } from '@/lib/utils/productionLogger';
import { MobileDiagnosticsService } from '@/lib/services/mobileDiagnostics';
import { AlertTriangle, Download, RefreshCw } from 'lucide-react';

interface MobileStatusProps {
  className?: string;
}

export default function MobileStatusIndicator({ className = '' }: MobileStatusProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Auto-run diagnostics on mobile apps after 2 seconds
    if (isCapacitorApp()) {
      const timer = setTimeout(async () => {
        try {
          const results = await MobileDiagnosticsService.runAllDiagnostics();
          setDiagnosticResults(results);

          // Check if there are any failures
          const hasFailures = results.some(r => r.status === 'fail');
          if (hasFailures) {
            log.warn('Mobile diagnostics detected failures');
          }
        } catch (error) {
          log.error('Failed to run mobile diagnostics:', error);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  // Show indicator if on mobile and diagnostics are available
  useEffect(() => {
    if (isCapacitorApp() && diagnosticResults.length > 0) {
      setIsVisible(true);
    }
  }, [diagnosticResults]);

  const showDiagnostics = () => {
    MobileDiagnosticsService.showDiagnosticsAlert();
  };

  const exportDiagnostics = () => {
    MobileDiagnosticsService.exportDiagnostics();
  };

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

  if (!isCapacitorApp() || !isVisible) {
    return null;
  }

  const failedTests = diagnosticResults.filter(r => r.status === 'fail');
  const warningTests = diagnosticResults.filter(r => r.status === 'warning');

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 max-w-sm">
        {/* Status Indicator */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              failedTests.length > 0 ? 'bg-red-500' :
              warningTests.length > 0 ? 'bg-yellow-500' : 'bg-green-500'
            }`} />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Mobile App Status
            </span>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
        </div>

        {/* Summary */}
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          <div>✅ {diagnosticResults.filter(r => r.status === 'pass').length} Passed</div>
          <div>⚠️ {warningTests.length} Warnings</div>
          <div>❌ {failedTests.length} Failed</div>
        </div>

        {/* Detailed Results */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {diagnosticResults.map((result, index) => (
                <div key={index} className="flex items-start space-x-2 text-xs">
                  <span className="mt-0.5">
                    {result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">{result.test}</div>
                    <div className={`${
                      result.status === 'pass' ? 'text-green-600' :
                      result.status === 'fail' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {result.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
              {/* Primary Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={async () => {
                    const results = await MobileDiagnosticsService.runAllDiagnostics();
                    setDiagnosticResults(results);
                  }}
                  className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  🔍 Re-run Diagnostics
                </button>
                <button
                  onClick={showDiagnostics}
                  className="flex-1 px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  <AlertTriangle className="w-3 h-3 mr-1 inline" />
                  Show Alert
                </button>
              </div>

              {/* Secondary Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={exportDiagnostics}
                  className="flex-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  <Download className="w-3 h-3 mr-1 inline" />
                  Export JSON
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      const stored = MobileDiagnosticsService.getStoredResults();
                      if (stored) {
                        console.log('Stored diagnostics:', stored);
                        alert(`✅ Diagnostics data logged to console. Check DevTools.`);
                      } else {
                        alert('No stored diagnostics found');
                      }
                    }
                  }}
                  className="flex-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  📋 Console
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex space-x-1">
                <button
                  onClick={triggerTestEvents}
                  className="flex-1 px-1 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  🚀 Events
                </button>
                <button
                  onClick={clearStorage}
                  className="flex-1 px-1 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  🗑️ Storage
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-1 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  🔄 Reload
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
