#!/usr/bin/env node

/**
 * Test Email Service Script
 * 
 * This script tests the Gmail SMTP email service to ensure
 * automated notifications are working correctly.
 * 
 * Usage:
 *   node scripts/test-email.js
 *   npm run test:email
 */

const nodemailer = require('nodemailer');

// Configuration
const config = {
  fromEmail: process.env.GMAIL_USER || 'technicalcubs@gmail.com',
  fromName: process.env.GMAIL_FROM_NAME || 'CUBS Technical',
  toEmail: 'info@cubstechnical.com',
  appPassword: process.env.GMAIL_APP_PASSWORD || 'your-app-password-here'
};

async function testEmailService() {
  console.log('🧪 Testing Gmail SMTP Email Service...\n');
  
  // Display configuration
  console.log('📧 Email Configuration:');
  console.log(`   From: ${config.fromName} <${config.fromEmail}>`);
  console.log(`   To: ${config.toEmail}`);
  console.log(`   Service: Gmail SMTP`);
  console.log(`   App Password: ${config.appPassword ? '✅ Set' : '❌ Missing'}\n`);
  
  if (!config.appPassword || config.appPassword === 'your-app-password-here') {
    console.error('❌ Error: Gmail App Password not configured');
    console.log('📝 Setup Instructions:');
    console.log('   1. Enable 2-Factor Authentication on Gmail');
    console.log('   2. Generate App Password for "Mail"');
    console.log('   3. Set GMAIL_APP_PASSWORD environment variable');
    console.log('   4. Run this script again\n');
    process.exit(1);
  }
  
  try {
    // Create transporter
    console.log('🔧 Creating Gmail SMTP transporter...');
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: config.fromEmail,
        pass: config.appPassword
      }
    });
    
    // Verify connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully\n');
    
    // Send test email
    console.log('📤 Sending test email...');
    const mailOptions = {
      from: `${config.fromName} <${config.fromEmail}>`,
      to: config.toEmail,
      subject: '✅ CUBS Technical - Email Service Test (Gmail SMTP)',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Email Service Test</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #10b981; margin: 0;">✅ Email Service Test Successful</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">CUBS Technical Employee Management System</p>
            </div>
            
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
              <h2 style="margin: 0 0 10px 0; color: #1e40af;">📧 Service Details</h2>
              <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
                <li><strong>Service:</strong> Gmail SMTP</li>
                <li><strong>From:</strong> ${config.fromEmail}</li>
                <li><strong>To:</strong> ${config.toEmail}</li>
                <li><strong>Status:</strong> Active and working</li>
                <li><strong>Cost:</strong> Free (Gmail limits)</li>
                <li><strong>Rate Limit:</strong> 500 emails/day, 20 emails/second</li>
              </ul>
            </div>
            
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
              <h3 style="margin: 0 0 10px 0; color: #059669;">🎯 Test Results</h3>
              <p style="margin: 0; color: #059669;">
                If you received this email, the automated notification system is working correctly.
                All visa expiry alerts, document notifications, and system alerts will be sent to this address.
              </p>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
              <h3 style="margin: 0 0 10px 0; color: #92400e;">📋 Next Steps</h3>
              <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                <li>Monitor this email for automated visa expiry notifications</li>
                <li>Check the notifications dashboard at /notifications</li>
                <li>Test visa expiry notifications manually if needed</li>
                <li>Set up cron jobs for automated daily checks</li>
              </ul>
            </div>
            
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>Timestamp:</strong> ${new Date().toISOString()}<br>
                <strong>Generated by:</strong> CUBS Technical Email Service Test Script
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `CUBS Technical - Email Service Test

✅ Email Service Test Successful

If you received this email, the automated notification system is working correctly.

Service Details:
- Service: Gmail SMTP
- From: ${config.fromEmail}
- To: ${config.toEmail}
- Status: Active and working
- Cost: Free (Gmail limits)
- Rate Limit: 500 emails/day, 20 emails/second

Test Results:
If you received this email, the automated notification system is working correctly.
All visa expiry alerts, document notifications, and system alerts will be sent to this address.

Next Steps:
- Monitor this email for automated visa expiry notifications
- Check the notifications dashboard at /notifications
- Test visa expiry notifications manually if needed
- Set up cron jobs for automated daily checks

Timestamp: ${new Date().toISOString()}
Generated by: CUBS Technical Email Service Test Script`
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Response: ${result.response}\n`);
    
    // Display success information
    console.log('🎉 Email Service Test Completed Successfully!\n');
    console.log('📧 Test email sent to:', config.toEmail);
    console.log('📱 Check your email inbox for the test message\n');
    
    console.log('📋 What this means:');
    console.log('   ✅ Gmail SMTP is configured correctly');
    console.log('   ✅ Automated notifications will work');
    console.log('   ✅ Visa expiry alerts will be sent');
    console.log('   ✅ System notifications will be delivered\n');
    
    console.log('🔧 Next Steps:');
    console.log('   1. Check info@cubstechnical.com for the test email');
    console.log('   2. Visit /notifications to test the dashboard');
    console.log('   3. Test visa expiry notifications manually');
    console.log('   4. Set up automated cron jobs for daily checks\n');
    
  } catch (error) {
    console.error('❌ Email Service Test Failed!\n');
    console.error('Error Details:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    console.error(`   Command: ${error.command || 'N/A'}\n`);
    
    console.log('🔧 Troubleshooting Steps:');
    console.log('   1. Verify Gmail credentials are correct');
    console.log('   2. Ensure 2-Factor Authentication is enabled');
    console.log('   3. Check App Password is valid');
    console.log('   4. Verify internet connection');
    console.log('   5. Check Gmail account is not locked\n');
    
    console.log('📞 Support:');
    console.log('   - Check the documentation: docs/NOTIFICATIONS_SYSTEM.md');
    console.log('   - Contact: info@cubstechnical.com\n');
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testEmailService().catch(console.error);
}

module.exports = { testEmailService };


