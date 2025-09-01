import { NextRequest, NextResponse } from 'next/server';
import { checkAndSendVisaExpiryNotifications } from '@/lib/services/visaNotifications';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing visa expiry notifications...');
    
    // Run the visa expiry check
    await checkAndSendVisaExpiryNotifications();
    
    return NextResponse.json({
      success: true,
      message: 'Visa expiry notification test completed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error testing visa notifications:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Visa notification test endpoint',
    usage: 'Send POST request to test visa expiry notifications',
    endpoint: '/api/test-visa-notifications'
  });
}
