import { supabase } from '../supabase/client';
import { sendEmail } from '../sendgrid';

export interface VisaExpiryRecord {
  id: string;
  employee_name: string;
  visa_expiry_date: string;
  email: string;
  notification_sent_60: boolean;
  notification_sent_30: boolean;
  notification_sent_15: boolean;
  notification_sent_7: boolean;
  notification_sent_1: boolean;
}

const NOTIFICATION_INTERVALS = [60, 30, 15, 7, 1];

export async function checkAndSendVisaExpiryNotifications(): Promise<void> {
  try {
    console.log('Checking for visa expiry notifications...');
    
    const today = new Date();
    const records = await getVisaExpiryRecords();
    
    for (const record of records) {
      const daysUntilExpiry = calculateDaysUntilExpiry(record.visa_expiry_date);
      
      if (shouldSendNotification(record, daysUntilExpiry)) {
        await sendVisaExpiryEmail(record, daysUntilExpiry);
        await updateNotificationFlags(record.id, daysUntilExpiry);
        console.log(`Visa expiry notification sent for ${record.employee_name} (${daysUntilExpiry} days)`);
      }
    }
    
    console.log('Visa expiry notification check completed');
  } catch (error) {
    console.error('Error checking visa expiry notifications:', error);
  }
}

async function getVisaExpiryRecords(): Promise<VisaExpiryRecord[]> {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      id,
      employee_name,
      visa_expiry_date,
      email,
      notification_sent_60,
      notification_sent_30,
      notification_sent_15,
      notification_sent_7,
      notification_sent_1
    `)
    .not('visa_expiry_date', 'is', null)
    .not('visa_expiry_date', 'eq', '');

  if (error) {
    console.error('Error fetching visa expiry records:', error);
    return [];
  }

  return (data as VisaExpiryRecord[]) || [];
}

function calculateDaysUntilExpiry(visaExpiryDate: string): number {
  const expiryDate = new Date(visaExpiryDate);
  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function shouldSendNotification(record: VisaExpiryRecord, daysUntilExpiry: number): boolean {
  if (daysUntilExpiry < 0) {
    return false; // Visa already expired
  }

  if (!NOTIFICATION_INTERVALS.includes(daysUntilExpiry)) {
    return false; // Not at a notification interval
  }

  // Check if notification was already sent for this interval
  switch (daysUntilExpiry) {
    case 60:
      return !record.notification_sent_60;
    case 30:
      return !record.notification_sent_30;
    case 15:
      return !record.notification_sent_15;
    case 7:
      return !record.notification_sent_7;
    case 1:
      return !record.notification_sent_1;
    default:
      return false;
  }
}

async function sendVisaExpiryEmail(record: VisaExpiryRecord, daysUntilExpiry: number): Promise<void> {
  const urgency = getUrgencyLevel(daysUntilExpiry);
  const subject = `🚨 VISA EXPIRY ${urgency}: ${record.employee_name}`;
  
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">🚨 VISA EXPIRY NOTIFICATION</h2>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #dc2626;">${urgency} ALERT</h3>
        <p style="margin: 0; font-size: 16px;">
          <strong>${record.employee_name}</strong>'s visa expires in <strong>${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}</strong>.
        </p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0;">Employee Details:</h4>
        <ul style="margin: 0; padding-left: 20px;">
          <li><strong>Name:</strong> ${record.employee_name}</li>
          <li><strong>Email:</strong> ${record.email}</li>
          <li><strong>Visa Expiry Date:</strong> ${new Date(record.visa_expiry_date).toLocaleDateString()}</li>
          <li><strong>Days Remaining:</strong> ${daysUntilExpiry}</li>
        </ul>
      </div>
      
      <div style="background-color: #f0f9ff; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0;">Required Actions:</h4>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Review visa renewal requirements</li>
          <li>Contact the employee for documentation</li>
          <li>Initiate renewal process if applicable</li>
          <li>Update employee records accordingly</li>
        </ul>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated notification from the CUBS Visa Management System.
        Please take immediate action to ensure compliance.
      </p>
    </div>
  `;

  try {
    await sendEmail({
      to: 'info@cubstechnical.com',
      subject,
      html: emailContent
    });
    
    console.log(`Visa expiry email sent for ${record.employee_name} (${daysUntilExpiry} days)`);
  } catch (error) {
    console.error('Error sending visa expiry email:', error);
  }
}

function getUrgencyLevel(daysUntilExpiry: number): string {
  if (daysUntilExpiry <= 1) return 'CRITICAL';
  if (daysUntilExpiry <= 7) return 'URGENT';
  if (daysUntilExpiry <= 15) return 'HIGH';
  if (daysUntilExpiry <= 30) return 'MEDIUM';
  return 'LOW';
}

async function updateNotificationFlags(employeeId: string, daysUntilExpiry: number): Promise<void> {
  const updateData: any = {};
  
  switch (daysUntilExpiry) {
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
    case 1:
      updateData.notification_sent_1 = true;
      break;
  }

  const { error } = await supabase
    .from('employees')
    .update(updateData)
    .eq('id', employeeId);

  if (error) {
    console.error('Error updating notification flags:', error);
  }
}

// Function to manually trigger visa expiry check
export async function triggerVisaExpiryCheck(): Promise<void> {
  console.log('Manually triggering visa expiry check...');
  await checkAndSendVisaExpiryNotifications();
}

// Function to get visa expiry statistics
export async function getVisaExpiryStats(): Promise<{
  totalEmployees: number;
  expiringSoon: number;
  expired: number;
  notificationsSent: number;
}> {
  try {
    const { data: employees, error } = await supabase
      .from('employees')
      .select('visa_expiry_date, notification_sent_60, notification_sent_30, notification_sent_15, notification_sent_7, notification_sent_1')
      .not('visa_expiry_date', 'is', null);

    if (error) {
      console.error('Error fetching visa expiry stats:', error);
      return { totalEmployees: 0, expiringSoon: 0, expired: 0, notificationsSent: 0 };
    }

    const today = new Date();
    let expiringSoon = 0;
    let expired = 0;
    let notificationsSent = 0;

    employees?.forEach(employee => {
      if (employee.visa_expiry_date && typeof employee.visa_expiry_date === 'string') {
        const daysUntilExpiry = calculateDaysUntilExpiry(employee.visa_expiry_date);
        
        if (daysUntilExpiry < 0) {
          expired++;
        } else if (daysUntilExpiry <= 30) {
          expiringSoon++;
        }

        // Count notifications sent
        if (employee.notification_sent_60) notificationsSent++;
        if (employee.notification_sent_30) notificationsSent++;
        if (employee.notification_sent_15) notificationsSent++;
        if (employee.notification_sent_7) notificationsSent++;
        if (employee.notification_sent_1) notificationsSent++;
      }
    });

    return {
      totalEmployees: employees?.length || 0,
      expiringSoon,
      expired,
      notificationsSent
    };
  } catch (error) {
    console.error('Error getting visa expiry stats:', error);
    return { totalEmployees: 0, expiringSoon: 0, expired: 0, notificationsSent: 0 };
  }
} 