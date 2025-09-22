import { NextRequest, NextResponse } from 'next/server';
import { checkAndSendVisaExpiryNotifications } from '@/lib/services/visaNotifications';

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a cron service or has proper authentication
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-cron-secret-here';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting automated visa expiry notification check...');
    
    // Run the visa expiry notification check
    await checkAndSendVisaExpiryNotifications();
    
    console.log('✅ Automated visa expiry notification check completed');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Visa expiry notifications processed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in visa expiry notification cron job:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Allow POST requests as well for manual triggers
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Manual visa expiry notification check triggered...');
    
    // Run the visa expiry notification check
    await checkAndSendVisaExpiryNotifications();
    
    console.log('✅ Manual visa expiry notification check completed');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Visa expiry notifications processed successfully',
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