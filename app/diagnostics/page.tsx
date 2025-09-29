'use client';

import { useEffect, useState, useCallback } from 'react';

interface DiagnosticResult {
  test: string;
  status: 'pending' | 'success' | 'error' | 'timeout';
  duration?: number;
  error?: string;
  details?: any;
}

export default function DiagnosticsPage() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = useCallback((result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  }, []);

  const runTest = useCallback(async (testName: string, testFn: () => Promise<any>, timeout = 5000): Promise<DiagnosticResult> => {
    const startTime = Date.now();
    addResult({ test: testName, status: 'pending' });

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), timeout)
      );
      
      const result = await Promise.race([testFn(), timeoutPromise]);
      const duration = Date.now() - startTime;
      
      return {
        test: testName,
        status: 'success',
        duration,
        details: result
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        test: testName,
        status: error instanceof Error && error.message === 'Test timeout' ? 'timeout' : 'error',
        duration,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }, [addResult]);

  const runAllDiagnostics = useCallback(async () => {
    setIsRunning(true);
    setResults([]);

    // Test 1: Basic React functionality
    await runTest('React State Management', async () => {
      return { message: 'React state working correctly' };
    });

    // Test 2: Supabase client import
    await runTest('Supabase Client Import', async () => {
      const { supabase, isSupabaseAvailable } = await import('@/lib/supabase/client');
      return { isSupabaseAvailable, hasSupabase: !!supabase };
    });

    // Test 3: Supabase connection
    await runTest('Supabase Connection', async () => {
      const { supabase, isSupabaseAvailable } = await import('@/lib/supabase/client');
      if (!isSupabaseAvailable) throw new Error('Supabase not available');
      
      const { data, error } = await supabase.auth.getSession();
      return { hasSession: !!data.session, hasError: !!error, errorMessage: error?.message };
    });

    // Test 4: Database profiles table access
    await runTest('Database Profiles Table', async () => {
      const { supabase, isSupabaseAvailable } = await import('@/lib/supabase/client');
      if (!isSupabaseAvailable) throw new Error('Supabase not available');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      return { hasData: !!data, hasError: !!error, errorMessage: error?.message };
    });

    // Test 5: Database employee_table access
    await runTest('Database Employee Table', async () => {
      const { supabase, isSupabaseAvailable } = await import('@/lib/supabase/client');
      if (!isSupabaseAvailable) throw new Error('Supabase not available');
      
      const { data, error } = await supabase
        .from('employee_table')
        .select('count')
        .limit(1);
      
      return { hasData: !!data, hasError: !!error, errorMessage: error?.message };
    });

    // Test 6: AuthService getCurrentUser
    await runTest('AuthService getCurrentUser', async () => {
      const { AuthService } = await import('@/lib/services/auth');
      const user = await AuthService.getCurrentUser();
      return { hasUser: !!user, userEmail: user?.email, userRole: user?.role };
    });

    // Test 7: AuthService isApproved
    await runTest('AuthService isApproved', async () => {
      const { AuthService } = await import('@/lib/services/auth');
      const approved = await AuthService.isApproved();
      return { isApproved: approved };
    });

    // Test 8: AuthContext initialization
    await runTest('AuthContext Initialization', async () => {
      // This is a complex test that simulates the AuthContext flow
      const { supabase, isSupabaseAvailable } = await import('@/lib/supabase/client');
      if (!isSupabaseAvailable) throw new Error('Supabase not available');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session) {
        const { AuthService } = await import('@/lib/services/auth');
        const [user, approved] = await Promise.allSettled([
          AuthService.getCurrentUser(),
          AuthService.isApproved()
        ]);
        
        return {
          hasSession: !!session,
          userStatus: user.status,
          approvedStatus: approved.status,
          hasUser: user.status === 'fulfilled' && !!user.value,
          isApproved: approved.status === 'fulfilled' && approved.value
        };
      }
      
      return { hasSession: false };
    });

    // Test 9: Component imports
    await runTest('Component Imports', async () => {
      const components = await Promise.allSettled([
        import('@/components/ui/AppLoadingScreen'),
        import('@/components/layout/OptimizedLayout'),
        import('@/components/dashboard/CUBSDashboardHeader')
      ]);
      
      return {
        appLoadingScreen: components[0].status,
        optimizedLayout: components[1].status,
        dashboardHeader: components[2].status
      };
    });

    // Test 10: Environment variables
    await runTest('Environment Variables', async () => {
      return {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        nodeEnv: process.env.NODE_ENV
      };
    });

    // Test 11: Mobile App Detection
    await runTest('Mobile App Detection', async () => {
      const { isCapacitorApp } = await import('@/utils/mobileDetection');
      const { CapacitorService } = await import('@/lib/capacitor');

      return {
        isCapacitorApp: isCapacitorApp(),
        isNativePlatform: typeof window !== 'undefined' && window.Capacitor?.isNative,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'N/A'
      };
    });

    // Test 12: Mobile Storage Capabilities
    await runTest('Mobile Storage Capabilities', async () => {
      const { detectStorageCapabilities } = await import('@/hooks/useMobileCrashDetection');

      if (typeof window === 'undefined') {
        throw new Error('Not in browser environment');
      }

      return detectStorageCapabilities();
    });

    // Test 13: Capacitor Initialization
    await runTest('Capacitor Initialization', async () => {
      const { CapacitorService } = await import('@/lib/capacitor');

      if (typeof window === 'undefined') {
        throw new Error('Not in browser environment');
      }

      try {
        await CapacitorService.initialize();
        return { initialized: true, isNative: window.Capacitor?.isNative };
      } catch (error) {
        return { initialized: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    setIsRunning(false);
  }, [runTest]);

  useEffect(() => {
    runAllDiagnostics();
  }, [runAllDiagnostics]);

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'timeout': return 'text-yellow-600';
      case 'pending': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'timeout': return '⏰';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">CUBS System Diagnostics</h1>
          <button
            onClick={runAllDiagnostics}
            disabled={isRunning}
            className="px-4 py-2 bg-[#d3194f] text-white rounded-lg hover:bg-[#b0173a] disabled:opacity-50"
          >
            {isRunning ? 'Running...' : 'Run Diagnostics'}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Test Results</h2>
            
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getStatusIcon(result.status)}</span>
                    <span className="font-medium">{result.test}</span>
                    {result.duration && (
                      <span className="text-sm text-gray-500">
                        ({result.duration}ms)
                      </span>
                    )}
                  </div>
                  <span className={`font-medium ${getStatusColor(result.status)}`}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            {results.length > 0 && (
              <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium mb-2">Detailed Results:</h3>
                <pre className="text-sm overflow-auto max-h-96">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




