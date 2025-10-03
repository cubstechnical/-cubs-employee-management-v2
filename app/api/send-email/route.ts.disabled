import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { log } from '@/lib/utils/logger';

// Force static generation for mobile builds
export const dynamic = 'force-static';

// Create transporter for Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, message, type = 'info' } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, message' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const transporter = createTransporter();

    // Create email content based on type
    let htmlContent = '';
    let textContent = '';

    switch (type) {
      case 'visa_expiry':
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #d3194f; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">CUBS Employee Management</h1>
              <p style="margin: 5px 0 0 0; font-size: 16px;">Visa Expiry Alert</p>
            </div>
            <div style="padding: 30px; background: #f8fafc;">
              <h2 style="color: #d3194f; margin-top: 0;">Visa Expiry Notification</h2>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #d3194f;">
                <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.5;">${message}</p>
                <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">
                  This is an automated notification from the CUBS Employee Management System.
                </p>
              </div>
              <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>Action Required:</strong> Please review the visa status and take necessary actions.
                </p>
              </div>
            </div>
            <div style="background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
              <p style="margin: 0;">© 2025 CUBS Technical. All rights reserved.</p>
              <p style="margin: 5px 0 0 0;">This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        `;
        textContent = `CUBS Employee Management - Visa Expiry Alert\n\n${message}\n\nThis is an automated notification from the CUBS Employee Management System.\n\nAction Required: Please review the visa status and take necessary actions.\n\n© 2025 CUBS Technical. All rights reserved.`;
        break;

      case 'test':
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #d3194f; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">CUBS Employee Management</h1>
              <p style="margin: 5px 0 0 0; font-size: 16px;">Test Email</p>
            </div>
            <div style="padding: 30px; background: #f8fafc;">
              <h2 style="color: #d3194f; margin-top: 0;">Email Service Test</h2>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
                <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.5;">${message}</p>
                <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">
                  This is a test email to verify that the email service is working correctly.
                </p>
              </div>
              <div style="margin-top: 20px; padding: 15px; background: #d1fae5; border: 1px solid #a7f3d0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #065f46;">
                  <strong>✅ Email Service Status:</strong> Working correctly
                </p>
              </div>
            </div>
            <div style="background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
              <p style="margin: 0;">© 2025 CUBS Technical. All rights reserved.</p>
              <p style="margin: 5px 0 0 0;">This is a test message. Please do not reply to this email.</p>
            </div>
          </div>
        `;
        textContent = `CUBS Employee Management - Test Email\n\n${message}\n\nThis is a test email to verify that the email service is working correctly.\n\n✅ Email Service Status: Working correctly\n\n© 2025 CUBS Technical. All rights reserved.`;
        break;

      default:
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #d3194f; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">CUBS Employee Management</h1>
            </div>
            <div style="padding: 30px; background: #f8fafc;">
              <h2 style="color: #d3194f; margin-top: 0;">Notification</h2>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #d3194f;">
                <p style="margin: 0; font-size: 16px; line-height: 1.5;">${message}</p>
              </div>
            </div>
            <div style="background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
              <p style="margin: 0;">© 2025 CUBS Technical. All rights reserved.</p>
            </div>
          </div>
        `;
        textContent = `CUBS Employee Management\n\n${message}\n\n© 2025 CUBS Technical. All rights reserved.`;
    }

    const mailOptions = {
      from: {
        name: process.env.GMAIL_FROM_NAME || 'CUBS Technical',
        address: process.env.GMAIL_USER || 'technicalcubs@gmail.com'
      },
      to: to,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    log.info('Sending email:', { to, subject, type });

    const result = await transporter.sendMail(mailOptions);

    log.info('Email sent successfully:', { messageId: result.messageId });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully'
    });

  } catch (error) {
    log.error('Email sending error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
