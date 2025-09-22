import { NextRequest, NextResponse } from 'next/server';

interface ErrorReport {
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  errorInfo: {
    componentStack: string;
  };
  userAgent: string;
  url: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ErrorReport = await request.json();

    // Validate the error report
    if (!body.error || !body.error.message) {
      return NextResponse.json(
        { error: 'Invalid error report format' },
        { status: 400 }
      );
    }

    // Log the error (in production, you might want to send this to a logging service)
    console.error('Error Report Received:', {
      error: body.error,
      errorInfo: body.errorInfo,
      userAgent: body.userAgent,
      url: body.url,
      timestamp: body.timestamp,
    });

    // In production, you might want to:
    // 1. Send to a logging service (e.g., Sentry, LogRocket)
    // 2. Store in a database for analysis
    // 3. Send notifications to the development team
    // 4. Rate limit error reports to prevent spam

    // For now, we'll just log it and return success
    // You can extend this based on your needs

    return NextResponse.json(
      { 
        success: true, 
        message: 'Error report received',
        errorId: `${body.error.name}-${Date.now()}`
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing error report:', error);
    
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}

