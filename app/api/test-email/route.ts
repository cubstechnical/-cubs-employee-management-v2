import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/email';

export async function GET() {
  return NextResponse.json({
    message: 'Email service test endpoint',
    service: 'Gmail SMTP',
    from: 'technicalcubs@gmail.com',
    to: 'info@cubstechnical.com',
    status: 'Ready for testing'
  });
}

export async function POST(request: NextRequest) {
  try {
    const { email = 'info@cubstechnical.com' } = await request.json();

    console.log('🧪 Testing Gmail SMTP Email Service...');
    console.log('📧 From: technicalcubs@gmail.com');
    console.log('📧 To:', email);
    console.log('🔧 Service: Gmail SMTP');

    const result = await EmailService.testEmail(email);

    if (result.success) {
      console.log('✅ Email test successful');
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        service: 'Gmail SMTP',
        from: 'technicalcubs@gmail.com',
        to: email,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Email test failed:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
        service: 'Gmail SMTP',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Email test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'Gmail SMTP',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

