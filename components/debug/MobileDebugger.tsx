'use client';

import { usePWA } from '@/hooks/usePWA';
import { useState, useEffect } from 'react';

export default function MobileDebugger() {
  const { isPWA, isStandalone } = usePWA();
  const [debugInfo, setDebugInfo] = useState({
    userAgent: '',
    screenWidth: 0,
    screenHeight: 0,
    isMobileDevice: false,
    isSmallScreen: false,
    isTouchDevice: false,
    isMobileBehavior: false,
    windowWidth: 0,
    windowHeight: 0
  });

  useEffect(() => {
    const updateDebugInfo = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 1024;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileBehavior = isPWA || isSmallScreen;

      setDebugInfo({
        userAgent,
        screenWidth: screen.width,
        screenHeight: screen.height,
        isMobileDevice,
        isSmallScreen,
        isTouchDevice,
        isMobileBehavior,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      });
    };

    updateDebugInfo();
    window.addEventListener('resize', updateDebugInfo);
    
    return () => window.removeEventListener('resize', updateDebugInfo);
  }, [isPWA]);

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-xs z-[9999]">
      <h3 className="font-bold mb-2">Mobile Debug Info</h3>
      <div className="space-y-1">
        <div>PWA: {isPWA ? '✅' : '❌'}</div>
        <div>Standalone: {isStandalone ? '✅' : '❌'}</div>
        <div>Mobile Device: {debugInfo.isMobileDevice ? '✅' : '❌'}</div>
        <div>Small Screen: {debugInfo.isSmallScreen ? '✅' : '❌'}</div>
        <div>Touch Device: {debugInfo.isTouchDevice ? '✅' : '❌'}</div>
        <div>Mobile Behavior: {debugInfo.isMobileBehavior ? '✅' : '❌'}</div>
        <div>Width: {debugInfo.windowWidth}px</div>
        <div>Height: {debugInfo.windowHeight}px</div>
        <div className="text-xs opacity-75 mt-2">
          User Agent: {debugInfo.userAgent.substring(0, 50)}...
        </div>
      </div>
    </div>
  );
}
