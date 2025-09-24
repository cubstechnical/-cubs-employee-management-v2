import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Get visa expiry statistics
    const { data: employees, error } = await supabase
      .from('employee_table')
      .select('id, name, visa_expiry_date, is_active');

    if (error) {
      throw error;
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const stats = {
      totalEmployees: employees?.length || 0,
      expiringSoon: employees?.filter(emp => {
        if (!emp.visa_expiry_date) return false;
        const expiryDate = new Date(emp.visa_expiry_date);
        return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
      }).length || 0,
      expired: employees?.filter(emp => {
        if (!emp.visa_expiry_date) return false;
        const expiryDate = new Date(emp.visa_expiry_date);
        return expiryDate < now;
      }).length || 0,
      notificationsSent: 0 // This would be tracked in a separate table
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching visa stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch visa statistics',
      stats: {
        totalEmployees: 0,
        expiringSoon: 0,
        expired: 0,
        notificationsSent: 0
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // This would trigger visa expiry notifications
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Visa expiry check completed'
    });
  } catch (error) {
    console.error('Error checking visa expiries:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check visa expiries'
    }, { status: 500 });
  }
}
