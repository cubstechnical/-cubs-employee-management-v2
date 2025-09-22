import { supabase } from '../supabase/client';
import { EmailService } from './email';

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  status: 'sent' | 'pending' | 'failed';
  recipient: string;
  category: 'visa' | 'document' | 'system' | 'approval';
  created_at: string;
  scheduled_for?: string;
  sent_at?: string;
  error_message?: string;
}

export interface NotificationStats {
  total: number;
  sent: number;
  pending: number;
  failed: number;
  today: number;
  thisWeek: number;
  byCategory: {
    visa: number;
    document: number;
    system: number;
    approval: number;
  };
}

export class NotificationService {
  // Create a new notification record
  static async createNotification(notification: Omit<NotificationRecord, 'id' | 'created_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          status: notification.status,
          recipient: notification.recipient,
          category: notification.category,
          scheduled_for: notification.scheduled_for,
          sent_at: notification.sent_at,
          error_message: notification.error_message
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Error creating notification:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Notification created successfully:', data.id);
      return { success: true, id: data.id as string };
    } catch (error) {
      console.error('❌ Unexpected error creating notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get all notifications with pagination and filtering
  static async getNotifications(options: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    category?: string;
    search?: string;
  } = {}): Promise<{ notifications: NotificationRecord[]; total: number; error?: string }> {
    try {
      const { page = 1, limit = 50, type, status, category, search } = options;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (type) {
        query = query.eq('type', type);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (category) {
        query = query.eq('category', category);
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%,recipient.ilike.%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching notifications:', error);
        return { notifications: [], total: 0, error: error.message };
      }

      return { notifications: (data as unknown as NotificationRecord[]) || [], total: count || 0 };
    } catch (error) {
      console.error('❌ Unexpected error fetching notifications:', error);
      return { notifications: [], total: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get notification statistics
  static async getNotificationStats(): Promise<{ stats: NotificationStats; error?: string }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get all notifications
      const { data: allNotifications, error: allError } = await supabase
        .from('notifications')
        .select('*');

      if (allError) {
        console.error('❌ Error fetching all notifications for stats:', allError);
        return { stats: this.getDefaultStats(), error: allError.message };
      }

      const notifications = allNotifications || [];
      
      // Calculate stats
      const stats: NotificationStats = {
        total: notifications.length,
        sent: notifications.filter(n => n.status === 'sent').length,
        pending: notifications.filter(n => n.status === 'pending').length,
        failed: notifications.filter(n => n.status === 'failed').length,
        today: notifications.filter(n => new Date(n.created_at as string) >= today).length,
        thisWeek: notifications.filter(n => new Date(n.created_at as string) >= weekAgo).length,
        byCategory: {
          visa: notifications.filter(n => n.category === 'visa').length,
          document: notifications.filter(n => n.category === 'document').length,
          system: notifications.filter(n => n.category === 'system').length,
          approval: notifications.filter(n => n.category === 'approval').length
        }
      };

      return { stats };
    } catch (error) {
      console.error('❌ Unexpected error getting notification stats:', error);
      return { stats: this.getDefaultStats(), error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Update notification status
  static async updateNotificationStatus(id: string, status: 'sent' | 'pending' | 'failed', errorMessage?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = { status };
      
      if (status === 'sent') {
        updateData.sent_at = new Date().toISOString();
      }
      
      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await supabase
        .from('notifications')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('❌ Error updating notification status:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Notification status updated successfully:', id);
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error updating notification status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Send notification and update status
  static async sendNotification(notification: Omit<NotificationRecord, 'id' | 'created_at' | 'status' | 'sent_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Create notification record with pending status
      const createResult = await this.createNotification({
        ...notification,
        status: 'pending'
      });

      if (!createResult.success || !createResult.id) {
        return { success: false, error: createResult.error };
      }

      const notificationId = createResult.id;

      try {
        // Send email based on category
        let emailResult;
        
        switch (notification.category) {
          case 'visa':
            // For visa notifications, we'll use the existing visa notification service
            emailResult = { success: true }; // This will be handled by the visa service
            break;
          case 'approval':
            // For approval notifications, use the approval email service
            emailResult = await EmailService.sendApprovalNotification({
              recipientEmail: notification.recipient,
              recipientName: 'User',
              adminName: 'System',
              action: 'approved'
            });
            break;
          default:
            // For other notifications, send a generic email
            emailResult = await EmailService.sendEmail({
              to: notification.recipient,
              subject: notification.title,
              html: `
                <h2>${notification.title}</h2>
                <p>${notification.message}</p>
                <p><em>This is an automated notification from CUBS Technical.</em></p>
              `,
              text: `${notification.title}\n\n${notification.message}\n\nThis is an automated notification from CUBS Technical.`
            });
        }

        if (emailResult.success) {
          // Update status to sent
          await this.updateNotificationStatus(notificationId, 'sent');
          return { success: true, id: notificationId };
        } else {
          // Update status to failed
          await this.updateNotificationStatus(notificationId, 'failed', emailResult.error);
          return { success: false, id: notificationId, error: emailResult.error };
        }
      } catch (emailError) {
        // Update status to failed
        const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown email error';
        await this.updateNotificationStatus(notificationId, 'failed', errorMessage);
        return { success: false, id: notificationId, error: errorMessage };
      }
    } catch (error) {
      console.error('❌ Unexpected error sending notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get default stats when there's an error
  private static getDefaultStats(): NotificationStats {
    return {
      total: 0,
      sent: 0,
      pending: 0,
      failed: 0,
      today: 0,
      thisWeek: 0,
      byCategory: {
        visa: 0,
        document: 0,
        system: 0,
        approval: 0
      }
    };
  }

  // Clean up old notifications (older than 30 days)
  static async cleanupOldNotifications(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())
        .select('id');

      if (error) {
        console.error('❌ Error cleaning up old notifications:', error);
        return { success: false, error: error.message };
      }

      const deletedCount = data?.length || 0;
      console.log(`✅ Cleaned up ${deletedCount} old notifications`);
      return { success: true, deletedCount };
    } catch (error) {
      console.error('❌ Unexpected error cleaning up old notifications:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export default NotificationService;
