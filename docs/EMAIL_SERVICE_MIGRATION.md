# Email Service Migration: SendGrid → Resend

## Overview

The email service has been migrated from SendGrid to Resend API to ensure all emails are sent to a single email address: `info@cubstechnical.com`.

## Changes Made

### 1. Email Service (`lib/services/email.ts`)
- **Replaced**: SendGrid SDK with Resend API
- **Updated**: All email methods to use Resend's REST API
- **Fixed**: All emails now sent to `info@cubstechnical.com` regardless of recipient parameter
- **Added**: Better error handling and logging

### 2. Environment Variables
- **Removed**: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`
- **Added**: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`
- **Default**: API key is hardcoded as fallback: `re_XVUsCxaY_KswiYy2Wbb5SnTPQKhUorjaN`

### 3. Supabase Edge Function (`supabase/send-visa-notifications/index.ts`)
- **Updated**: Visa notification service to use Resend API
- **Maintained**: All existing functionality and email templates
- **Fixed**: All notifications sent to `info@cubstechnical.com`

### 4. Dependencies
- **Removed**: `@sendgrid/mail` package
- **Added**: No new dependencies (using native `fetch`)

## Configuration

### Environment Variables
```env
# Resend Email Configuration
RESEND_API_KEY=re_XVUsCxaY_KswiYy2Wbb5SnTPQKhUorjaN
RESEND_FROM_EMAIL=noreply@cubstechnical.com
RESEND_FROM_NAME=CUBS Technical
```

### API Key
The Resend API key is configured to send emails to `info@cubstechnical.com` only.

## Testing

### Command Line Test
```bash
npm run test:email
```

### API Test
```bash
# GET request to check configuration
curl http://localhost:3002/api/test-email

# POST request to send test email
curl -X POST http://localhost:3002/api/test-email
```

### Manual Testing
1. Navigate to `/api/test-email` in your browser
2. Use POST method to send a test email
3. Check `info@cubstechnical.com` for the test email

## Email Types Supported

1. **Admin Approval Notifications** - When admin access is granted/denied
2. **Admin Notifications** - General admin action notifications
3. **Document Expiry Notifications** - When employee documents are expiring
4. **Visa Expiry Notifications** - When employee visas are expiring
5. **Test Emails** - For service verification

## Email Templates

All emails use responsive HTML templates with:
- CUBS Technical branding
- Gradient headers
- Responsive design
- Clear call-to-action buttons
- Professional styling

## Error Handling

- **API Errors**: Detailed error messages from Resend API
- **Network Errors**: Connection timeout and retry logic
- **Validation Errors**: Input validation and sanitization
- **Logging**: Console logs for debugging

## Migration Benefits

1. **Simplified Configuration**: Single email recipient
2. **Better Reliability**: Resend's modern API
3. **Cost Effective**: No per-email charges
4. **Better Deliverability**: Resend's infrastructure
5. **Easier Maintenance**: Single point of configuration

## Rollback Plan

If needed, the system can be rolled back to SendGrid by:
1. Reverting `lib/services/email.ts` to SendGrid implementation
2. Restoring environment variables
3. Reinstalling `@sendgrid/mail` package
4. Updating Supabase Edge Function

## Monitoring

- Check email delivery in Resend dashboard
- Monitor API response times
- Track email open rates and engagement
- Review error logs for failed deliveries

