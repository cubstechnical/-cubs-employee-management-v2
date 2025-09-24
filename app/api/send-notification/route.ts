import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notifications';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const result = await NotificationService.sendNotification(data);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Notification sent successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in send-notification API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send notification'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await NotificationService.checkVisaExpiries();
    
    return NextResponse.json({
      success: result.success,
      notificationsSent: result.notificationsSent,
      error: result.error
    });
  } catch (error) {
    console.error('Error in visa expiry check:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check visa expiries'
    }, { status: 500 });
  }
}
