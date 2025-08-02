import { supabase } from '../supabase/client';
import { EmailService, VisaExpiryData } from './email';

export interface VisaExpiryRecord {
  id: string;
  employee_id: string;
  name: string;
  email_id: string;
  visa_expiry_date: string;
  visa_type: string;
  company_name: string;
  notification_sent_90: boolean;
  notification_sent_60: boolean;
  notification_sent_30: boolean;
  notification_sent_15: boolean;
  notification_sent_7: boolean;
  last_notification_date?: string;
  daysRemaining?: number;
}

export class VisaNotificationService {
  static async checkAndSendVisaExpiryNotifications(): Promise<void> {
    try {
      console.log('Starting visa expiry notification check...');
      
      // Get all employees with visa expiry dates
      const { data: employees, error } = await supabase
        .from('employee_table')
        .select(`
          id,
          employee_id,
          name,
          email_id,
          visa_expiry_date,
          visa_type,
          company_name,
          notification_sent_90,
          notification_sent_60,
          notification_sent_30,
          notification_sent_15,
          notification_sent_7,
          last_notification_date
        `)
        .not('visa_expiry_date', 'is', null)
        .not('email_id', 'is', null);

      if (error) {
        console.error('Error fetching employees for visa notifications:', error);
        return;
      }

      if (!employees || employees.length === 0) {
        console.log('No employees found with visa expiry dates');
        return;
      }

      const today = new Date();
      let notificationsSent = 0;

      for (const employee of employees) {
        const expiryDate = new Date(employee.visa_expiry_date as string);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Check if notification should be sent based on days remaining
        const shouldSendNotification = this.shouldSendNotification(employee as VisaExpiryRecord, daysUntilExpiry);

        if (shouldSendNotification) {
          const notification: VisaExpiryData = {
            employeeName: employee.name as string,
            employeeEmail: employee.email_id as string,
            visaType: employee.visa_type as string,
            expiryDate: employee.visa_expiry_date as string,
            daysUntilExpiry: daysUntilExpiry,
            companyName: employee.company_name as string,
          };

          const emailSent = await EmailService.sendVisaExpiryNotification(notification);

          if (emailSent.success) {
            // Update notification flags in database
            await this.updateNotificationFlags(employee.id as string, daysUntilExpiry);
            notificationsSent++;
            
            console.log(`Visa expiry notification sent to ${employee.name} (${daysUntilExpiry} days remaining)`);
          }
        }
      }

      console.log(`Visa expiry notification check completed. ${notificationsSent} notifications sent.`);
    } catch (error) {
      console.error('Error in visa expiry notification service:', error);
    }
  }

  private static shouldSendNotification(employee: VisaExpiryRecord, daysUntilExpiry: number): boolean {
    // Only send notifications for positive days (not expired)
    if (daysUntilExpiry <= 0) {
      return false;
    }

    // Check specific day intervals
    if (daysUntilExpiry === 90 && !employee.notification_sent_90) {
      return true;
    }
    if (daysUntilExpiry === 60 && !employee.notification_sent_60) {
      return true;
    }
    if (daysUntilExpiry === 30 && !employee.notification_sent_30) {
      return true;
    }
    if (daysUntilExpiry === 15 && !employee.notification_sent_15) {
      return true;
    }
    if (daysUntilExpiry === 7 && !employee.notification_sent_7) {
      return true;
    }

    return false;
  }

  private static async updateNotificationFlags(employeeId: string, daysUntilExpiry: number): Promise<void> {
    const updateData: any = {
      last_notification_date: new Date().toISOString(),
    };

    // Set the appropriate notification flag
    switch (daysUntilExpiry) {
      case 90:
        updateData.notification_sent_90 = true;
        break;
      case 60:
        updateData.notification_sent_60 = true;
        break;
      case 30:
        updateData.notification_sent_30 = true;
        break;
      case 15:
        updateData.notification_sent_15 = true;
        break;
      case 7:
        updateData.notification_sent_7 = true;
        break;
    }

    const { error } = await supabase
      .from('employee_table')
      .update(updateData)
      .eq('id', employeeId);

    if (error) {
      console.error('Error updating notification flags:', error);
    }
  }

  static async getVisaExpiryAlerts(): Promise<VisaExpiryRecord[]> {
    try {
      const today = new Date();
      const alerts: VisaExpiryRecord[] = [];

      const { data: employees, error } = await supabase
        .from('employee_table')
        .select(`
          id,
          employee_id,
          name,
          email_id,
          visa_expiry_date,
          visa_type,
          company_name,
          notification_sent_90,
          notification_sent_60,
          notification_sent_30,
          notification_sent_15,
          notification_sent_7,
          last_notification_date
        `)
        .not('visa_expiry_date', 'is', null)
        .order('visa_expiry_date', { ascending: true });

      if (error) {
        console.error('Error fetching visa expiry alerts:', error);
        return [];
      }

      if (!employees) {
        return [];
      }

      for (const employee of employees) {
        const expiryDate = new Date(employee.visa_expiry_date as string);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Include employees with visas expiring within 90 days
        if (daysUntilExpiry <= 90 && daysUntilExpiry > 0) {
          alerts.push({
            ...employee,
            daysRemaining: daysUntilExpiry,
          } as VisaExpiryRecord);
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error getting visa expiry alerts:', error);
      return [];
    }
  }

  static async resetNotificationFlags(employeeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_table')
        .update({
          notification_sent_90: false,
          notification_sent_60: false,
          notification_sent_30: false,
          notification_sent_15: false,
          notification_sent_7: false,
          last_notification_date: null,
        })
        .eq('id', employeeId);

      if (error) {
        console.error('Error resetting notification flags:', error);
      }
    } catch (error) {
      console.error('Error resetting notification flags:', error);
    }
  }

  static async getNotificationStats(): Promise<{
    totalEmployees: number;
    expiringIn90Days: number;
    expiringIn60Days: number;
    expiringIn30Days: number;
    expiringIn15Days: number;
    expiringIn7Days: number;
    expired: number;
  }> {
    try {
      const today = new Date();
      const stats = {
        totalEmployees: 0,
        expiringIn90Days: 0,
        expiringIn60Days: 0,
        expiringIn30Days: 0,
        expiringIn15Days: 0,
        expiringIn7Days: 0,
        expired: 0,
      };

      const { data: employees, error } = await supabase
        .from('employee_table')
        .select('visa_expiry_date')
        .not('visa_expiry_date', 'is', null);

      if (error) {
        console.error('Error fetching notification stats:', error);
        return stats;
      }

      if (!employees) {
        return stats;
      }

      stats.totalEmployees = employees.length;

      for (const employee of employees) {
        const expiryDate = new Date(employee.visa_expiry_date as string);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 0) {
          stats.expired++;
        } else if (daysUntilExpiry <= 7) {
          stats.expiringIn7Days++;
        } else if (daysUntilExpiry <= 15) {
          stats.expiringIn15Days++;
        } else if (daysUntilExpiry <= 30) {
          stats.expiringIn30Days++;
        } else if (daysUntilExpiry <= 60) {
          stats.expiringIn60Days++;
        } else if (daysUntilExpiry <= 90) {
          stats.expiringIn90Days++;
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        totalEmployees: 0,
        expiringIn90Days: 0,
        expiringIn60Days: 0,
        expiringIn30Days: 0,
        expiringIn15Days: 0,
        expiringIn7Days: 0,
        expired: 0,
      };
    }
  }
} 