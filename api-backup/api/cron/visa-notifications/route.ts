import { NextRequest, NextResponse } from 'next/server';
import { VisaNotificationService } from '@/lib/services/visaNotifications';
import { handleApiError } from '@/lib/api/middleware';

// POST /api/cron/visa-notifications - Automated visa expiry notification check
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to ensure this is called by the cron service
    const authHeader = request.headers.get('authorization');
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;
    
    if (authHeader !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Trigger visa expiry notification check
    await VisaNotificationService.checkAndSendVisaExpiryNotifications();

    return NextResponse.json({
      success: true,
      message: 'Visa expiry notification check completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return handleApiError(error);
  }
}

// GET /api/cron/visa-notifications - Manual trigger (for testing)
export async function GET(request: NextRequest) {
  try {
    // This endpoint can be used for manual testing
    // In production, you might want to add additional security
    
    await VisaNotificationService.checkAndSendVisaExpiryNotifications();

    return NextResponse.json({
      success: true,
      message: 'Visa expiry notification check completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Manual trigger error:', error);
    return handleApiError(error);
  }
} 