'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';
import { isSupabaseAvailable, preloadAppData } from '@/lib/supabase/client';

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const { isLoading, user } = useAuth();
  const [appLoading, setAppLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [fastLoadMode, setFastLoadMode] = useState(false);

  // Fast loading mode when Supabase is not available
  useEffect(() => {
    if (!isSupabaseAvailable) {

      setFastLoadMode(true);
      setProgress(100);
      setTimeout(() => setAppLoading(false), 200);
      return;
    }
  }, []);

  useEffect(() => {
    // Skip loading logic in fast mode
    if (fastLoadMode) return;

    // Add timeout to prevent infinite loading (2 seconds max)
    const timeout = setTimeout(() => {
      setHasTimedOut(true);
      setProgress(100);
      setTimeout(() => setAppLoading(false), 100);
    }, 2000);

    // Simulate app initialization progress
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90 && !isLoading) {
          clearInterval(timer);
          clearTimeout(timeout);
          return 100;
        }
        if (prev >= 90) {
          return 90;
        }
        return prev + 20; // Much faster increment
      });
    }, 50); // Faster updates

    // Complete loading when auth is ready OR if we have a timeout
    if (!isLoading || hasTimedOut) {
      clearInterval(timer);
      clearTimeout(timeout);
      setProgress(100);
      setTimeout(() => setAppLoading(false), 100);
    }

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [isLoading, hasTimedOut, fastLoadMode]);

  // Force loading completion after minimal delay
  useEffect(() => {
    const forceLoadDelay = fastLoadMode ? 200 : 500; // Much faster
    const forceLoadTimer = setTimeout(() => {
      if (appLoading) {
        setAppLoading(false);
        setProgress(100);
      }
    }, forceLoadDelay);

    return () => clearTimeout(forceLoadTimer);
  }, [appLoading, fastLoadMode]);

  // Start preloading data after app loads
  useEffect(() => {
    if (!appLoading && isSupabaseAvailable) {
      // Preload data in background after app is ready
      setTimeout(() => {
        preloadAppData();
      }, 200);
    }
  }, [appLoading]);

  // Show app loading screen during initial load
  if (appLoading) {
    const getLoadingMessage = () => {
      if (fastLoadMode) return "Loading Application (Fast Mode)...";
      if (hasTimedOut) return "Loading Application...";
      return "Initializing Application...";
    };

    return (
      <AppLoadingScreen
        message={getLoadingMessage()}
        showProgress={true}
        progress={progress}
      />
    );
  }

  // Show offline mode banner when Supabase is not available
  const isOfflineMode = !isSupabaseAvailable;

  return (
    <>
      {isOfflineMode && (
        <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
          <div className="flex items-center space-x-2">
            <span className="font-medium">⚠️ Offline Mode</span>
            <span>Some features may not be available</span>
          </div>
        </div>
      )}
      {children}
    </>
  );
}

