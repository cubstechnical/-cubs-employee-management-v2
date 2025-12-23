import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { log } from '@/lib/utils/productionLogger';
import { sendToAllDevices } from '@/lib/services/firebasePush';
import EmailService from '@/lib/services/email';

// Cron secret for security
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
    try {
        // 1. Security Check
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
            log.warn('Unauthorized cron access attempt');
            return new NextResponse('Unauthorized', { status: 401 });
        }

        log.info('🕒 Starting daily visa expiry check (Cron Job)...');

        // 2. Query Employees with Visa Info
        const { data: employees, error } = await supabase
            .from('employee_table')
            .select('employee_id, name, visa_expiry_date, company_name')
            .not('visa_expiry_date', 'is', null)
            .eq('is_active', true);

        if (error) throw error;
        if (!employees || employees.length === 0) {
            log.info('No employees found to check.');
            return NextResponse.json({ success: true, message: 'No employees to check' });
        }

        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        // 3. Filter for Expired and Expiring Soon
        const expired = employees.filter(emp => new Date(emp.visa_expiry_date) < now);
        const expiringSoon = employees.filter(emp => {
            const date = new Date(emp.visa_expiry_date);
            return date >= now && date <= thirtyDaysFromNow;
        });

        let notificationsSent = 0;

        // 4. Handle EXPIRED Visas (Critical)
        if (expired.length > 0) {
            log.info(`🚨 Found ${expired.length} expired visas`);

            // Send Push Notification
            await sendToAllDevices(
                '🚨 CRITICAL: Visas Expired',
                `${expired.length} employee(s) have expired visas. Action required immediately.`,
                { type: 'visa_expiry', urgency: 'critical' }
            );

            // Send Email to Admin
            await EmailService.sendEmail({
                to: 'info@cubstechnical.com', // Default admin email
                subject: `🚨 CRITICAL: ${expired.length} Visas Have Expired`,
                html: `
          <h1>Critical Visa Alert</h1>
          <p><strong>${expired.length}</strong> employees have expired visas. Immediate action required.</p>
          <ul>
            ${expired.map(e => `<li>${e.name} (${e.company_name}) - Expired on ${e.visa_expiry_date}</li>`).join('')}
          </ul>
          <p>Please login to the dashboard to renew them immediately.</p>
        `
            });
            notificationsSent++;
        }

        // 5. Handle EXPIRING SOON Visas (Warning)
        if (expiringSoon.length > 0) {
            log.info(`⚠️ Found ${expiringSoon.length} visas expiring soon`);

            // Calculate earliest expiry days for the badge
            const dates = expiringSoon.map(e => new Date(e.visa_expiry_date).getTime());
            const minDate = new Date(Math.min(...dates));
            const daysLeft = Math.ceil((minDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            // Send Push Notification
            await sendToAllDevices(
                '⚠️ Visa Renewals Needed',
                `${expiringSoon.length} employee(s) visas expiring in < 30 days.`,
                { type: 'visa_expiry', urgency: 'urgent' }
            );

            // Send Email to Admin (Digest)
            await EmailService.sendEmail({
                to: 'info@cubstechnical.com',
                subject: `⚠️ Alert: ${expiringSoon.length} Visas Expiring Soon`,
                html: `
          <h1>Visa Renewal Reminder</h1>
          <p><strong>${expiringSoon.length}</strong> employees have visas expiring within 30 days.</p>
          <ul>
            ${expiringSoon.map(e => `<li>${e.name} (${e.company_name}) - Expires: ${e.visa_expiry_date}</li>`).join('')}
          </ul>
        `
            });
            notificationsSent++;
        }

        log.info(`✅ Daily visa check complete. Sent ${notificationsSent} notification sets.`);

        return NextResponse.json({
            success: true,
            processed: employees.length,
            expired: expired.length,
            expiring_soon: expiringSoon.length,
            notifications_sent: notificationsSent
        });

    } catch (error) {
        log.error('❌ Error in daily visa cron:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
