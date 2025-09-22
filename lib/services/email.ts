import nodemailer from 'nodemailer';

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
  private static fromEmail = process.env.GMAIL_USER || 'technicalcubs@gmail.com';
  private static fromName = process.env.GMAIL_FROM_NAME || 'CUBS Technical';
  private static toEmail = 'info@cubstechnical.com'; // Always send to this email

  // Create Gmail SMTP transporter
  private static createTransporter() {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || 'technicalcubs@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password-here'
      }
    });
  }

  // Send a generic email using Gmail SMTP
  static async sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const transporter = this.createTransporter();
      
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: this.toEmail,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || '',
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
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
        <title>CUBS Technical - Approval Notification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">CUBS Technical</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Approval Notification</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px;">
            <div style="background: ${data.action === 'approved' ? '#f0fdf4' : '#fef2f2'}; border-left: 4px solid ${color}; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
              <h2 style="margin: 0 0 10px 0; color: ${color};">${icon} ${status}</h2>
              <p style="margin: 0; color: ${color};">Your request has been ${data.action} by ${data.adminName}.</p>
            </div>
            
            <h2 style="color: #374151; margin-bottom: 20px;">📋 Request Details</h2>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                  <strong style="color: #6b7280;">Recipient:</strong><br>
                  ${data.recipientName} (${data.recipientEmail})
                </div>
                <div>
                  <strong style="color: #6b7280;">Admin:</strong><br>
                  ${data.adminName}
                </div>
                <div>
                  <strong style="color: #6b7280;">Status:</strong><br>
                  <span style="background: ${data.action === 'approved' ? '#dcfce7' : '#fee2e2'}; color: ${color}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                    ${status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <strong style="color: #6b7280;">Date:</strong><br>
                  ${new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
            
            ${data.reason ? `
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
                <h3 style="margin: 0 0 10px 0; color: #92400e;">📝 Reason</h3>
                <p style="margin: 0; color: #92400e;">${data.reason}</p>
              </div>
            ` : ''}
            
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1e40af;">📧 Email Service Details</h3>
              <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
                <li><strong>Service:</strong> Gmail SMTP</li>
                <li><strong>From:</strong> ${this.fromEmail}</li>
                <li><strong>To:</strong> ${this.toEmail}</li>
                <li><strong>Status:</strong> Active and working</li>
                <li><strong>Cost:</strong> Free (Gmail limits)</li>
              </ul>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              This is an automated notification from CUBS Technical.<br>
              Generated on: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: data.recipientEmail,
      subject: `${icon} Request ${status} - CUBS Technical`,
      html: html,
      text: `CUBS Technical - Approval Notification

${icon} ${status}

Your request has been ${data.action} by ${data.adminName}.

Request Details:
- Recipient: ${data.recipientName} (${data.recipientEmail})
- Admin: ${data.adminName}
- Status: ${status.toUpperCase()}
- Date: ${new Date().toLocaleDateString()}

${data.reason ? `Reason: ${data.reason}` : ''}

Email Service Details:
- Service: Gmail SMTP
- From: ${this.fromEmail}
- To: ${this.toEmail}
- Status: Active and working
- Cost: Free (Gmail limits)

Generated on: ${new Date().toLocaleString()}`
    });
  }

  // Send admin notification
  static async sendAdminNotification(data: AdminNotificationData): Promise<{ success: boolean; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>CUBS Technical - Admin Notification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">CUBS Technical</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Admin Notification</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px;">
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
              <h2 style="margin: 0 0 10px 0; color: #1e40af;">📢 Admin Notification</h2>
              <p style="margin: 0; color: #1e40af;">A new admin action has been performed in the system.</p>
            </div>
            
            <h2 style="color: #374151; margin-bottom: 20px;">📋 Action Details</h2>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                  <strong style="color: #6b7280;">Recipient:</strong><br>
                  ${data.recipientName} (${data.recipientEmail})
                </div>
                <div>
                  <strong style="color: #6b7280;">Admin:</strong><br>
                  ${data.adminName}
                </div>
                <div>
                  <strong style="color: #6b7280;">Action:</strong><br>
                  <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                    ${data.action.toUpperCase()}
                  </span>
                </div>
                <div>
                  <strong style="color: #6b7280;">Date:</strong><br>
                  ${new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
            
            ${data.details ? `
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
                <h3 style="margin: 0 0 10px 0; color: #92400e;">📝 Details</h3>
                <p style="margin: 0; color: #92400e;">${data.details}</p>
              </div>
            ` : ''}
            
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1e40af;">📧 Email Service Details</h3>
              <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
                <li><strong>Service:</strong> Gmail SMTP</li>
                <li><strong>From:</strong> ${this.fromEmail}</li>
                <li><strong>To:</strong> ${this.toEmail}</li>
                <li><strong>Status:</strong> Active and working</li>
                <li><strong>Cost:</strong> Free (Gmail limits)</li>
              </ul>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              This is an automated notification from CUBS Technical.<br>
              Generated on: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: data.recipientEmail,
      subject: `📢 Admin Action: ${data.action} - CUBS Technical`,
      html: html,
      text: `CUBS Technical - Admin Notification

📢 Admin Notification

A new admin action has been performed in the system.

Action Details:
- Recipient: ${data.recipientName} (${data.recipientEmail})
- Admin: ${data.adminName}
- Action: ${data.action.toUpperCase()}
- Date: ${new Date().toLocaleDateString()}

${data.details ? `Details: ${data.details}` : ''}

Email Service Details:
- Service: Gmail SMTP
- From: ${this.fromEmail}
- To: ${this.toEmail}
- Status: Active and working
- Cost: Free (Gmail limits)

Generated on: ${new Date().toLocaleString()}`
    });
  }

  // Send visa expiry notification
  static async sendVisaExpiryNotification(data: VisaExpiryNotification): Promise<{ success: boolean; error?: string }> {
    const urgencyColor = data.daysRemaining <= 0 ? '#dc2626' :
                        data.daysRemaining <= 7 ? '#dc2626' : 
                        data.daysRemaining <= 30 ? '#ea580c' : '#d97706';
    const urgencyBg = data.daysRemaining <= 0 ? '#fef2f2' :
                     data.daysRemaining <= 7 ? '#fef2f2' : 
                     data.daysRemaining <= 30 ? '#fff7ed' : '#fffbeb';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>CUBS Technical - Visa Expiry Alert</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">CUBS Technical</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Visa Expiry Alert</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px;">
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
              <h2 style="margin: 0 0 10px 0; color: #dc2626;">🚨 Visa Expiry Alert</h2>
              <p style="margin: 0; color: #dc2626;">This is an automated notification regarding employee visa expiries.</p>
            </div>
            
            <h2 style="color: #374151; margin-bottom: 20px;">📋 Employee Details</h2>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                  <strong style="color: #6b7280;">Employee Name:</strong><br>
                  ${data.employeeName}
                </div>
                <div>
                  <strong style="color: #6b7280;">Employee Email:</strong><br>
                  ${data.employeeEmail}
                </div>
                <div>
                  <strong style="color: #6b7280;">Visa Type:</strong><br>
                  ${data.visaType}
                </div>
                <div>
                  <strong style="color: #6b7280;">Company:</strong><br>
                  ${data.companyName}
                </div>
                <div>
                  <strong style="color: #6b7280;">Expiry Date:</strong><br>
                  ${data.visaExpiryDate}
                </div>
                <div>
                  <strong style="color: #6b7280;">Days Remaining:</strong><br>
                  <span style="background: ${urgencyBg}; color: ${urgencyColor}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                    ${data.daysRemaining > 0 ? `${data.daysRemaining} days` : `${Math.abs(data.daysRemaining)} days overdue`}
                  </span>
                </div>
              </div>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
              <h3 style="margin: 0 0 10px 0; color: #92400e;">⚠️ Required Actions</h3>
              <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                <li>Review visa status immediately</li>
                <li>Contact the employee regarding renewal</li>
                <li>Initiate renewal process if needed</li>
                <li>Update visa records in the system</li>
                <li>Monitor upcoming expiries regularly</li>
              </ul>
            </div>
            
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1e40af;">📧 Email Service Details</h3>
              <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
                <li><strong>Service:</strong> Gmail SMTP</li>
                <li><strong>From:</strong> ${this.fromEmail}</li>
                <li><strong>To:</strong> ${this.toEmail}</li>
                <li><strong>Status:</strong> Active and working</li>
                <li><strong>Cost:</strong> Free (Gmail limits)</li>
              </ul>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              This is an automated notification from CUBS Technical.<br>
              Generated on: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: data.employeeEmail,
      subject: `🚨 Visa Expiry Alert - ${data.employeeName}`,
      html: html,
      text: `CUBS Technical - Visa Expiry Alert

🚨 Visa Expiry Alert

This is an automated notification regarding employee visa expiries.

Employee Details:
- Employee Name: ${data.employeeName}
- Employee Email: ${data.employeeEmail}
- Visa Type: ${data.visaType}
- Company: ${data.companyName}
- Expiry Date: ${data.visaExpiryDate}
- Days Remaining: ${data.daysRemaining > 0 ? `${data.daysRemaining} days` : `${Math.abs(data.daysRemaining)} days overdue`}

⚠️ Required Actions:
- Review visa status immediately
- Contact the employee regarding renewal
- Initiate renewal process if needed
- Update visa records in the system
- Monitor upcoming expiries regularly

Email Service Details:
- Service: Gmail SMTP
- From: ${this.fromEmail}
- To: ${this.toEmail}
- Status: Active and working
- Cost: Free (Gmail limits)

Generated on: ${new Date().toLocaleString()}`
    });
  }

  // Send document expiry notification
  static async sendDocumentExpiryNotification(data: DocumentExpiryData): Promise<{ success: boolean; error?: string }> {
    const urgencyColor = data.daysUntilExpiry <= 0 ? '#dc2626' :
                        data.daysUntilExpiry <= 7 ? '#dc2626' : 
                        data.daysUntilExpiry <= 30 ? '#ea580c' : '#d97706';
    const urgencyBg = data.daysUntilExpiry <= 0 ? '#fef2f2' :
                     data.daysUntilExpiry <= 7 ? '#fef2f2' : 
                     data.daysUntilExpiry <= 30 ? '#fff7ed' : '#fffbeb';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>CUBS Technical - Document Expiry Alert</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">CUBS Technical</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Document Expiry Alert</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px;">
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
              <h2 style="margin: 0 0 10px 0; color: #dc2626;">🚨 Document Expiry Alert</h2>
              <p style="margin: 0; color: #dc2626;">This is an automated notification regarding document expiries.</p>
            </div>
            
            <h2 style="color: #374151; margin-bottom: 20px;">📋 Document Details</h2>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                  <strong style="color: #6b7280;">Employee Name:</strong><br>
                  ${data.employeeName}
                </div>
                <div>
                  <strong style="color: #6b7280;">Employee Email:</strong><br>
                  ${data.employeeEmail}
                </div>
                <div>
                  <strong style="color: #6b7280;">Document Name:</strong><br>
                  ${data.documentName}
                </div>
                <div>
                  <strong style="color: #6b7280;">Document Type:</strong><br>
                  ${data.documentType}
                </div>
                <div>
                  <strong style="color: #6b7280;">Expiry Date:</strong><br>
                  ${data.expiryDate}
                </div>
                <div>
                  <strong style="color: #6b7280;">Days Remaining:</strong><br>
                  <span style="background: ${urgencyBg}; color: ${urgencyColor}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                    ${data.daysUntilExpiry > 0 ? `${data.daysUntilExpiry} days` : `${Math.abs(data.daysUntilExpiry)} days overdue`}
                  </span>
                </div>
              </div>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
              <h3 style="margin: 0 0 10px 0; color: #92400e;">⚠️ Required Actions</h3>
              <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                <li>Review document status immediately</li>
                <li>Contact the employee regarding renewal</li>
                <li>Initiate renewal process if needed</li>
                <li>Update document records in the system</li>
                <li>Monitor upcoming expiries regularly</li>
              </ul>
            </div>
            
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1e40af;">📧 Email Service Details</h3>
              <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
                <li><strong>Service:</strong> Gmail SMTP</li>
                <li><strong>From:</strong> ${this.fromEmail}</li>
                <li><strong>To:</strong> ${this.toEmail}</li>
                <li><strong>Status:</strong> Active and working</li>
                <li><strong>Cost:</strong> Free (Gmail limits)</li>
              </ul>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              This is an automated notification from CUBS Technical.<br>
              Generated on: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: data.employeeEmail,
      subject: `🚨 Document Expiry Alert - ${data.documentName}`,
      html: html,
      text: `CUBS Technical - Document Expiry Alert

🚨 Document Expiry Alert

This is an automated notification regarding document expiries.

Document Details:
- Employee Name: ${data.employeeName}
- Employee Email: ${data.employeeEmail}
- Document Name: ${data.documentName}
- Document Type: ${data.documentType}
- Expiry Date: ${data.expiryDate}
- Days Remaining: ${data.daysUntilExpiry > 0 ? `${data.daysUntilExpiry} days` : `${Math.abs(data.daysUntilExpiry)} days overdue`}

⚠️ Required Actions:
- Review document status immediately
- Contact the employee regarding renewal
- Initiate renewal process if needed
- Update document records in the system
- Monitor upcoming expiries regularly

Email Service Details:
- Service: Gmail SMTP
- From: ${this.fromEmail}
- To: ${this.toEmail}
- Status: Active and working
- Cost: Free (Gmail limits)

Generated on: ${new Date().toLocaleString()}`
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
          // Convert VisaExpiryData to VisaExpiryNotification format
          const visaNotification: VisaExpiryNotification = {
            employeeName: notification.employeeName,
            employeeEmail: notification.employeeEmail,
            visaExpiryDate: notification.expiryDate,
            daysRemaining: notification.daysUntilExpiry,
            visaType: notification.visaType,
            companyName: notification.companyName
          };
          result = await this.sendVisaExpiryNotification(visaNotification);
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
        <p><strong>Service:</strong> Gmail SMTP</p>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: toEmail,
      subject: 'CUBS Technical - Email Service Test (Gmail SMTP)',
      html,
      text: 'Email service test successful. If you received this email, the notification service is working correctly.',
    });
  }
}

export default EmailService; 