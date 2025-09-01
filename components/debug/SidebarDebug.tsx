'use client';

import { useState, useEffect } from 'react';
import { isMobileDevice } from '@/utils/mobileDetection';

interface SidebarDebugProps {
  sidebarOpen: boolean;
  isMobile: boolean;
}

export default function SidebarDebug({ sidebarOpen, isMobile }: SidebarDebugProps) {
  const [debugInfo, setDebugInfo] = useState({
    windowWidth: 0,
    windowHeight: 0,
    isMobileUtil: false,
    touchSupport: false,
    userAgent: '',
  });

  useEffect(() => {
    const updateInfo = () => {
      setDebugInfo({
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        isMobileUtil: isMobileDevice(),
        touchSupport: 'ontouchstart' in window,
        userAgent: navigator.userAgent.substring(0, 50)
      });
    };

    updateInfo();
    window.addEventListener('resize', updateInfo);
    return () => window.removeEventListener('resize', updateInfo);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-3 rounded-lg text-xs max-w-xs z-[9999]">
      <h3 className="font-bold mb-2 text-yellow-400">Sidebar Debug</h3>
      <div className="space-y-1">
        <div>Sidebar Open: {sidebarOpen ? '✅ TRUE' : '❌ FALSE'}</div>
        <div>isMobile Prop: {isMobile ? '✅ TRUE' : '❌ FALSE'}</div>
        <div>Mobile Util: {debugInfo.isMobileUtil ? '✅ TRUE' : '❌ FALSE'}</div>
        <div>Touch Support: {debugInfo.touchSupport ? '✅ TRUE' : '❌ FALSE'}</div>
        <div>Width: {debugInfo.windowWidth}px</div>
        <div>Height: {debugInfo.windowHeight}px</div>
        <div className="text-xs opacity-75 mt-2">
          UA: {debugInfo.userAgent}...
        </div>
        <button 
          onClick={() => {
            console.log('🔍 Debug Info:', {
              sidebarOpen,
              isMobile,
              isMobileUtil: debugInfo.isMobileUtil,
              windowWidth: debugInfo.windowWidth,
              touchSupport: debugInfo.touchSupport
            });
          }}
          className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
        >
          Log Debug
        </button>
      </div>
    </div>
  );
}
