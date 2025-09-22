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

  // Optimized throttling with deduplication
  const lastRefreshAtRef = useRef<number>(0);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPageVisibleRef = useRef<boolean>(true);
  const pendingRefreshRef = useRef<boolean>(false);

  const scheduleRefresh = useCallback((cb?: () => void) => {
    const now = Date.now();
    const minIntervalMs = 2000; // Increased throttle window for better performance
    const elapsed = now - lastRefreshAtRef.current;

    // If already pending, don't schedule another
    if (pendingRefreshRef.current) {
      return;
    }

    const run = () => {
      pendingRefreshRef.current = false;
      lastRefreshAtRef.current = Date.now();
      cb?.();
      onDataChange?.();
    };

    // If page hidden, delay until visible
    if (!isPageVisibleRef.current) {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      pendingRefreshRef.current = true;
      refreshTimerRef.current = setTimeout(() => run(), 1000);
      return;
    }

    if (elapsed >= minIntervalMs) {
      pendingRefreshRef.current = true;
      run();
    } else {
      const wait = minIntervalMs - elapsed;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      pendingRefreshRef.current = true;
      refreshTimerRef.current = setTimeout(() => run(), Math.max(500, wait));
    }
  }, [onDataChange]);

  const handleEmployeeChanges = useCallback(() => {
    scheduleRefresh(onEmployeeChange);
  }, [onEmployeeChange, scheduleRefresh]);

  const handleDocumentChanges = useCallback(() => {
    scheduleRefresh(onDocumentChange);
  }, [onDocumentChange, scheduleRefresh]);

  const handleNotificationChanges = useCallback(() => {
    scheduleRefresh(onNotificationChange);
  }, [onNotificationChange, scheduleRefresh]);

  useEffect(() => {
    if (!enabled) {
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
          handleNotificationChanges();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
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