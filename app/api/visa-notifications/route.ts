import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { log } from '@/lib/utils/productionLogger';
import { checkAndSendVisaExpiryNotifications } from '@/lib/services/visaNotifications';

// Allow dynamic execution for API routes
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    log.info('Starting visa expiry notification process...');

    // Use the visa notifications service which handles employee_table correctly
    await checkAndSendVisaExpiryNotifications();

    // Get employees with visa expiry dates for stats
    const { data: employees, error } = await supabase
      .from('employee_table')
      .select('id, name, email_id, visa_expiry_date, company_name, passport_number')
      .not('visa_expiry_date', 'is', null)
      .eq('is_active', true);

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
        results: {
          notifications_sent: 0,
          expiring_soon: 0,
          expired: 0,
          total_employees: 0
        }
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

    return NextResponse.json({
      success: true,
      message: 'Visa notification process completed',
      results: {
        notifications_sent: 0, // Service handles sending
        expiring_soon: expiringSoon.length,
        expired: expired.length,
        total_employees: employees.length
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
      .from('employee_table')
      .select('id, name, visa_expiry_date, company_name')
      .not('visa_expiry_date', 'is', null)
      .eq('is_active', true);

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
