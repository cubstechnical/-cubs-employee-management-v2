import { NextRequest, NextResponse } from 'next/server';
import { EdgeFunctionService } from '@/lib/services/edgeFunctions';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Checking visa expiry notifications...');
    
    const result = await EdgeFunctionService.checkVisaExpiryNotifications();
    
    if (result.error) {
      console.error('❌ Visa check error:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    console.log(`✅ Visa check completed. Found ${result.notifications?.length || 0} notifications`);
    
    return NextResponse.json({
      success: true,
      notifications: result.notifications || [],
      count: result.notifications?.length || 0
    });
  } catch (error) {
    console.error('❌ Exception in visa check:', error);
    return NextResponse.json(
      { error: 'Failed to check visa notifications' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log('🔍 Manual visa expiry check triggered...');
    
    const result = await EdgeFunctionService.checkVisaExpiryNotifications();
    
    if (result.error) {
      console.error('❌ Visa check error:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    console.log(`✅ Manual visa check completed. Found ${result.notifications?.length || 0} notifications`);
    
    return NextResponse.json({
      success: true,
      message: 'Visa expiry check completed successfully',
      notifications: result.notifications || [],
      count: result.notifications?.length || 0
    });
  } catch (error) {
    console.error('❌ Exception in manual visa check:', error);
    return NextResponse.json(
      { error: 'Failed to check visa notifications' },
      { status: 500 }
    );
  }
} 