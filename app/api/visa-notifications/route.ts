import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { log } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    log.info('Starting visa expiry notification process...');

    // Get employees with visa expiry dates
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, name, email, visa_expiry_date, company_name, passport_number')
      .not('visa_expiry_date', 'is', null)
      .not('visa_expiry_date', 'eq', '');

    if (error) {
      log.error('Failed to fetch employees for visa notifications:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch employee data' },
        { status: 500 }
      );
    }

    if (!employees || employees.length === 0) {
      log.info('No employees with visa expiry dates found');
      return NextResponse.json({
        success: true,
        message: 'No employees with visa expiry dates found',
        notifications_sent: 0,
        expiring_soon: 0,
        expired: 0
      });
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const expiringSoon = employees.filter(emp => {
      const expiryDate = new Date(emp.visa_expiry_date);
      return expiryDate > now && expiryDate <= thirtyDaysFromNow;
    });

    const expired = employees.filter(emp => {
      const expiryDate = new Date(emp.visa_expiry_date);
      return expiryDate < now;
    });

    log.info('Visa expiry analysis:', {
      total_employees: employees.length,
      expiring_soon: expiringSoon.length,
      expired: expired.length
    });

    let notificationsSent = 0;
    const notificationResults = [];

    // Send notifications for expiring visas
    for (const employee of expiringSoon) {
      try {
        const daysUntilExpiry = Math.ceil((new Date(employee.visa_expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        const subject = `Visa Expiry Alert - ${employee.name} (${daysUntilExpiry} days remaining)`;
        const message = `
          Employee: ${employee.name}
          Company: ${employee.company_name}
          Passport: ${employee.passport_number || 'Not provided'}
          Visa Expiry Date: ${new Date(employee.visa_expiry_date).toLocaleDateString()}
          Days Remaining: ${daysUntilExpiry}
          
          This employee's visa will expire in ${daysUntilExpiry} days. Please take necessary action to renew or extend the visa.
        `;

        // Send email notification
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: 'info@cubstechnical.com',
            subject: subject,
            message: message,
            type: 'visa_expiry'
          }),
        });

        if (emailResponse.ok) {
          notificationsSent++;
          notificationResults.push({
            employee: employee.name,
            status: 'sent',
            days_remaining: daysUntilExpiry
          });

          // Log notification in database
          await supabase
            .from('notifications')
            .insert({
              title: `Visa Expiry Alert - ${employee.name}`,
              message: `Visa expires in ${daysUntilExpiry} days`,
              type: 'warning',
              user_id: 'system',
              category: 'visa',
              created_at: new Date().toISOString()
            });

          log.info(`Visa expiry notification sent for ${employee.name} (${daysUntilExpiry} days remaining)`);
        } else {
          notificationResults.push({
            employee: employee.name,
            status: 'failed',
            error: 'Email sending failed'
          });
          log.error(`Failed to send visa expiry notification for ${employee.name}`);
        }
      } catch (error) {
        log.error(`Error processing visa notification for ${employee.name}:`, error);
        notificationResults.push({
          employee: employee.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Send notifications for expired visas
    for (const employee of expired) {
      try {
        const daysExpired = Math.ceil((now.getTime() - new Date(employee.visa_expiry_date).getTime()) / (1000 * 60 * 60 * 24));
        
        const subject = `URGENT: Visa Expired - ${employee.name} (${daysExpired} days overdue)`;
        const message = `
          Employee: ${employee.name}
          Company: ${employee.company_name}
          Passport: ${employee.passport_number || 'Not provided'}
          Visa Expiry Date: ${new Date(employee.visa_expiry_date).toLocaleDateString()}
          Days Overdue: ${daysExpired}
          
          URGENT: This employee's visa has expired ${daysExpired} days ago. Immediate action is required to avoid legal complications.
        `;

        // Send email notification
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: 'info@cubstechnical.com',
            subject: subject,
            message: message,
            type: 'visa_expiry'
          }),
        });

        if (emailResponse.ok) {
          notificationsSent++;
          notificationResults.push({
            employee: employee.name,
            status: 'sent',
            days_overdue: daysExpired
          });

          // Log notification in database
          await supabase
            .from('notifications')
            .insert({
              title: `URGENT: Visa Expired - ${employee.name}`,
              message: `Visa expired ${daysExpired} days ago`,
              type: 'error',
              user_id: 'system',
              category: 'visa',
              created_at: new Date().toISOString()
            });

          log.info(`Urgent visa expiry notification sent for ${employee.name} (${daysExpired} days overdue)`);
        } else {
          notificationResults.push({
            employee: employee.name,
            status: 'failed',
            error: 'Email sending failed'
          });
          log.error(`Failed to send urgent visa expiry notification for ${employee.name}`);
        }
      } catch (error) {
        log.error(`Error processing urgent visa notification for ${employee.name}:`, error);
        notificationResults.push({
          employee: employee.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    log.info('Visa notification process completed:', {
      notifications_sent: notificationsSent,
      expiring_soon: expiringSoon.length,
      expired: expired.length,
      total_employees: employees.length
    });

    return NextResponse.json({
      success: true,
      message: 'Visa notification process completed',
      results: {
        notifications_sent: notificationsSent,
        expiring_soon: expiringSoon.length,
        expired: expired.length,
        total_employees: employees.length,
        notification_results: notificationResults
      }
    });

  } catch (error) {
    log.error('Visa notification process error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get visa expiry statistics
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, name, visa_expiry_date, company_name')
      .not('visa_expiry_date', 'is', null)
      .not('visa_expiry_date', 'eq', '');

    if (error) {
      log.error('Failed to fetch visa statistics:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch visa statistics',
          stats: {
            expiring_soon: 0,
            expired: 0,
            total_tracked: 0
          }
        },
        { status: 500 }
      );
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    let expiringSoon = 0;
    let expired = 0;
    const totalTracked = employees?.length || 0;

    employees?.forEach(employee => {
      const expiryDate = new Date(employee.visa_expiry_date);
      
      if (expiryDate < now) {
        expired++;
      } else if (expiryDate <= thirtyDaysFromNow) {
        expiringSoon++;
      }
    });

    const stats = {
      expiring_soon: expiringSoon,
      expired,
      total_tracked: totalTracked,
      last_updated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    log.error('Visa statistics API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        stats: {
          expiring_soon: 0,
          expired: 0,
          total_tracked: 0
        }
      },
      { status: 500 }
    );
  }
}
