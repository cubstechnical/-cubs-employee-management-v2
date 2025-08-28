const { EmailService } = require('../lib/services/email.ts');

async function testEmail() {
  try {
    console.log('🧪 Testing Gmail SMTP Email Service...');
    console.log('📧 From: technicalcubs@gmail.com');
    console.log('📧 To: info@cubstechnical.com');
    console.log('🔧 Service: Gmail SMTP');

    const result = await EmailService.testEmail('info@cubstechnical.com');

    if (result.success) {
      console.log('✅ Email test successful');
      console.log('📧 Email sent to: info@cubstechnical.com');
      console.log('🔧 Service: Gmail SMTP');
      console.log('⏰ Timestamp:', new Date().toISOString());
    } else {
      console.error('❌ Email test failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Email test error:', error);
    process.exit(1);
  }
}

testEmail();

