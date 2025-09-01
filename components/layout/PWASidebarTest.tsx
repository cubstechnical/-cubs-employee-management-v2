'use client';

import { usePWA } from '@/hooks/usePWA';
import { useState, useEffect } from 'react';

export default function PWASidebarTest() {
  const { isPWA, isStandalone } = usePWA();
  const [sidebarState, setSidebarState] = useState({
    open: false,
    persistent: false,
    mobile: false
  });

  useEffect(() => {
    const checkSidebarState = () => {
      const persistent = localStorage.getItem('pwa-persistent-sidebar') === 'true';
      const mobile = window.innerWidth < 1024;
      
      setSidebarState({
        open: persistent && isPWA,
        persistent,
        mobile
      });
    };

    checkSidebarState();
    window.addEventListener('resize', checkSidebarState);
    
    return () => window.removeEventListener('resize', checkSidebarState);
  }, [isPWA]);

  if (!isPWA) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800">PWA Sidebar Test</h3>
        <p className="text-yellow-700">This test only runs in PWA mode. Open the app in a mobile browser or install as PWA to test.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <h3 className="font-semibold text-green-800 mb-2">PWA Sidebar Status</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-green-700">PWA Mode:</span>
          <span className="font-mono text-green-800">{isPWA ? '✅ Active' : '❌ Inactive'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-700">Standalone:</span>
          <span className="font-mono text-green-800">{isStandalone ? '✅ Yes' : '❌ No'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-700">Mobile Screen:</span>
          <span className="font-mono text-green-800">{sidebarState.mobile ? '✅ Yes' : '❌ No'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-700">Persistent Sidebar:</span>
          <span className="font-mono text-green-800">{sidebarState.persistent ? '✅ Enabled' : '❌ Disabled'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-700">Sidebar Open:</span>
          <span className="font-mono text-green-800">{sidebarState.open ? '✅ Yes' : '❌ No'}</span>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-medium text-blue-800 mb-2">Instructions:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Tap the menu button (☰) in the top-left to open/close sidebar</li>
          <li>• Use "Pin Sidebar" button in sidebar to keep it always open</li>
          <li>• When pinned, sidebar stays open and content adjusts</li>
          <li>• When unpinned, sidebar slides in/out over content</li>
        </ul>
      </div>
    </div>
  );
}
