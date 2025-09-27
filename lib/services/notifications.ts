'use client';

import { supabase } from '@/lib/supabase/client';
import { log } from '@/lib/utils/productionLogger';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  category: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  created_at: string;
}

export class NotificationService {
  /**
   * Fetch notifications for the current user
   */
  static async getNotifications(): Promise<{ success: boolean; notifications: Notification[]; error?: string }> {
    try {
      log.info('Fetching notifications...');

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        log.error('Failed to fetch notifications:', error);
        return {
          success: false,
          error: 'Failed to fetch notifications',
          notifications: []
        };
      }

      return {
        success: true,
        notifications: notifications || []
      };
    } catch (error) {
      log.error('Notifications service error:', error);
      return {
        success: false,
        error: 'Internal server error',
        notifications: []
      };
    }
  }

  /**
   * Create a new notification
   */
  static async createNotification(data: {
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'success' | 'error';
    user_id?: string;
  }): Promise<{ success: boolean; notification?: Notification; error?: string }> {
    try {
      const { title, message, type = 'info', user_id } = data;

      if (!title || !message) {
        return {
          success: false,
          error: 'Title and message are required'
        };
      }

      log.info('Creating notification:', { title, message, type });

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          title,
          message,
          type,
          user_id,
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        log.error('Failed to create notification:', error);
        return {
          success: false,
          error: 'Failed to create notification'
        };
      }

      return {
        success: true,
        notification
      };
    } catch (error) {
      log.error('Create notification error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Mark notifications as read
   */
  static async markAsRead(notificationIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', notificationIds);

      if (error) {
        log.error('Failed to mark notifications as read:', error);
        return {
          success: false,
          error: 'Failed to mark notifications as read'
        };
      }

      return { success: true };
    } catch (error) {
      log.error('Mark as read error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }
}