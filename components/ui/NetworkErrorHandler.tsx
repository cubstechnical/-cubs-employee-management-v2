'use client';

import { useEffect, useState } from 'react';
import { isCapacitorApp } from '@/utils/mobileDetection';

export default function NetworkErrorHandler() {
  const [isOnline, setIsOnline] = useState(true);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!isCapacitorApp()) return; // Only for mobile apps

    const checkConnectivity = async () => {
      try {
        // Simple connectivity check
        const response = await fetch('https://www.google.com/favicon.ico', { 
          mode: 'no-cors',
          cache: 'no-cache'
        });
        setIsOnline(true);
        setShowError(false);
      } catch (error) {
        setIsOnline(false);
        setShowError(true);
      }
    };

    // Check connectivity on mount
    checkConnectivity();

    // Check every 10 seconds
    const interval = setInterval(checkConnectivity, 10000);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setShowError(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowError(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showError || !isCapacitorApp()) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Connection Error
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Please check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#d3194f] text-white px-4 py-2 rounded-lg hover:bg-[#b01640] transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
