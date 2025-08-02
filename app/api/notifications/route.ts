import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, handleApiError } from '@/lib/api/middleware';
import { VisaNotificationService } from '@/lib/services/visaNotifications';

// GET /api/notifications - Get visa expiry alerts and notification stats
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const type = searchParams.get('type'); // 'alerts', 'stats', 'all'
      
      if (type === 'stats') {
        const stats = await VisaNotificationService.getNotificationStats();
        return NextResponse.json({
          success: true,
          data: stats,
        });
      }
      
      if (type === 'alerts') {
        const alerts = await VisaNotificationService.getVisaExpiryAlerts();
        return NextResponse.json({
          success: true,
          data: alerts,
        });
      }
      
      // Default: return both alerts and stats
      const [alerts, stats] = await Promise.all([
        VisaNotificationService.getVisaExpiryAlerts(),
        VisaNotificationService.getNotificationStats(),
      ]);
      
      return NextResponse.json({
        success: true,
        data: {
          alerts,
          stats,
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}

// POST /api/notifications/check - Manually trigger visa expiry check
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await req.json();
      
      if (body.action === 'check_visa_expiry') {
        // Trigger visa expiry notification check
        await VisaNotificationService.checkAndSendVisaExpiryNotifications();
        
        return NextResponse.json({
          success: true,
          message: 'Visa expiry notification check completed',
        });
      }
      
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    } catch (error) {
      return handleApiError(error);
    }
  });
} 