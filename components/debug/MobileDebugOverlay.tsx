'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface ErrorLog {
  timestamp: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
}

export default function MobileDebugOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [initSteps, setInitSteps] = useState<string[]>([]);
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState('unknown');

  useEffect(() => {
    // Only show on native mobile apps
    if (typeof window === 'undefined') return;
    
    const native = Capacitor.isNativePlatform();
    setIsNative(native);
    setPlatform(Capacitor.getPlatform());

    // Add initialization step logging
    const logInitStep = (step: string) => {
      console.log(`[Mobile Init] ${step}`);
      setInitSteps(prev => [...prev, `${new Date().toLocaleTimeString()}: ${step}`]);
    };

    logInitStep('Mobile app detected');
    logInitStep(`Platform: ${Capacitor.getPlatform()}`);
    logInitStep('Debug overlay initialized');

    // Capture global errors
    const errorHandler = (event: ErrorEvent) => {
      const error: ErrorLog = {
        timestamp: new Date().toISOString(),
        type: 'error',
        message: event.message,
        stack: event.error?.stack
      };
      console.error('❌ Mobile Error Captured:', error);
      setErrors(prev => [...prev, error]);
      setIsVisible(true); // Auto-show on error
    };

    // Capture unhandled promise rejections
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const error: ErrorLog = {
        timestamp: new Date().toISOString(),
        type: 'error',
        message: `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`,
        stack: event.reason?.stack
      };
      console.error('❌ Mobile Promise Rejection Captured:', error);
      setErrors(prev => [...prev, error]);
      setIsVisible(true); // Auto-show on error
    };

    // Listen for custom initialization events
    const capacitorReadyHandler = () => {
      logInitStep('✅ Capacitor ready event received');
    };

    const appInitializedHandler = () => {
      logInitStep('✅ App initialized event received');
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);
    window.addEventListener('capacitor-ready', capacitorReadyHandler);
    window.addEventListener('app-initialized', appInitializedHandler);

    // Log initial state
    logInitStep(`Window loaded: ${document.readyState}`);
    logInitStep(`User agent: ${navigator.userAgent.substring(0, 50)}...`);

    // Auto-hide debug after 10 seconds if no errors
    const autoHideTimer = setTimeout(() => {
      if (errors.length === 0) {
        setIsVisible(false);
      }
    }, 10000);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
      window.removeEventListener('capacitor-ready', capacitorReadyHandler);
      window.removeEventListener('app-initialized', appInitializedHandler);
      clearTimeout(autoHideTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle visibility with triple-tap on screen corner
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let tapCount = 0;
    let tapTimer: NodeJS.Timeout;

    const handleTap = (e: TouchEvent) => {
      // Check if tap is in top-left corner (100x100px area)
      const touch = e.touches[0];
      if (touch.clientX < 100 && touch.clientY < 100) {
        tapCount++;
        
        clearTimeout(tapTimer);
        tapTimer = setTimeout(() => {
          tapCount = 0;
        }, 1000);

        if (tapCount === 3) {
          setIsVisible(prev => !prev);
          tapCount = 0;
        }
      }
    };

    window.addEventListener('touchstart', handleTap);
    return () => {
      window.removeEventListener('touchstart', handleTap);
      clearTimeout(tapTimer);
    };
  }, []);

  if (!isNative) return null; // Only show on native mobile

  if (!isVisible) {
    // Show minimal indicator
    return (
      <div 
        style={{
          position: 'fixed',
          top: 10,
          left: 10,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: errors.length > 0 ? '#ef4444' : '#10b981',
          zIndex: 9999,
          opacity: 0.3,
          pointerEvents: 'none'
        }}
        title="Triple-tap to open mobile debug"
      />
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      color: '#fff',
      zIndex: 9999,
      overflowY: 'auto',
      padding: '20px',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#d3194f' }}>📱 Mobile Debug Console</h2>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: '#d3194f',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>

      {/* Platform Info */}
      <div style={{ marginBottom: '20px', padding: '10px', background: '#1e293b', borderRadius: '4px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#60a5fa' }}>Platform Info</h3>
        <div><strong>Platform:</strong> {platform}</div>
        <div><strong>Is Native:</strong> {isNative ? 'Yes' : 'No'}</div>
        <div><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}</div>
        <div><strong>Location:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
      </div>

      {/* Initialization Steps */}
      <div style={{ marginBottom: '20px', padding: '10px', background: '#1e293b', borderRadius: '4px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#60a5fa' }}>Initialization Steps</h3>
        {initSteps.length === 0 ? (
          <div style={{ color: '#94a3b8' }}>No initialization steps logged</div>
        ) : (
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {initSteps.map((step, index) => (
              <div key={index} style={{ marginBottom: '4px', color: '#e2e8f0' }}>
                {step}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Errors */}
      <div style={{ padding: '10px', background: '#1e293b', borderRadius: '4px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#60a5fa' }}>
          Errors ({errors.length})
          {errors.length > 0 && (
            <button
              onClick={() => setErrors([])}
              style={{
                marginLeft: '10px',
                background: '#374151',
                color: '#fff',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              Clear
            </button>
          )}
        </h3>
        {errors.length === 0 ? (
          <div style={{ color: '#10b981' }}>✅ No errors detected</div>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {errors.map((error, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '10px',
                  padding: '10px',
                  background: error.type === 'error' ? '#7f1d1d' : '#854d0e',
                  borderRadius: '4px',
                  borderLeft: `4px solid ${error.type === 'error' ? '#ef4444' : '#f59e0b'}`
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {error.type === 'error' ? '❌' : '⚠️'} {error.timestamp}
                </div>
                <div style={{ marginBottom: '5px' }}>{error.message}</div>
                {error.stack && (
                  <details style={{ marginTop: '5px' }}>
                    <summary style={{ cursor: 'pointer', color: '#60a5fa' }}>Stack Trace</summary>
                    <pre style={{ 
                      marginTop: '5px', 
                      fontSize: '10px', 
                      whiteSpace: 'pre-wrap',
                      color: '#94a3b8'
                    }}>
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Actions */}
      <div style={{ marginTop: '20px', padding: '10px', background: '#1e293b', borderRadius: '4px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#60a5fa' }}>Manual Actions</h3>
        <button
          onClick={() => {
            console.log('🔄 Manual reload triggered');
            window.location.reload();
          }}
          style={{
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🔄 Reload App
        </button>
        <button
          onClick={() => {
            console.log('🧹 Clearing localStorage');
            localStorage.clear();
            alert('localStorage cleared. Reload to see changes.');
          }}
          style={{
            background: '#f59e0b',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🧹 Clear Storage
        </button>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', background: '#1e293b', borderRadius: '4px', fontSize: '10px', color: '#94a3b8' }}>
        <p style={{ margin: 0 }}>
          💡 Tip: Triple-tap the top-left corner of the screen to toggle this debug console
        </p>
      </div>
    </div>
  );
}
