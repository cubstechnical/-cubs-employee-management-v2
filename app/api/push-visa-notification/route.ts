import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/utils/productionLogger';

// Allow dynamic execution for API routes
export const dynamic = 'force-dynamic';

/**
 * This endpoint is called from the client-side to trigger push notifications
 * Push notifications must run in the browser context, so we return instructions
 * for the client to handle
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeCount, daysRemaining, urgency } = body;

    if (!employeeCount || !daysRemaining || !urgency) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: employeeCount, daysRemaining, urgency' },
        { status: 400 }
      );
    }

    log.info('Push notification request received:', { employeeCount, daysRemaining, urgency });

    // Return success - the actual push notification will be sent client-side
    // This endpoint just validates the request
    return NextResponse.json({
      success: true,
      message: 'Push notification will be sent client-side',
      data: {
        employeeCount,
        daysRemaining,
        urgency
      }
    });

  } catch (error) {
    log.error('Push notification API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

