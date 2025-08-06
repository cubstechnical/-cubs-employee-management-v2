import { useEffect, useCallback } from 'react';
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

  const handleEmployeeChanges = useCallback(() => {
    console.log('🔄 Employee data changed - refreshing dashboard');
    onEmployeeChange?.();
    onDataChange?.();
  }, [onEmployeeChange, onDataChange]);

  const handleDocumentChanges = useCallback(() => {
    console.log('📄 Document data changed - refreshing dashboard');
    onDocumentChange?.();
    onDataChange?.();
  }, [onDocumentChange, onDataChange]);

  const handleNotificationChanges = useCallback(() => {
    console.log('🔔 Notification data changed - refreshing dashboard');
    onNotificationChange?.();
  }, [onNotificationChange]);

  useEffect(() => {
    if (!enabled) {
      console.log('📡 Realtime dashboard subscriptions disabled');
      return;
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
          console.log('Employee change detected:', payload);
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
          console.log('Document change detected:', payload);
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
          console.log('Notification change detected:', payload);
          handleNotificationChanges();
        }
      )
      .subscribe();

    console.log('📡 Realtime dashboard subscriptions established');

    // Cleanup subscriptions
    return () => {
      console.log('🔌 Cleaning up realtime dashboard subscriptions');
      supabase.removeChannel(employeeSubscription);
      supabase.removeChannel(documentSubscription);
      supabase.removeChannel(notificationSubscription);
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