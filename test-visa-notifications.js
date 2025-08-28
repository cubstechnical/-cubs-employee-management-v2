// Test script for visa notifications
// This will send real emails using Gmail SMTP

const { EmailService } = require('./lib/services/email');

async function testVisaNotifications() {
  try {
    console.log('🧪 Testing Visa Expiry Notifications...');
    console.log('📧 This will send a test email to info@cubstechnical.com');
    console.log('🔧 Using Gmail SMTP with your credentials:');
    console.log('   GMAIL_USER=technicalcubs@gmail.com');
    console.log('   GMAIL_APP_PASSWORD=kito hkgc ygfp gzjo');
    console.log('   GMAIL_FROM_NAME=CUBS Technical');
    
    // Send a test email
    const result = await EmailService.testEmail('info@cubstechnical.com');
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('📧 Check info@cubstechnical.com for the email');
      console.log('📧 Subject: CUBS Technical - Email Service Test (Gmail SMTP)');
    } else {
      console.error('❌ Failed to send test email:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing email service:', error);
  }
}

testVisaNotifications();
