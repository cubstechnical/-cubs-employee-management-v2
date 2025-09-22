import { NextRequest, NextResponse } from 'next/server';
import { triggerVisaExpiryCheck, getVisaExpiryStats } from '@/lib/services/visaNotifications';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching visa expiry statistics...');
    
    const stats = await getVisaExpiryStats();
    
    return NextResponse.json({
      success: true,
      message: 'Visa expiry statistics retrieved successfully',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching visa expiry stats:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Manually triggering visa expiry notification check...');
    
    // Trigger the visa expiry check
    await triggerVisaExpiryCheck();
    
    // Get updated stats
    const stats = await getVisaExpiryStats();
    
    console.log('✅ Manual visa expiry notification check completed');
    
    return NextResponse.json({
      success: true,
      message: 'Visa expiry notification check completed successfully',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in manual visa expiry notification check:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}