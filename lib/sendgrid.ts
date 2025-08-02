import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async (template: EmailTemplate): Promise<void> => {
  try {
    await sgMail.send({
      to: template.to,
      from: template.from || process.env.SENDGRID_FROM_EMAIL!,
      subject: template.subject,
      html: template.html,
    });
  } catch (error) {
    console.error('SendGrid error:', error);
    throw new Error('Failed to send email');
  }
};

export const sendVisaExpiryReminder = async (
  employeeEmail: string,
  employeeName: string,
  expiryDate: string,
  daysRemaining: number
): Promise<void> => {
  const template: EmailTemplate = {
    to: employeeEmail,
    subject: `Visa Expiry Reminder - ${daysRemaining} days remaining`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; padding: 30px; border-radius: 12px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 600;">CUBS Technical</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Visa Management System</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Visa Expiry Reminder</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
            Dear <strong>${employeeName}</strong>,
          </p>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-weight: 500;">
              ⚠️ Your visa will expire in <strong>${daysRemaining} days</strong> on <strong>${new Date(expiryDate).toLocaleDateString()}</strong>
            </p>
          </div>
          
          <p style="color: #6b7280; line-height: 1.6; margin: 20px 0;">
            Please ensure you have initiated the visa renewal process to avoid any complications. 
            If you have already started the renewal process, please update your status in the system.
          </p>
          
          <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #0369a1; font-size: 16px;">Next Steps:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #0c4a6e;">
              <li>Contact your HR representative</li>
              <li>Gather required documents</li>
              <li>Submit renewal application</li>
              <li>Update status in the system</li>
            </ul>
          </div>
          
          <p style="color: #6b7280; line-height: 1.6; margin: 20px 0 0 0;">
            If you have any questions, please contact the HR department immediately.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 14px;">
          <p>This is an automated reminder from CUBS Technical Visa Management System</p>
          <p>© 2024 CUBS Technical. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  await sendEmail(template);
};

export const sendWelcomeEmail = async (
  employeeEmail: string,
  employeeName: string,
  loginUrl: string
): Promise<void> => {
  const template: EmailTemplate = {
    to: employeeEmail,
    subject: 'Welcome to CUBS Technical - Your Account is Ready',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 12px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Welcome to CUBS Technical</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Visa Management System</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Welcome, ${employeeName}!</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
            Your account has been successfully created in the CUBS Technical Visa Management System. 
            You can now access your employee portal to manage your visa documents and information.
          </p>
          
          <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #0369a1; font-size: 16px;">Getting Started:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #0c4a6e;">
              <li>Complete your profile information</li>
              <li>Upload required documents</li>
              <li>Review your visa status</li>
              <li>Set up notification preferences</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
              Access Your Account
            </a>
          </div>
          
          <p style="color: #6b7280; line-height: 1.6; margin: 20px 0 0 0;">
            If you have any questions or need assistance, please contact the HR department.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 14px;">
          <p>© 2024 CUBS Technical. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  await sendEmail(template);
};

export const sendPasswordResetEmail = async (
  userEmail: string,
  resetUrl: string
): Promise<void> => {
  const template: EmailTemplate = {
    to: userEmail,
    subject: 'Password Reset Request - CUBS Technical',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; border-radius: 12px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Password Reset</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">CUBS Technical Visa Management System</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Reset Your Password</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
            We received a request to reset your password for your CUBS Technical account. 
            Click the button below to create a new password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
              Reset Password
            </a>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-weight: 500;">
              ⚠️ This link will expire in 1 hour for security reasons.
            </p>
          </div>
          
          <p style="color: #6b7280; line-height: 1.6; margin: 20px 0 0 0;">
            If you didn't request this password reset, please ignore this email or contact support if you have concerns.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 14px;">
          <p>© 2024 CUBS Technical. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  await sendEmail(template);
};
