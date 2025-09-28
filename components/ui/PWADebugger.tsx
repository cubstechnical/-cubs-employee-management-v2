'use client';

import { usePWA } from '@/hooks/usePWA';
import { useState, useEffect } from 'react';

export function PWADebugger() {
  const { isPWA, isStandalone } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Only show in development or when PWA is detected
    const shouldShow = process.env.NODE_ENV === 'development' || isPWA;
    setIsVisible(shouldShow);

    // Collect debug information
    setDebugInfo({
      isPWA,
      isStandalone,
      userAgent: navigator.userAgent,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      touchSupport: 'ontouchstart' in window,
      maxTouchPoints: navigator.maxTouchPoints,
      displayMode: window.matchMedia('(display-mode: standalone)').matches,
      isStandaloneNav: (window.navigator as any).standalone,
      referrer: document.referrer,
      location: window.location.href
    });
  }, [isPWA, isStandalone]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs max-w-xs">
      <div className="font-bold mb-2">PWA Debug Info</div>
      <div className="space-y-1">
        <div>PWA: {isPWA ? '✅' : '❌'}</div>
        <div>Standalone: {isStandalone ? '✅' : '❌'}</div>
        <div>Touch: {debugInfo.touchSupport ? '✅' : '❌'}</div>
        <div>Size: {debugInfo.windowWidth}x{debugInfo.windowHeight}</div>
        <div>Display Mode: {debugInfo.displayMode ? 'Standalone' : 'Browser'}</div>
        <div>Standalone Nav: {debugInfo.isStandaloneNav ? 'Yes' : 'No'}</div>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="mt-2 px-2 py-1 bg-red-600 rounded text-xs"
      >
        Close
      </button>
    </div>
  );
}
