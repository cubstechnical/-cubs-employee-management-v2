import { supabase } from '../supabase/client';
import { EmailService } from './email-server';
import { PushNotificationService } from './pushNotifications';
import { log } from '@/lib/utils/productionLogger';

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

// Gmail SMTP Limits
const GMAIL_DAILY_LIMIT = 500; // Gmail free tier daily limit
const GMAIL_PER_SECOND_LIMIT = 20; // Gmail rate limit per second
const EMAIL_BATCH_SIZE = 10; // Send emails in batches to avoid rate limiting

export async function checkAndSendVisaExpiryNotifications(): Promise<void> {
  try {
    log.info('🔄 Checking for visa expiry notifications...');

    const today = new Date();
    const records = await getVisaExpiryRecords();

    // Group employees by notification intervals
    const notificationsByInterval = groupNotificationsByInterval(records);

    // Send consolidated emails for each interval
    let totalEmailsSent = 0;

    for (const [interval, employees] of Object.entries(notificationsByInterval)) {
      if (employees.length > 0) {
        await sendConsolidatedVisaExpiryEmail(employees, parseInt(interval));
        totalEmailsSent++;

        // Update notification flags for all employees in this interval
        await updateNotificationFlagsForBatch(employees, parseInt(interval));

        log.info(`📧 Consolidated visa expiry notification sent for ${employees.length} employees (${interval} days)`);

        // Respect Gmail rate limits - wait between batches
        if (totalEmailsSent < Object.keys(notificationsByInterval).length) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between emails
        }
      }
    }

    log.info(`✅ Visa expiry notification check completed. Sent ${totalEmailsSent} consolidated emails.`);
  } catch (error) {
    log.error('❌ Error checking visa expiry notifications:', error);
  }
}

function groupNotificationsByInterval(records: VisaExpiryRecord[]): Record<number, VisaExpiryRecord[]> {
  const grouped: Record<number, VisaExpiryRecord[]> = {};

  for (const record of records) {
    const daysUntilExpiry = calculateDaysUntilExpiry(record.visa_expiry_date);

    if (shouldSendNotification(record, daysUntilExpiry)) {
      if (!grouped[daysUntilExpiry]) {
        grouped[daysUntilExpiry] = [];
      }
      grouped[daysUntilExpiry].push(record);
    }
  }

  return grouped;
}

async function getVisaExpiryRecords(): Promise<VisaExpiryRecord[]> {
  try {
    // First, check if notification columns exist
    const { data: testData, error: testError } = await supabase
      .from('employee_table')
      .select('notification_sent_60')
      .limit(1);

    if (testError && testError.code === '42703') {
      log.info('⚠️ Notification tracking columns do not exist yet. Using basic employee data.');

      // Fallback: get basic employee data without notification tracking
      const { data, error } = await supabase
        .from('employee_table')
        .select(`
          id,
          name,
          visa_expiry_date,
          email_id
        `)
        .not('visa_expiry_date', 'is', null)
        .not('visa_expiry_date', 'eq', '')
        .eq('is_active', true);

      if (error) {
        log.error('Error fetching basic visa expiry records:', error);
        return [];
      }

      // Map without notification tracking (all false)
      const mappedData: VisaExpiryRecord[] = (data || []).map(record => ({
        id: String((record as any).id || ''),
        employee_name: String((record as any).name || ''),
        visa_expiry_date: String((record as any).visa_expiry_date || ''),
        email: String((record as any).email_id || 'no-email@cubstechnical.com'),
        notification_sent_60: false,
        notification_sent_30: false,
        notification_sent_15: false,
        notification_sent_7: false,
        notification_sent_1: false,
      }));

      return mappedData;
    }

    // If notification columns exist, use full query
    const { data, error } = await supabase
      .from('employee_table')
      .select(`
        id,
        name,
        visa_expiry_date,
        email_id,
        notification_sent_60,
        notification_sent_30,
        notification_sent_15,
        notification_sent_7,
        notification_sent_1
      `)
      .not('visa_expiry_date', 'is', null)
      .not('visa_expiry_date', 'eq', '')
      .eq('is_active', true);

    if (error) {
      log.error('Error fetching visa expiry records:', error);
      return [];
    }

    // Map the database columns to our interface
    const mappedData: VisaExpiryRecord[] = (data || []).map(record => ({
      id: String((record as any).id || ''),
      employee_name: String((record as any).name || ''),
      visa_expiry_date: String((record as any).visa_expiry_date || ''),
      email: String((record as any).email_id || 'no-email@cubstechnical.com'),
      notification_sent_60: Boolean((record as any).notification_sent_60),
      notification_sent_30: Boolean((record as any).notification_sent_30),
      notification_sent_15: Boolean((record as any).notification_sent_15),
      notification_sent_7: Boolean((record as any).notification_sent_7),
      notification_sent_1: Boolean((record as any).notification_sent_1),
    }));

    return mappedData;
  } catch (error) {
    log.error('Unexpected error fetching visa expiry records:', error);
    return [];
  }
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

async function sendConsolidatedVisaExpiryEmail(employees: VisaExpiryRecord[], daysUntilExpiry: number): Promise<void> {
  const urgency = getUrgencyLevel(daysUntilExpiry);
  const urgencyColor = getUrgencyColor(daysUntilExpiry);
  const urgencyBg = getUrgencyBackground(daysUntilExpiry);

  const subject = `🚨 VISA EXPIRY ${urgency}: ${employees.length} Employee${employees.length > 1 ? 's' : ''} - ${daysUntilExpiry} Day${daysUntilExpiry === 1 ? '' : 's'} Remaining`;

  const employeeRows = employees.map(employee => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; text-align: left;">${employee.employee_name}</td>
      <td style="padding: 12px; text-align: left;">${employee.email}</td>
      <td style="padding: 12px; text-align: center;">${new Date(employee.visa_expiry_date).toLocaleDateString()}</td>
      <td style="padding: 12px; text-align: center;">
        <span style="background: ${urgencyBg}; color: ${urgencyColor}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
          ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}
        </span>
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>CUBS Technical - Visa Expiry Alert</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f9fafb;">
      <div style="max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">CUBS Technical</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Visa Expiry Alert</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px;">
          <div style="background: ${urgencyBg}; border-left: 4px solid ${urgencyColor}; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
            <h2 style="margin: 0 0 10px 0; color: ${urgencyColor};">🚨 Visa Expiry ${urgency} Alert</h2>
            <p style="margin: 0; color: ${urgencyColor};">
              ${employees.length} employee${employees.length > 1 ? 's have' : ' has'} visa${employees.length > 1 ? 's' : ''} expiring in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}.
            </p>
          </div>
          
          <h2 style="color: #374151; margin-bottom: 20px;">📋 Employee Details</h2>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
              <thead>
                <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                  <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151;">Employee Name</th>
                  <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151;">Email</th>
                  <th style="padding: 12px; text-align: center; font-weight: bold; color: #374151;">Expiry Date</th>
                  <th style="padding: 12px; text-align: center; font-weight: bold; color: #374151;">Days Remaining</th>
                </tr>
              </thead>
              <tbody>
                ${employeeRows}
              </tbody>
            </table>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
            <h3 style="margin: 0 0 10px 0; color: #92400e;">⚠️ Required Actions</h3>
            <ul style="margin: 0; padding-left: 20px; color: #92400e;">
              <li>Review visa status for all listed employees immediately</li>
              <li>Contact employees regarding renewal requirements</li>
              <li>Initiate renewal process where applicable</li>
              <li>Update visa records in the system</li>
              <li>Monitor upcoming expiries regularly</li>
            </ul>
          </div>
          
          <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">📧 Email Service Details</h3>
            <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
              <li><strong>Service:</strong> Gmail SMTP</li>
              <li><strong>From:</strong> technicalcubs@gmail.com</li>
              <li><strong>To:</strong> info@cubstechnical.com</li>
              <li><strong>Status:</strong> Active and working</li>
              <li><strong>Daily Limit:</strong> ${GMAIL_DAILY_LIMIT} emails</li>
              <li><strong>Rate Limit:</strong> ${GMAIL_PER_SECOND_LIMIT} emails/second</li>
            </ul>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            This is an automated notification from CUBS Technical.<br>
            Generated on: ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `CUBS Technical - Visa Expiry Alert

🚨 Visa Expiry ${urgency} Alert

${employees.length} employee${employees.length > 1 ? 's have' : ' has'} visa${employees.length > 1 ? 's' : ''} expiring in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}.

Employee Details:
${employees.map(employee => `- ${employee.employee_name} (${employee.email}) - Expires: ${new Date(employee.visa_expiry_date).toLocaleDateString()}`).join('\n')}

⚠️ Required Actions:
- Review visa status for all listed employees immediately
- Contact employees regarding renewal requirements
- Initiate renewal process where applicable
- Update visa records in the system
- Monitor upcoming expiries regularly

Email Service Details:
- Service: Gmail SMTP
- From: technicalcubs@gmail.com
- To: info@cubstechnical.com
- Status: Active and working
- Daily Limit: ${GMAIL_DAILY_LIMIT} emails
- Rate Limit: ${GMAIL_PER_SECOND_LIMIT} emails/second

Generated on: ${new Date().toLocaleString()}`;

  try {
    // 🛡️ SAFETY: Block all emails in development mode
    if (process.env.DISABLE_EMAILS === 'true') {
      log.warn(`📧 VISA EMAIL BLOCKED (DISABLE_EMAILS=true): Would send to info@cubstechnical.com for ${employees.length} employees (${daysUntilExpiry} days)`);
      log.info(`✅ Mock: Consolidated visa expiry email blocked for ${employees.length} employees (${daysUntilExpiry} days)`);
      return; // Exit early, don't send email
    }

    // Send email notification (if not blocked)
    const emailResult = await EmailService.sendEmail({
      to: 'info@cubstechnical.com',
      subject: subject,
      html: html,
      text: text
    });

    if (emailResult.success) {
      log.info(`✅ Consolidated visa expiry email sent for ${employees.length} employees (${daysUntilExpiry} days)`);
    } else {
      log.error('❌ Error sending consolidated visa expiry email:', emailResult.error);
    }

    // 🚀 AUTOMATED PUSH NOTIFICATION
    try {
      // 1. Fetch all registered push tokens (admin devices)
      // In a real app, you might filter by role. Here we assume all registered tokens are admins.
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: tokens, error: tokenError } = await supabase
        .from('push_tokens')
        .select('token');

      if (tokenError) {
        if (tokenError.code === '42P01') {
          log.warn('⚠️ Push tokens table missing. Skipping push notification.');
        } else {
          log.error('Error fetching push tokens:', tokenError);
        }
      } else if (tokens && tokens.length > 0) {
        const tokenList = (tokens as any[]).map((t: any) => t.token);
        const urgency = getUrgencyLevel(daysUntilExpiry); // 'Critical', 'Urgent' etc.
        const emoji = urgency === 'Critical' ? '🚨' : urgency === 'Urgent' ? '⚠️' : 'ℹ️';

        // Import dynamically to avoid circle deps or server interactions in client files (though this file seems shared)
        const { sendPushNotification } = require('@/lib/services/firebasePush');

        await sendPushNotification(
          tokenList,
          `${emoji} ${urgency}: ${employees.length} Visa${employees.length > 1 ? 's' : ''} Expiring in ${daysUntilExpiry} Days`,
          `Action Required: Check email for details.`,
          {
            type: 'visa_expiry',
            count: employees.length,
            days: daysUntilExpiry
          }
        );
        log.info(`📲 Automated push notification trigger for ${tokenList.length} devices`);
      }
    } catch (pushError) {
      log.error('Failed to trigger automated push:', pushError);
    }

  } catch (error) {
    log.error('❌ Error sending consolidated visa expiry email:', error);
  }
}

function getUrgencyLevel(daysUntilExpiry: number): string {
  if (daysUntilExpiry <= 1) return 'CRITICAL';
  if (daysUntilExpiry <= 7) return 'URGENT';
  if (daysUntilExpiry <= 15) return 'HIGH';
  if (daysUntilExpiry <= 30) return 'MEDIUM';
  return 'LOW';
}

function getUrgencyColor(daysUntilExpiry: number): string {
  if (daysUntilExpiry <= 1) return '#dc2626';
  if (daysUntilExpiry <= 7) return '#dc2626';
  if (daysUntilExpiry <= 15) return '#ea580c';
  if (daysUntilExpiry <= 30) return '#d97706';
  return '#0284c7';
}

function getUrgencyBackground(daysUntilExpiry: number): string {
  if (daysUntilExpiry <= 1) return '#fef2f2';
  if (daysUntilExpiry <= 7) return '#fef2f2';
  if (daysUntilExpiry <= 15) return '#fff7ed';
  if (daysUntilExpiry <= 30) return '#fffbeb';
  return '#f0f9ff';
}

async function updateNotificationFlagsForBatch(employees: VisaExpiryRecord[], daysUntilExpiry: number): Promise<void> {
  try {
    // First, check if notification columns exist
    const { data: testData, error: testError } = await supabase
      .from('employee_table')
      .select('notification_sent_60')
      .limit(1);

    if (testError && testError.code === '42703') {
      log.info('⚠️ Notification tracking columns do not exist yet. Skipping flag updates.');
      return;
    }

    const employeeIds = employees.map(emp => emp.id);
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

    const { error } = await (supabase as any)
      .from('employee_table')
      .update(updateData)
      .in('id', employeeIds);

    if (error) {
      log.error('❌ Error updating notification flags:', error);
    } else {
      log.info(`✅ Updated notification flags for ${employees.length} employees (${daysUntilExpiry} days)`);
    }
  } catch (error) {
    log.error('❌ Unexpected error updating notification flags:', error);
  }
}

// Function to manually trigger visa expiry check
export async function triggerVisaExpiryCheck(): Promise<void> {
  log.info('🔄 Manually triggering visa expiry check...');
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
    // First, check if notification columns exist
    const { data: testData, error: testError } = await supabase
      .from('employee_table')
      .select('notification_sent_60')
      .limit(1);

    let employees;
    let error;

    if (testError && testError.code === '42703') {
      log.info('⚠️ Notification tracking columns do not exist yet. Using basic stats.');

      // Fallback: get basic employee data without notification tracking
      const result = await supabase
        .from('employee_table')
        .select('visa_expiry_date')
        .not('visa_expiry_date', 'is', null)
        .eq('is_active', true);

      employees = result.data;
      error = result.error;
    } else {
      // If notification columns exist, use full query
      const result = await supabase
        .from('employee_table')
        .select('visa_expiry_date, notification_sent_60, notification_sent_30, notification_sent_15, notification_sent_7, notification_sent_1')
        .not('visa_expiry_date', 'is', null)
        .eq('is_active', true);

      employees = result.data;
      error = result.error;
    }

    if (error) {
      log.error('❌ Error fetching visa expiry stats:', error);
      return { totalEmployees: 0, expiringSoon: 0, expired: 0, notificationsSent: 0 };
    }

    const today = new Date();
    let expiringSoon = 0;
    let expired = 0;
    let notificationsSent = 0;

    employees?.forEach(employee => {
      if ((employee as any).visa_expiry_date && typeof (employee as any).visa_expiry_date === 'string') {
        const daysUntilExpiry = calculateDaysUntilExpiry((employee as any).visa_expiry_date);

        if (daysUntilExpiry < 0) {
          expired++;
        } else if (daysUntilExpiry <= 30) {
          expiringSoon++;
        }

        // Count notifications sent (only if columns exist)
        if ('notification_sent_60' in employee) {
          if ((employee as any).notification_sent_60) notificationsSent++;
          if ((employee as any).notification_sent_30) notificationsSent++;
          if ((employee as any).notification_sent_15) notificationsSent++;
          if ((employee as any).notification_sent_7) notificationsSent++;
          if ((employee as any).notification_sent_1) notificationsSent++;
        }
      }
    });

    return {
      totalEmployees: employees?.length || 0,
      expiringSoon,
      expired,
      notificationsSent
    };
  } catch (error) {
    log.error('❌ Error getting visa expiry stats:', error);
    return { totalEmployees: 0, expiringSoon: 0, expired: 0, notificationsSent: 0 };
  }
} 