import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

interface UseRealtimeDashboardProps {
  onEmployeeChange?: () => void;
  onDocumentChange?: () => void;
  onNotificationChange?: () => void;
  onDataChange?: () => void;
  enabled?: boolean;
}

export function useRealtimeDashboard({
  onEmployeeChange,
  onDocumentChange,
  onNotificationChange,
  onDataChange,
  enabled = true
}: UseRealtimeDashboardProps = {}) {

  // Throttle refreshes to avoid spamming when multiple changes arrive quickly
  const lastRefreshAtRef = useRef<number>(0);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPageVisibleRef = useRef<boolean>(true);

  const scheduleRefresh = useCallback((cb?: () => void) => {
    const now = Date.now();
    const minIntervalMs = 1500; // throttle window
    const elapsed = now - lastRefreshAtRef.current;

    const run = () => {
      lastRefreshAtRef.current = Date.now();
      cb?.();
      onDataChange?.();
    };

    // If page hidden, delay until visible
    if (!isPageVisibleRef.current) {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => run(), 1000);
      return;
    }

    if (elapsed >= minIntervalMs) {
      run();
    } else {
      const wait = minIntervalMs - elapsed;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => run(), Math.max(250, wait));
    }
  }, [onDataChange]);

  const handleEmployeeChanges = useCallback(() => {
    console.log('🔄 Employee data changed - refreshing dashboard');
    scheduleRefresh(onEmployeeChange);
  }, [onEmployeeChange, scheduleRefresh]);

  const handleDocumentChanges = useCallback(() => {
    console.log('📄 Document data changed - refreshing dashboard');
    scheduleRefresh(onDocumentChange);
  }, [onDocumentChange, scheduleRefresh]);

  const handleNotificationChanges = useCallback(() => {
    console.log('🔔 Notification data changed - refreshing dashboard');
    scheduleRefresh(onNotificationChange);
  }, [onNotificationChange, scheduleRefresh]);

  useEffect(() => {
    if (!enabled) {
    if (process.env.NODE_ENV !== 'production') console.log('📡 Realtime dashboard subscriptions disabled');
      return;
    }

    // Listen for page visibility to pause heavy refresh work when hidden
    const onVisibility = () => {
      isPageVisibleRef.current = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
    };
    if (typeof document !== 'undefined') {
      isPageVisibleRef.current = document.visibilityState === 'visible';
      document.addEventListener('visibilitychange', onVisibility);
    }

    // Subscribe to employee table changes
    const employeeSubscription = supabase
      .channel('employee_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_table'
        },
        (payload) => {
          if (process.env.NODE_ENV !== 'production') console.log('Employee change detected:', payload);
          handleEmployeeChanges();
        }
      )
      .subscribe();

    // Subscribe to document changes
    const documentSubscription = supabase
      .channel('document_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_documents'
        },
        (payload) => {
          if (process.env.NODE_ENV !== 'production') console.log('Document change detected:', payload);
          handleDocumentChanges();
        }
      )
      .subscribe();

    // Subscribe to notification changes (if table exists)
    const notificationSubscription = supabase
      .channel('notification_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          if (process.env.NODE_ENV !== 'production') console.log('Notification change detected:', payload);
          handleNotificationChanges();
        }
      )
      .subscribe();

    if (process.env.NODE_ENV !== 'production') console.log('📡 Realtime dashboard subscriptions established');

    // Cleanup subscriptions
    return () => {
      if (process.env.NODE_ENV !== 'production') console.log('🔌 Cleaning up realtime dashboard subscriptions');
      supabase.removeChannel(employeeSubscription);
      supabase.removeChannel(documentSubscription);
      supabase.removeChannel(notificationSubscription);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
      }, [enabled, handleEmployeeChanges, handleDocumentChanges, handleNotificationChanges, onDataChange]);

  return {
    // Return utility functions if needed
    refreshEmployees: handleEmployeeChanges,
    refreshDocuments: handleDocumentChanges,
    refreshNotifications: handleNotificationChanges,
    isConnected: true,
    lastUpdate: new Date(),
    refresh: onDataChange || (() => {})
  };
}