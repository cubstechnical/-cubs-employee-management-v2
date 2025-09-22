import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/email-server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Email service is configured and ready',
      configuration: {
        fromEmail: 'technicalcubs@gmail.com',
        toEmail: 'info@cubstechnical.com',
        service: 'Gmail SMTP',
        status: 'Active'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toEmail = 'info@cubstechnical.com' } = body;
    
    console.log('📧 Sending test email to:', toEmail);
    
    const result = await EmailService.testEmail(toEmail);
    
    if (result.success) {
      console.log('✅ Test email sent successfully');
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${toEmail}`,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Test email failed:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send test email',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Error in test email API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}