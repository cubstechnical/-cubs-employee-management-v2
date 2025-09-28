'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/SimpleAuthContext';
import { AuthService } from '@/lib/services/auth';
import { isCapacitorApp } from '@/utils/mobileDetection';
import { log } from '@/lib/utils/productionLogger';

// Check if Capacitor Browser plugin is available
const hasBrowserPlugin = () => {
  return typeof window !== 'undefined' &&
         window.Capacitor &&
         (window.Capacitor as any).Browser;
};

interface AuthDebugInfo {
  isMobile: boolean;
  userEmail: string | null;
  userId: string | null;
  userRole: string | null;
  isLoading: boolean;
  sessionExists: boolean;
  storedSession: string | null;
  lastLogin: string | null;
  sessionPersisted: string | null;
}

export default function MobileAuthDebug() {
  const { user, isLoading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo>({
    isMobile: false,
    userEmail: null,
    userId: null,
    userRole: null,
    isLoading: true,
    sessionExists: false,
    storedSession: null,
    lastLogin: null,
    sessionPersisted: null
  });

  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const updateDebugInfo = async () => {
      const isMobile = isCapacitorApp();
      const storedSession = typeof window !== 'undefined' ? localStorage.getItem('cubs-auth-token') : null;
      const lastLogin = typeof window !== 'undefined' ? localStorage.getItem('cubs_last_login') : null;
      const sessionPersisted = typeof window !== 'undefined' ? localStorage.getItem('cubs_session_persisted') : null;

      let sessionExists = false;
      try {
        const { session } = await AuthService.getSession();
        sessionExists = !!session;
      } catch (error) {
        log.warn('Debug: Failed to check session:', error);
      }

      setDebugInfo({
        isMobile,
        userEmail: user?.email || null,
        userId: user?.id || null,
        userRole: user?.role || null,
        isLoading,
        sessionExists,
        storedSession,
        lastLogin,
        sessionPersisted
      });

      // Log debug info
      log.info('MobileAuthDebug: Authentication status', {
        isMobile,
        hasUser: !!user,
        isLoading,
        sessionExists,
        hasStoredSession: !!storedSession,
        lastLogin,
        sessionPersisted
      });
    };

    updateDebugInfo();

    // Update debug info every 5 seconds
    const interval = setInterval(updateDebugInfo, 5000);
    return () => clearInterval(interval);
  }, [user, isLoading]);

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-2 rounded text-sm z-50"
        style={{ zIndex: 9999 }}
      >
        🔍 Debug Auth
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ zIndex: 9999 }}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">🔍 Authentication Debug</h3>
          <button
            onClick={() => setShowDebug(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Environment:</span>
            <span className={debugInfo.isMobile ? 'text-red-500' : 'text-green-500'}>
              {debugInfo.isMobile ? '📱 Mobile' : '🖥️ Web'}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Loading:</span>
            <span className={debugInfo.isLoading ? 'text-yellow-500' : 'text-green-500'}>
              {debugInfo.isLoading ? '⏳ Loading...' : '✅ Ready'}
            </span>
          </div>

          <div className="flex justify-between">
            <span>User:</span>
            <span className={debugInfo.userEmail ? 'text-green-500' : 'text-red-500'}>
              {debugInfo.userEmail || '❌ No User'}
            </span>
          </div>

          <div className="flex justify-between">
            <span>User ID:</span>
            <span className="text-xs break-all">
              {debugInfo.userId || '❌ None'}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Role:</span>
            <span>{debugInfo.userRole || '❌ None'}</span>
          </div>

          <div className="flex justify-between">
            <span>Session:</span>
            <span className={debugInfo.sessionExists ? 'text-green-500' : 'text-red-500'}>
              {debugInfo.sessionExists ? '✅ Active' : '❌ No Session'}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Stored Session:</span>
            <span className={debugInfo.storedSession ? 'text-green-500' : 'text-red-500'}>
              {debugInfo.storedSession ? '✅ Stored' : '❌ No Data'}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Session Persisted:</span>
            <span className={debugInfo.sessionPersisted ? 'text-green-500' : 'text-red-500'}>
              {debugInfo.sessionPersisted || '❌ No'}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Last Login:</span>
            <span className="text-xs">
              {debugInfo.lastLogin ? new Date(debugInfo.lastLogin).toLocaleString() : '❌ Never'}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <button
            onClick={async () => {
              log.info('Debug: Manually checking session...');
              const { session } = await AuthService.getSession();
              log.info('Debug: Manual session check result', { hasSession: !!session });
              alert(`Session exists: ${!!session}`);
            }}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded text-sm"
          >
            🔍 Check Session
          </button>

          <button
            onClick={async () => {
              log.info('Debug: Manually restoring mobile session...');
              const { session } = await AuthService.restoreMobileSession();
              log.info('Debug: Manual mobile session restore result', { hasSession: !!session });
              alert(`Mobile session restored: ${!!session}`);
            }}
            className="w-full bg-green-500 text-white py-2 px-4 rounded text-sm"
          >
            🔄 Restore Session
          </button>

          <button
            onClick={() => {
              localStorage.clear();
              alert('localStorage cleared - please refresh the page');
            }}
            className="w-full bg-red-500 text-white py-2 px-4 rounded text-sm"
          >
            🗑️ Clear Storage
          </button>

          <button
            onClick={async () => {
              if (hasBrowserPlugin()) {
                try {
                  await (window.Capacitor as any).Browser.open({
                    url: `${window.location.origin}/mobile-debug.html`,
                    windowName: '_blank',
                    toolbarColor: '#d3194f'
                  });
                  log.info('Debug: Opened mobile debug page in browser');
                } catch (error) {
                  log.error('Debug: Failed to open mobile debug page:', error);
                  alert('Failed to open debug page. Error: ' + error);
                }
              } else {
                // Fallback: try to navigate programmatically
                try {
                  window.open('/mobile-debug.html', '_blank');
                } catch (error) {
                  log.error('Debug: Failed to open debug page:', error);
                  alert('Debug page not available. Error: ' + error);
                }
              }
            }}
            className="w-full bg-purple-500 text-white py-2 px-4 rounded text-sm"
          >
            🔧 Open Debug Tools
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>💡 If you see login loops, check:</p>
          <ul className="mt-1 space-y-1">
            <li>• Session exists but no user data</li>
            <li>• Stored session is corrupted</li>
            <li>• Session expired and refresh failed</li>
            <li>• Mobile environment not detected properly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
