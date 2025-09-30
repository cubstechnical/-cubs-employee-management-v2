'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/lib/contexts/SimpleAuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function DebugPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    // Gather all diagnostic information
    const gatherDiagnostics = async () => {
      const diag: any = {
          timestamp: new Date().toISOString(),
        environment: {
          isClient: typeof window !== 'undefined',
          isBrowser: typeof window !== 'undefined' && typeof document !== 'undefined',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
          windowSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A',
          devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 'N/A',
        },
        capacitor: {
          isNativePlatform: Capacitor.isNativePlatform(),
          platform: Capacitor.getPlatform(),
          isPluginAvailable: Capacitor.isPluginAvailable('SplashScreen'),
        },
        location: {
          href: typeof window !== 'undefined' ? window.location.href : 'N/A',
          protocol: typeof window !== 'undefined' ? window.location.protocol : 'N/A',
          hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
        },
        storage: {
          localStorageAvailable: false,
          sessionStorageAvailable: false,
          itemCount: 0,
        },
        auth: {
          isLoading,
          hasUser: !!user,
          userId: user?.id || 'N/A',
          userEmail: user?.email || 'N/A',
        },
        performance: {
          navigationStart: 'N/A',
          domReady: 'N/A',
          loadComplete: 'N/A',
        }
      };

      // Test localStorage
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('__test__', 'test');
          localStorage.removeItem('__test__');
          diag.storage.localStorageAvailable = true;
          diag.storage.itemCount = localStorage.length;
        }
        } catch (e) {
        diag.storage.localStorageError = String(e);
      }

      // Test sessionStorage
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('__test__', 'test');
          sessionStorage.removeItem('__test__');
          diag.storage.sessionStorageAvailable = true;
        }
        } catch (e) {
        diag.storage.sessionStorageError = String(e);
      }

      // Performance metrics
      if (typeof window !== 'undefined' && window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        diag.performance.navigationStart = timing.navigationStart;
        diag.performance.domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
        diag.performance.loadComplete = timing.loadEventEnd - timing.navigationStart;
      }

      setDiagnostics(diag);
    };

    gatherDiagnostics();
  }, [user, isLoading]);

  const runTest = async (testName: string, testFn: () => Promise<string>) => {
    try {
      const result = await testFn();
      const log = `✅ ${testName}: ${result}`;
      console.log(log);
      setTestResults(prev => [...prev, log]);
    } catch (error) {
      const log = `❌ ${testName}: ${error}`;
      console.error(log);
      setTestResults(prev => [...prev, log]);
    }
  };

  const tests = [
    {
      name: 'Capacitor Detection',
      fn: async () => {
        const isNative = Capacitor.isNativePlatform();
        const platform = Capacitor.getPlatform();
        return `Platform: ${platform}, Native: ${isNative}`;
      }
    },
    {
      name: 'localStorage Test',
      fn: async () => {
        const testKey = '__mobile_test__';
        const testValue = 'test_value_' + Date.now();
        localStorage.setItem(testKey, testValue);
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        if (retrieved === testValue) {
          return 'localStorage works correctly';
        } else {
          throw new Error('localStorage read/write failed');
        }
      }
    },
    {
      name: 'Network Test (Supabase)',
      fn: async () => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl) {
          throw new Error('NEXT_PUBLIC_SUPABASE_URL not configured');
        }
        
        try {
          const response = await fetch(supabaseUrl + '/rest/v1/', {
            method: 'GET',
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            }
          });
          return `Supabase reachable: ${response.ok} (${response.status})`;
        } catch (e) {
          throw new Error(`Network error: ${e}`);
        }
      }
    },
    {
      name: 'Auth Service Test',
      fn: async () => {
        if (user) {
          return `User authenticated: ${user.email}`;
        } else {
          return 'No user authenticated (expected on debug page)';
        }
      }
    },
    {
      name: 'DOM Rendering Test',
      fn: async () => {
        const testDiv = document.createElement('div');
        testDiv.id = '__test_render__';
        testDiv.style.display = 'none';
        document.body.appendChild(testDiv);
        const found = document.getElementById('__test_render__');
        if (found) {
          document.body.removeChild(testDiv);
          return 'DOM manipulation works';
        } else {
          throw new Error('DOM manipulation failed');
        }
      }
    },
    {
      name: 'CSS Test',
      fn: async () => {
        const computed = window.getComputedStyle(document.body);
        const bgColor = computed.backgroundColor;
        return `Body background: ${bgColor}`;
      }
    }
  ];

  const runAllTests = async () => {
    setTestResults([]);
    for (const test of tests) {
      await runTest(test.name, test.fn);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🔍 Mobile Debug Console
          </h1>
          <Button onClick={() => router.push('/login')} variant="outline">
            Back to Login
          </Button>
        </div>

        {/* Platform Information */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Platform Information
              </h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-600 dark:text-gray-400">Is Native:</div>
              <div className="text-gray-900 dark:text-white font-bold">
                {diagnostics.capacitor?.isNativePlatform ? '✅ YES' : '❌ NO'}
            </div>

              <div className="text-gray-600 dark:text-gray-400">Platform:</div>
              <div className="text-gray-900 dark:text-white">{diagnostics.capacitor?.platform}</div>
              
              <div className="text-gray-600 dark:text-gray-400">Protocol:</div>
              <div className="text-gray-900 dark:text-white">{diagnostics.location?.protocol}</div>
              
              <div className="text-gray-600 dark:text-gray-400">Window Size:</div>
              <div className="text-gray-900 dark:text-white">{diagnostics.environment?.windowSize}</div>
                  </div>
                </div>
        </Card>

        {/* Authentication Status */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Status
          </h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-600 dark:text-gray-400">Loading:</div>
              <div className="text-gray-900 dark:text-white">
                {isLoading ? '⏳ Loading...' : '✅ Ready'}
            </div>

              <div className="text-gray-600 dark:text-gray-400">User:</div>
              <div className="text-gray-900 dark:text-white">
                {user ? `✅ ${user.email}` : '❌ Not authenticated'}
                  </div>
                </div>
              </div>
        </Card>

        {/* Storage Information */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Storage Status
              </h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-600 dark:text-gray-400">localStorage:</div>
              <div className="text-gray-900 dark:text-white">
                {diagnostics.storage?.localStorageAvailable ? '✅ Available' : '❌ Not available'}
            </div>

              <div className="text-gray-600 dark:text-gray-400">Items in storage:</div>
              <div className="text-gray-900 dark:text-white">{diagnostics.storage?.itemCount || 0}</div>
                </div>
              </div>
        </Card>

        {/* Test Suite */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Test Suite
              </h2>
            <Button onClick={runAllTests} variant="primary">
              Run All Tests
            </Button>
            </div>

          {testResults.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              Click &quot;Run All Tests&quot; to verify mobile app functionality
            </p>
          ) : (
            <div className="space-y-2 font-mono text-sm max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    result.startsWith('✅')
                      ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
                      : 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100'
                  }`}
                >
                  {result}
                    </div>
                  ))}
                </div>
          )}
        </Card>

        {/* Full Diagnostics */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Full Diagnostics (JSON)
          </h2>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto text-xs">
            {JSON.stringify(diagnostics, null, 2)}
                  </pre>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Quick Actions
              </h2>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                localStorage.clear();
                alert('localStorage cleared!');
              }}
              variant="outline"
            >
              Clear localStorage
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Reload Page
            </Button>
            <Button
              onClick={() => {
                console.log('Test console.log');
                console.error('Test console.error');
                alert('Check console for test messages');
              }}
              variant="outline"
            >
              Test Console
            </Button>
            <Button
              onClick={() => {
                throw new Error('Test error thrown from debug page');
              }}
              variant="outline"
            >
              Throw Test Error
            </Button>
            </div>
        </Card>
      </div>
    </div>
  );
}
