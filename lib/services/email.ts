import sgMail from '@sendgrid/mail';

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface DocumentExpiryData {
  employeeName: string;
  employeeEmail: string;
  documentName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  documentType: string;
}

export interface VisaExpiryData {
  employeeName: string;
  employeeEmail: string;
  visaType: string;
  expiryDate: string;
  daysUntilExpiry: number;
  companyName: string;
}

export interface VisaExpiryNotification {
  employeeName: string;
  employeeEmail: string;
  visaExpiryDate: string;
  daysRemaining: number;
  visaType: string;
  companyName: string;
}

export interface ApprovalNotificationData {
  recipientEmail: string;
  recipientName: string;
  adminName: string;
  action: 'approved' | 'rejected';
  reason?: string;
}

export interface AdminNotificationData {
  recipientEmail: string;
  recipientName: string;
  adminName: string;
  action: string;
  details?: string;
}

export class EmailService {
  private static fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@cubstechnical.com';
  private static fromName = process.env.SENDGRID_FROM_NAME || 'CUBS Technical';

  // Send a generic email
  static async sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const msg = {
        to: 'info@cubstechnical.com',
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: emailData.subject,
        text: emailData.text || '',
        html: emailData.html,
      };

      await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  // Send admin approval notification
  static async sendApprovalNotification(data: ApprovalNotificationData): Promise<{ success: boolean; error?: string }> {
    const status = data.action === 'approved' ? 'Approved' : 'Rejected';
    const color = data.action === 'approved' ? '#10b981' : '#ef4444';
    const icon = data.action === 'approved' ? '✅' : '❌';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin ${status}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">CUBS Technical</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Employee Management System</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: ${color}; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 18px;">${icon} Admin Request ${status}</h2>
          </div>
          
          <p>Dear <strong>${data.recipientName}</strong>,</p>
          
          <p>Your admin access request has been <strong>${data.action}</strong> by <strong>${data.adminName}</strong>.</p>
          
          ${data.reason ? `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${color};">
            <h3 style="margin: 0 0 10px 0; color: #333;">Reason:</h3>
            <p style="margin: 0; color: #666;">${data.reason}</p>
          </div>
          ` : ''}
          
          <p>If you have any questions, please contact the system administrator.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cubstechnical.com'}" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access System
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            This is an automated message from CUBS Technical Employee Management System.<br>
            Please do not reply to this email.
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `
Admin Request ${status}

Dear ${data.recipientName},

Your admin access request has been ${data.action} by ${data.adminName}.

${data.reason ? `Reason: ${data.reason}` : ''}

If you have any questions, please contact the system administrator.

Best regards,
CUBS Technical Team
    `;

    return this.sendEmail({
      to: data.recipientEmail,
      subject: `Admin Access ${status} - CUBS Technical`,
      html,
      text,
    });
  }

  // Send admin notification
  static async sendAdminNotification(data: AdminNotificationData): Promise<{ success: boolean; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Notification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">CUBS Technical</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Employee Management System</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: #3b82f6; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 18px;">🔔 Admin Notification</h2>
          </div>
          
          <p>Dear <strong>${data.recipientName}</strong>,</p>
          
          <p>This is a notification regarding an admin action performed by <strong>${data.adminName}</strong>.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Action Details:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Action:</strong> ${data.action}</li>
              ${data.details ? `<li><strong>Details:</strong> ${data.details}</li>` : ''}
              <li><strong>Performed by:</strong> ${data.adminName}</li>
              <li><strong>Timestamp:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>
          
          <p>If you have any questions or concerns, please contact the system administrator.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cubstechnical.com'}" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access System
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            This is an automated message from CUBS Technical Employee Management System.<br>
            Please do not reply to this email.
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `
Admin Notification

Dear ${data.recipientName},

This is a notification regarding an admin action performed by ${data.adminName}.

Action Details:
- Action: ${data.action}
${data.details ? `- Details: ${data.details}` : ''}
- Performed by: ${data.adminName}
- Timestamp: ${new Date().toLocaleString()}

If you have any questions or concerns, please contact the system administrator.

Best regards,
CUBS Technical Team
    `;

    return this.sendEmail({
      to: data.recipientEmail,
      subject: `Admin Notification - ${data.action} - CUBS Technical`,
      html,
      text,
    });
  }

  // Send document expiry notification
  static async sendDocumentExpiryNotification(data: DocumentExpiryData): Promise<{ success: boolean; error?: string }> {
    const urgency = data.daysUntilExpiry <= 7 ? 'URGENT' : 'Warning';
    const color = data.daysUntilExpiry <= 7 ? '#dc2626' : '#f59e0b';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document Expiry ${urgency}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">CUBS Technical</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Employee Management System</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: ${color}; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 18px;">⚠️ Document Expiry ${urgency}</h2>
          </div>
          
          <p>Dear <strong>${data.employeeName}</strong>,</p>
          
          <p>This is an automated notification regarding your document that is expiring soon:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${color};">
            <h3 style="margin: 0 0 10px 0; color: #333;">Document Details:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Document Type:</strong> ${data.documentType}</li>
              <li><strong>Document Name:</strong> ${data.documentName}</li>
              <li><strong>Expiry Date:</strong> ${data.expiryDate}</li>
              <li><strong>Days Until Expiry:</strong> ${data.daysUntilExpiry} day${data.daysUntilExpiry !== 1 ? 's' : ''}</li>
            </ul>
          </div>
          
          <p style="color: ${color}; font-weight: bold;">
            ${data.daysUntilExpiry <= 7 
              ? '⚠️ URGENT: Please renew this document immediately to avoid any issues.' 
              : 'Please ensure this document is renewed before the expiry date.'}
          </p>
          
          <p>If you have any questions or need assistance, please contact your HR department.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cubstechnical.com'}" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access Employee Portal
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            This is an automated message from CUBS Technical Employee Management System.<br>
            Please do not reply to this email.
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `
Document Expiry ${urgency}

Dear ${data.employeeName},

This is an automated notification regarding your document that is expiring soon:

Document Details:
- Document Type: ${data.documentType}
- Document Name: ${data.documentName}
- Expiry Date: ${data.expiryDate}
- Days Until Expiry: ${data.daysUntilExpiry} day${data.daysUntilExpiry !== 1 ? 's' : ''}

${data.daysUntilExpiry <= 7 
  ? '⚠️ URGENT: Please renew this document immediately to avoid any issues.' 
  : 'Please ensure this document is renewed before the expiry date.'}

If you have any questions or need assistance, please contact your HR department.

Best regards,
CUBS Technical Team
    `;

    return this.sendEmail({
      to: data.employeeEmail,
      subject: `[${urgency}] Document Expiry Alert - ${data.documentName}`,
      html,
      text,
    });
  }

  // Send visa expiry notification
  static async sendVisaExpiryNotification(data: VisaExpiryData): Promise<{ success: boolean; error?: string }> {
    const urgency = data.daysUntilExpiry <= 30 ? 'URGENT' : 'Warning';
    const color = data.daysUntilExpiry <= 30 ? '#dc2626' : '#f59e0b';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Visa Expiry ${urgency}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">CUBS Technical</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Employee Management System</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: ${color}; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 18px;">🛂 Visa Expiry ${urgency}</h2>
          </div>
          
          <p>Dear <strong>${data.employeeName}</strong>,</p>
          
          <p>This is an automated notification regarding your visa that is expiring soon:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${color};">
            <h3 style="margin: 0 0 10px 0; color: #333;">Visa Details:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Visa Type:</strong> ${data.visaType}</li>
              <li><strong>Company:</strong> ${data.companyName}</li>
              <li><strong>Expiry Date:</strong> ${data.expiryDate}</li>
              <li><strong>Days Until Expiry:</strong> ${data.daysUntilExpiry} day${data.daysUntilExpiry !== 1 ? 's' : ''}</li>
            </ul>
          </div>
          
          <p style="color: ${color}; font-weight: bold;">
            ${data.daysUntilExpiry <= 30 
              ? '⚠️ URGENT: Please contact your HR department immediately to initiate visa renewal process.' 
              : 'Please ensure visa renewal process is initiated before the expiry date.'}
          </p>
          
          <p>This is a critical matter that requires immediate attention to avoid any legal issues.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cubstechnical.com'}" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access Employee Portal
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            This is an automated message from CUBS Technical Employee Management System.<br>
            Please do not reply to this email.
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `
Visa Expiry ${urgency}

Dear ${data.employeeName},

This is an automated notification regarding your visa that is expiring soon:

Visa Details:
- Visa Type: ${data.visaType}
- Company: ${data.companyName}
- Expiry Date: ${data.expiryDate}
- Days Until Expiry: ${data.daysUntilExpiry} day${data.daysUntilExpiry !== 1 ? 's' : ''}

${data.daysUntilExpiry <= 30 
  ? '⚠️ URGENT: Please contact your HR department immediately to initiate visa renewal process.' 
  : 'Please ensure visa renewal process is initiated before the expiry date.'}

This is a critical matter that requires immediate attention to avoid any legal issues.

Best regards,
CUBS Technical Team
    `;

    return this.sendEmail({
      to: 'info@cubstechnical.com',
      subject: `[${urgency}] Visa Expiry Alert - ${data.visaType}`,
      html,
      text,
    });
  }

  // Send bulk notifications
  static async sendBulkNotifications(
    notifications: (DocumentExpiryData | VisaExpiryData)[]
  ): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
    const results = {
      success: true,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const notification of notifications) {
      try {
        let result;
        
        if ('documentType' in notification) {
          result = await this.sendDocumentExpiryNotification(notification);
        } else {
          result = await this.sendVisaExpiryNotification(notification);
        }

        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(result.error || 'Unknown error');
        }
      } catch (error) {
        results.failed++;
        results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    if (results.failed > 0) {
      results.success = false;
    }

    return results;
  }

  // Test email service
  static async testEmail(toEmail: string): Promise<{ success: boolean; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Email Service Test</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1>✅ Email Service Test Successful</h1>
        <p>This is a test email from CUBS Technical Employee Management System.</p>
        <p>If you received this email, the email notification service is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: toEmail,
      subject: 'CUBS Technical - Email Service Test',
      html,
      text: 'Email service test successful. If you received this email, the notification service is working correctly.',
    });
  }
}

export default EmailService; 