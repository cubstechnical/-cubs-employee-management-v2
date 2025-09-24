import { supabase } from '@/lib/supabase/client';
import nodemailer from 'nodemailer';

export interface NotificationData {
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  recipient: string;
  category: 'visa' | 'document' | 'system' | 'approval';
  scheduledFor?: Date;
}

export class NotificationService {
  private static transporter: nodemailer.Transporter | null = null;

  // Initialize email transporter
  private static getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER || 'technicalcubs@gmail.com',
          pass: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD
        }
      });
    }
    return this.transporter;
  }

  // Send notification (email + database record)
  static async sendNotification(data: NotificationData): Promise<{ success: boolean; error?: string }> {
    try {
      // Save to database
      const { error: dbError } = await supabase
        .from('notifications')
        .insert([{
          title: data.title,
          message: data.message,
          type: data.type,
          recipient: data.recipient,
          category: data.category,
          status: 'pending',
          scheduled_for: data.scheduledFor?.toISOString(),
          created_at: new Date().toISOString()
        }]);

      if (dbError) {
        console.error('Error saving notification to database:', dbError);
        // Continue with email sending even if DB save fails
      }

      // Send email notification
      if (typeof window === 'undefined') {
        // Server-side email sending
        const transporter = this.getTransporter();
        
        const mailOptions = {
          from: process.env.GMAIL_USER || 'technicalcubs@gmail.com',
          to: data.recipient,
          subject: `CUBS Technical - ${data.title}`,
          html: this.generateEmailHTML(data)
        };

        await transporter.sendMail(mailOptions);
        
        // Update status to sent
        await supabase
          .from('notifications')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString() 
          })
          .eq('recipient', data.recipient)
          .eq('title', data.title);
      } else {
        // Client-side - use API route
        const response = await fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          throw new Error('Failed to send notification via API');
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending notification:', error);
      
      // Update status to failed
      await supabase
        .from('notifications')
        .update({ 
          status: 'failed', 
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('recipient', data.recipient)
        .eq('title', data.title);

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Check for visa expiries and send notifications
  static async checkVisaExpiries(): Promise<{ success: boolean; notificationsSent: number; error?: string }> {
    try {
      const now = new Date();
      const checkDates = [60, 30, 15, 7, 1]; // Days before expiry
      let notificationsSent = 0;

      for (const days of checkDates) {
        const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        const targetDateStr = targetDate.toISOString().split('T')[0];
        const columnName = `notification_sent_${days}` as const;

        // Find employees with visas expiring on target date who haven't been notified
        const { data: employees, error } = await supabase
          .from('employee_table')
          .select('id, name, email_id, visa_expiry_date, company_name')
          .eq('visa_expiry_date', targetDateStr)
          .eq('is_active', true)
          .eq(columnName, false);

        if (error) {
          console.error(`Error fetching employees for ${days} days:`, error);
          continue;
        }

        if (!employees || employees.length === 0) {
          continue;
        }

        // Send notifications to each employee
        for (const employee of employees) {
          const urgencyLevel = days <= 7 ? 'URGENT' : days <= 15 ? 'HIGH PRIORITY' : 'NOTICE';
          
          const notificationData: NotificationData = {
            title: `${urgencyLevel}: Visa Expiry Reminder`,
            message: `Your visa will expire in ${days} day${days > 1 ? 's' : ''} (${employee.visa_expiry_date}). Please take necessary action.`,
            type: days <= 7 ? 'error' : days <= 15 ? 'warning' : 'info',
            recipient: employee.email_id || 'info@cubstechnical.com',
            category: 'visa'
          };

          const result = await this.sendNotification(notificationData);
          
          if (result.success) {
            // Mark as notified in database
            await supabase
              .from('employee_table')
              .update({ [columnName]: true })
              .eq('id', employee.id);
            
            notificationsSent++;
            console.log(`✅ Visa expiry notification sent to ${employee.name} (${days} days)`);
          } else {
            console.error(`❌ Failed to send notification to ${employee.name}:`, result.error);
          }
        }
      }

      return { success: true, notificationsSent };
    } catch (error) {
      console.error('Error checking visa expiries:', error);
      return { 
        success: false, 
        notificationsSent: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Generate email HTML template
  private static generateEmailHTML(data: NotificationData): string {
    const urgencyColor = data.type === 'error' ? '#dc2626' : data.type === 'warning' ? '#f59e0b' : '#3b82f6';
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #d3194f 0%, #b91c4c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">CUBS Technical</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Employee Management System</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <div style="background: ${urgencyColor}; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px;">${data.title}</h2>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #374151;">
              ${data.message}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://cubstechnical.com/login" 
               style="background: #d3194f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Access Employee Portal
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="margin: 0; font-size: 14px; color: #6b7280; text-align: center;">
              <strong>Important:</strong> Please take immediate action if this is an urgent notification.
            </p>
          </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            CUBS Technical - Group of Companies<br>
            UAE • QATAR • OMAN • KSA<br>
            <a href="mailto:info@cubstechnical.com" style="color: #d3194f;">info@cubstechnical.com</a>
          </p>
        </div>
      </div>
    `;
  }

  // Get notification statistics
  static async getNotificationStats(): Promise<{
    total: number;
    sent: number;
    pending: number;
    failed: number;
    today: number;
    thisWeek: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('status, created_at');

      if (error) {
        console.error('Error fetching notification stats:', error);
        return { total: 0, sent: 0, pending: 0, failed: 0, today: 0, thisWeek: 0 };
      }

      const today = new Date().toDateString();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const stats = {
        total: data?.length || 0,
        sent: data?.filter(n => n.status === 'sent').length || 0,
        pending: data?.filter(n => n.status === 'pending').length || 0,
        failed: data?.filter(n => n.status === 'failed').length || 0,
        today: data?.filter(n => new Date(n.created_at).toDateString() === today).length || 0,
        thisWeek: data?.filter(n => new Date(n.created_at) >= weekAgo).length || 0
      };

      return stats;
    } catch (error) {
      console.error('Error calculating notification stats:', error);
      return { total: 0, sent: 0, pending: 0, failed: 0, today: 0, thisWeek: 0 };
    }
  }
}