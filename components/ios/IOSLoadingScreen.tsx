'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface IOSLoadingScreenProps {
  children: React.ReactNode;
}

export default function IOSLoadingScreen({ children }: IOSLoadingScreenProps) {
  const [isIOSReady, setIsIOSReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');

  useEffect(() => {
    const initializeIOS = async () => {
      try {
        setLoadingMessage('Checking iOS environment...');
        
        // Check if running on iOS
        const isIOS = Capacitor.getPlatform() === 'ios';
        if (!isIOS) {
          setIsIOSReady(true);
          return;
        }

        setLoadingMessage('Loading iOS dependencies...');
        
        // Wait for Capacitor to be ready
        if (window.Capacitor) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setLoadingMessage('Finalizing setup...');
        await new Promise(resolve => setTimeout(resolve, 500));

        setIsIOSReady(true);
      } catch (error) {
        console.error('iOS initialization error:', error);
        // Still show the app even if initialization fails
        setIsIOSReady(true);
      }
    };

    initializeIOS();
  }, []);

  if (!isIOSReady) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3194f] mx-auto"></div>
          <p className="text-white text-lg font-medium">{loadingMessage}</p>
          <p className="text-gray-400 text-sm">Please wait...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
