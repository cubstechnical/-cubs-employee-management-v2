'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface NetworkStatusProps {
  showWhenOnline?: boolean;
  position?: 'top' | 'bottom';
}

export default function MobileNetworkStatus({ 
  showWhenOnline = false, 
  position = 'top' 
}: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);
  const [connectionType, setConnectionType] = useState<string>('');

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine);
    
    // Get connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection?.effectiveType || 'unknown');
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      // Hide after 3 seconds
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show if online and showWhenOnline is false
  if (isOnline && !showWhenOnline) {
    return null;
  }

  // Don't show if not visible
  if (!showStatus) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (connectionType === 'slow-2g' || connectionType === '2g') return 'bg-yellow-500';
    if (connectionType === '3g') return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'No Internet Connection';
    if (connectionType === 'slow-2g') return 'Slow Connection';
    if (connectionType === '2g') return '2G Connection';
    if (connectionType === '3g') return '3G Connection';
    if (connectionType === '4g') return '4G Connection';
    return 'Connected';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    if (connectionType === 'slow-2g' || connectionType === '2g') {
      return <AlertCircle className="h-4 w-4" />;
    }
    return <Wifi className="h-4 w-4" />;
  };

  return (
    <div className={`fixed ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 z-50 transition-transform duration-300 ${
      showStatus ? 'translate-y-0' : position === 'top' ? '-translate-y-full' : 'translate-y-full'
    }`}>
      <div className={`${getStatusColor()} text-white px-4 py-2 flex items-center justify-center space-x-2 text-sm font-medium`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
    </div>
  );
}
