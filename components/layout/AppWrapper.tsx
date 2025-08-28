'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const { loading } = useAuth();
  const [appLoading, setAppLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate app initialization progress
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(timer);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    // Complete loading when auth is ready
    if (!loading) {
      setProgress(100);
      setTimeout(() => setAppLoading(false), 500);
    }

    return () => clearInterval(timer);
  }, [loading]);

  // Show app loading screen during initial load
  if (appLoading) {
    return (
      <AppLoadingScreen 
        message="Initializing Application..." 
        showProgress={true}
        progress={progress}
      />
    );
  }

  return <>{children}</>;
}

