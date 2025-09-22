# CUBS Technical - Notifications System

## Overview

The CUBS Technical Employee Management System includes a comprehensive notifications system that automatically sends email alerts for visa expiries, document requirements, system events, and user approvals. All emails are sent using Gmail SMTP from `technicalcubs@gmail.com` to `info@cubstechnical.com`.

## Features

### ✅ **Automated Email Notifications**
- **Visa Expiry Alerts**: Automated notifications at 60, 30, 15, 7, and 1 days before expiry
- **Document Expiry Alerts**: Notifications for expiring documents
- **User Approval Notifications**: Admin approval/rejection emails
- **System Notifications**: Maintenance alerts and system status updates

### ✅ **Gmail SMTP Integration**
- **From Email**: `technicalcubs@gmail.com`
- **To Email**: `info@cubstechnical.com` (all notifications)
- **Service**: Gmail SMTP (free tier)
- **Rate Limits**: 500 emails/day, 20 emails/second
- **Cost**: Free

### ✅ **Notification Management**
- **Real-time Dashboard**: View all notifications with filtering and search
- **Statistics**: Track sent, pending, failed notifications
- **Categories**: Visa, Document, System, Approval
- **Status Tracking**: Sent, Pending, Failed with timestamps

### ✅ **Automated Scheduling**
- **Cron Jobs**: Automated daily checks for visa expiries
- **Manual Triggers**: Test and trigger notifications manually
- **Batch Processing**: Efficient handling of multiple notifications

## System Architecture

### **Email Service** (`lib/services/email.ts`)
```typescript
// Gmail SMTP Configuration
- From: technicalcubs@gmail.com
- To: info@cubstechnical.com (always)
- Service: Gmail SMTP
- Authentication: App Password
```

### **Visa Notifications** (`lib/services/visaNotifications.ts`)
```typescript
// Notification Intervals
- 60 days before expiry
- 30 days before expiry  
- 15 days before expiry
- 7 days before expiry
- 1 day before expiry
```

### **Notification Service** (`lib/services/notifications.ts`)
```typescript
// Notification Types
- success: Green alerts
- warning: Yellow alerts
- error: Red alerts
- info: Blue alerts
```

### **Database Schema**
```sql
-- notifications table
- id: UUID primary key
- title: Notification title
- message: Notification content
- type: success/warning/error/info
- status: sent/pending/failed
- recipient: Email address
- category: visa/document/system/approval
- created_at: Timestamp
- scheduled_for: Optional scheduled time
- sent_at: When notification was sent
- error_message: Error details if failed
```

## API Endpoints

### **Test Email Service**
```bash
# GET - Check email service status
GET /api/test-email

# POST - Send test email
POST /api/test-email
{
  "toEmail": "info@cubstechnical.com"
}
```

### **Visa Notifications**
```bash
# GET - Get visa expiry statistics
GET /api/test-visa-notifications

# POST - Manually trigger visa expiry check
POST /api/test-visa-notifications
```

### **Cron Job**
```bash
# GET - Automated visa expiry check (with auth)
GET /api/cron/visa-notifications
Authorization: Bearer your-cron-secret

# POST - Manual trigger
POST /api/cron/visa-notifications
```

## Configuration

### **Environment Variables**
```env
# Gmail SMTP Configuration
GMAIL_USER=technicalcubs@gmail.com
GMAIL_APP_PASSWORD=your-app-password-here
GMAIL_FROM_NAME=CUBS Technical

# Cron Job Security
CRON_SECRET=your-cron-secret-here
```

### **Gmail App Password Setup**
1. Enable 2-Factor Authentication on Gmail
2. Generate App Password for "Mail"
3. Use App Password in `GMAIL_APP_PASSWORD`

## Usage

### **Notifications Dashboard**
1. Navigate to `/notifications`
2. View real-time statistics
3. Filter by type, status, category
4. Search notifications
5. Send test emails
6. Trigger manual checks

### **Automated Visa Monitoring**
- **Daily Cron Job**: Automatically checks for expiring visas
- **Consolidated Emails**: Groups employees by expiry intervals
- **Rate Limiting**: Respects Gmail limits (1 second between emails)
- **Status Tracking**: Updates notification flags to prevent duplicates

### **Manual Testing**
```bash
# Test email service
curl -X POST http://localhost:3000/api/test-email

# Test visa notifications
curl -X POST http://localhost:3000/api/test-visa-notifications

# Check visa statistics
curl http://localhost:3000/api/test-visa-notifications
```

## Email Templates

### **Visa Expiry Alert**
```html
Subject: 🚨 VISA EXPIRY URGENT: 5 Employees - 7 Days Remaining

- Professional HTML template
- Employee details table
- Urgency indicators
- Action items
- Gmail SMTP service details
```

### **System Notifications**
```html
Subject: 📢 System Notification - CUBS Technical

- Clean, professional design
- System status information
- Service details
- Timestamp and branding
```

### **User Approvals**
```html
Subject: ✅ Request Approved - CUBS Technical

- Approval/rejection status
- User details
- Admin information
- Reason (if provided)
```

## Monitoring & Analytics

### **Statistics Dashboard**
- **Total Notifications**: All-time count
- **Sent Today**: Daily notification count
- **Pending**: Queued notifications
- **Failed**: Failed delivery attempts
- **Visa Stats**: Employee expiry statistics

### **Performance Metrics**
- **Email Delivery Rate**: Success/failure ratio
- **Response Time**: Time to send notifications
- **Rate Limit Usage**: Gmail quota monitoring
- **Error Tracking**: Failed notification details

## Troubleshooting

### **Common Issues**

#### **Email Not Sending**
```bash
# Check Gmail credentials
- Verify GMAIL_USER and GMAIL_APP_PASSWORD
- Ensure 2FA is enabled
- Check App Password is correct

# Test email service
curl -X POST http://localhost:3000/api/test-email
```

#### **Visa Notifications Not Working**
```bash
# Check database connection
- Verify Supabase connection
- Check employee_table has visa_expiry_date
- Verify notification flags exist

# Test visa service
curl -X POST http://localhost:3000/api/test-visa-notifications
```

#### **Rate Limiting Issues**
```bash
# Gmail Limits
- Daily: 500 emails
- Per Second: 20 emails
- Solution: Wait between batches (1 second)
```

### **Debug Commands**
```bash
# Check notification statistics
curl http://localhost:3000/api/test-visa-notifications

# Test email configuration
curl http://localhost:3000/api/test-email

# Manual visa check
curl -X POST http://localhost:3000/api/test-visa-notifications
```

## Security

### **Authentication**
- **Admin Only**: Notifications page requires admin access
- **Cron Security**: API endpoints protected with Bearer token
- **RLS Policies**: Database access restricted to admin users

### **Data Protection**
- **Email Privacy**: All emails sent to company address only
- **No Personal Data**: Employee emails not exposed in logs
- **Secure Storage**: Notification records stored securely

## Future Enhancements

### **Planned Features**
- **SMS Notifications**: Twilio integration for urgent alerts
- **Push Notifications**: Browser notifications for real-time alerts
- **Custom Templates**: Admin-configurable email templates
- **Notification Preferences**: User-specific notification settings
- **Advanced Scheduling**: Custom notification intervals
- **Analytics Dashboard**: Detailed notification analytics

### **Integration Opportunities**
- **Slack Integration**: Send notifications to Slack channels
- **Teams Integration**: Microsoft Teams notifications
- **Webhook Support**: Custom webhook endpoints
- **API Integration**: Third-party notification services

## Support

### **Documentation**
- **API Reference**: Complete endpoint documentation
- **Code Examples**: Implementation examples
- **Troubleshooting Guide**: Common issues and solutions

### **Contact**
- **Technical Support**: info@cubstechnical.com
- **System Admin**: admin@cubstechnical.com
- **Documentation**: This file and inline code comments

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅

