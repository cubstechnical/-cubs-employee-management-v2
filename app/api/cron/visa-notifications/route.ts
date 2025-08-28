import { NextRequest, NextResponse } from 'next/server';
import { checkAndSendVisaExpiryNotifications } from '@/lib/services/visaNotifications';

// POST /api/cron/visa-notifications - Automated visa expiry notification check
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting automated visa expiry notification check...');
    
    // Check and send visa expiry notifications
    await checkAndSendVisaExpiryNotifications();
    
    console.log('✅ Visa expiry notification check completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Visa expiry notifications processed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in visa notifications cron job:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET /api/cron/visa-notifications - Manual trigger for testing
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Manual visa expiry notification check triggered...');
    
    // Check and send visa expiry notifications
    await checkAndSendVisaExpiryNotifications();
    
    console.log('✅ Manual visa expiry notification check completed');
    
    return NextResponse.json({
      success: true,
      message: 'Manual visa expiry notification check completed',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in manual visa notifications check:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

