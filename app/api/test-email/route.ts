import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toEmail } = body;

    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || 'technicalcubs@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.GMAIL_USER || 'technicalcubs@gmail.com',
      to: toEmail || 'info@cubstechnical.com',
      subject: 'CUBS Employee Management - Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d3194f;">CUBS Employee Management System</h2>
          <p>This is a test email from the CUBS Employee Management system.</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Email Service: Gmail SMTP</li>
            <li>Sent At: ${new Date().toLocaleString()}</li>
            <li>System: CUBS Employee Management</li>
          </ul>
          <p>If you received this email, the notification system is working correctly.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            CUBS Technical - Group of Companies<br>
            UAE • QATAR • OMAN • KSA
          </p>
        </div>
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Test email sent:', info.messageId);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send test email. Please check SMTP configuration.'
    }, { status: 500 });
  }
}
