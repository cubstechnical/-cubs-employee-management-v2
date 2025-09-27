import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { log } from '@/lib/utils/logger';

// Required for static export
// Removed for static export compatibility

export async function GET(request: NextRequest) {
  try {
    // Get visa expiration statistics for notifications
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, name, visa_expiry_date, company_name')
      .not('visa_expiry_date', 'is', null)
      .order('visa_expiry_date', { ascending: true });

    if (error) {
      log.error('Failed to fetch visa data:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch visa data',
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
    log.error('Test visa notifications API error:', error);
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

export async function POST(request: NextRequest) {
  try {
    // Trigger visa notification test
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, name, email, visa_expiry_date, company_name')
      .not('visa_expiry_date', 'is', null);

    if (error) {
      log.error('Failed to fetch employees for notification test:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch employee data' },
        { status: 500 }
      );
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const expiringSoon = employees?.filter(emp => {
      const expiryDate = new Date(emp.visa_expiry_date);
      return expiryDate > now && expiryDate <= thirtyDaysFromNow;
    }) || [];

    const expired = employees?.filter(emp => {
      const expiryDate = new Date(emp.visa_expiry_date);
      return expiryDate < now;
    }) || [];

    // In a real implementation, you would send actual notifications here
    log.info('Visa notification test completed', {
      expiring_soon: expiringSoon.length,
      expired: expired.length,
      total_employees: employees?.length || 0
    });

    return NextResponse.json({
      success: true,
      message: 'Visa notification test completed',
      results: {
        expiring_soon: expiringSoon.length,
        expired: expired.length,
        total_employees: employees?.length || 0
      }
    });

  } catch (error) {
    log.error('Visa notification test error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
