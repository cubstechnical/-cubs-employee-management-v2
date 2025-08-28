# 🚨 Visa Notifications Setup Guide

## ✅ **System Overview**

Your visa notification system is now configured to send consolidated emails to `info@cubstechnical.com` using Gmail SMTP with proper rate limiting and daily limits.

### **📧 Email Configuration:**
- **From:** `technicalcubs@gmail.com`
- **To:** `info@cubstechnical.com`
- **Service:** Gmail SMTP
- **Daily Limit:** 500 emails
- **Rate Limit:** 20 emails/second

## 🔧 **System Features**

### **1. Consolidated Emails**
- Groups employees by days until expiry
- Sends one email per expiry interval (60, 30, 15, 7, 1 days)
- Reduces email count and respects Gmail limits

### **2. Rate Limiting**
- Waits 1 second between emails
- Prevents Gmail rate limit violations
- Ensures reliable delivery

### **3. Professional Email Templates**
- HTML and text versions
- Color-coded urgency levels
- Employee details in table format
- Required actions clearly listed

## 📅 **Notification Schedule**

The system checks for visa expiries at these intervals:
- **60 days** before expiry
- **30 days** before expiry  
- **15 days** before expiry
- **7 days** before expiry
- **1 day** before expiry

## 🚀 **Setup Instructions**

### **Step 1: Environment Variables**
Add these to your `.env` file:
```env
GMAIL_USER=technicalcubs@gmail.com
GMAIL_APP_PASSWORD=kito hkgc ygfp gzjo
GMAIL_FROM_NAME=CUBS Technical
```

### **Step 2: Database Schema**
Ensure your `employee_table` has these notification flag columns:
```sql
ALTER TABLE employee_table ADD COLUMN IF NOT EXISTS notification_sent_60 BOOLEAN DEFAULT FALSE;
ALTER TABLE employee_table ADD COLUMN IF NOT EXISTS notification_sent_30 BOOLEAN DEFAULT FALSE;
ALTER TABLE employee_table ADD COLUMN IF NOT EXISTS notification_sent_15 BOOLEAN DEFAULT FALSE;
ALTER TABLE employee_table ADD COLUMN IF NOT EXISTS notification_sent_7 BOOLEAN DEFAULT FALSE;
ALTER TABLE employee_table ADD COLUMN IF NOT EXISTS notification_sent_1 BOOLEAN DEFAULT FALSE;
```

### **Step 3: Deploy Supabase Edge Function**
```bash
supabase functions deploy send-visa-notifications
```

## ⏰ **Cron Job Scheduling**

### **Option 1: Vercel Cron Jobs (Recommended)**
Add this to your `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/visa-notifications",
      "schedule": "0 9 * * *"
    }
  ]
}
```
This runs daily at 9:00 AM.

### **Option 2: External Cron Service**
Use services like:
- **Cron-job.org** (Free)
- **EasyCron** (Paid)
- **SetCronJob** (Free tier available)

Schedule URL: `https://your-domain.com/api/cron/visa-notifications`

### **Option 3: Manual Testing**
Test the system manually:
```bash
# Via curl
curl -X GET https://your-domain.com/api/cron/visa-notifications

# Via browser
https://your-domain.com/api/cron/visa-notifications
```

## 🧪 **Testing the System**

### **1. Test Email Service**
```bash
node test-visa-notifications.js
```

### **2. Test API Endpoint**
```bash
curl -X GET http://localhost:3000/api/cron/visa-notifications
```

### **3. Check Email Delivery**
- Monitor `info@cubstechnical.com` inbox
- Check spam folder if needed
- Verify email formatting and content

## 📊 **Monitoring & Logs**

### **Email Delivery Tracking**
- Check Gmail sent folder
- Monitor bounce rates
- Track daily email count

### **System Logs**
- Supabase Edge Function logs
- Next.js API route logs
- Email service logs

### **Database Monitoring**
```sql
-- Check notification flags
SELECT 
  COUNT(*) as total_employees,
  SUM(CASE WHEN notification_sent_60 THEN 1 ELSE 0 END) as notified_60,
  SUM(CASE WHEN notification_sent_30 THEN 1 ELSE 0 END) as notified_30,
  SUM(CASE WHEN notification_sent_15 THEN 1 ELSE 0 END) as notified_15,
  SUM(CASE WHEN notification_sent_7 THEN 1 ELSE 0 END) as notified_7,
  SUM(CASE WHEN notification_sent_1 THEN 1 ELSE 0 END) as notified_1
FROM employee_table 
WHERE visa_expiry_date IS NOT NULL;
```

## 🔒 **Gmail SMTP Limits**

### **Daily Limits**
- **Free Tier:** 500 emails/day
- **Paid Tier:** 2,000 emails/day
- **Monitor:** Check Gmail usage in account settings

### **Rate Limits**
- **Per Second:** 20 emails
- **Per Minute:** 1,200 emails
- **System:** Automatically waits 1 second between emails

### **Best Practices**
- ✅ Send consolidated emails
- ✅ Respect rate limits
- ✅ Monitor daily usage
- ✅ Use proper authentication
- ✅ Handle bounces gracefully

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Authentication Errors**
```
Error: Invalid login: 534-5.7.9 Application-specific password required
```
**Solution:** Generate new Gmail App Password

#### **2. Rate Limit Errors**
```
Error: 550 5.7.0 Too many emails per second
```
**Solution:** System automatically handles this with 1-second delays

#### **3. Daily Limit Reached**
```
Error: 550 5.7.0 Daily sending quota exceeded
```
**Solution:** Wait until next day or upgrade Gmail plan

#### **4. Database Connection Issues**
```
Error: Database query failed
```
**Solution:** Check Supabase connection and table schema

### **Debug Commands**
```bash
# Test email service
node test-visa-notifications.js

# Test API endpoint
curl -X GET http://localhost:3000/api/cron/visa-notifications

# Check environment variables
echo $GMAIL_USER
echo $GMAIL_APP_PASSWORD
```

## 📈 **Performance Optimization**

### **Email Efficiency**
- ✅ Consolidated emails reduce total count
- ✅ Rate limiting prevents Gmail blocks
- ✅ Professional templates improve deliverability
- ✅ HTML + text versions for compatibility

### **Database Optimization**
- ✅ Index on `visa_expiry_date` column
- ✅ Batch updates for notification flags
- ✅ Efficient queries with proper filtering

### **System Reliability**
- ✅ Error handling and logging
- ✅ Graceful failure recovery
- ✅ Monitoring and alerting
- ✅ Backup notification methods

## 🎯 **Next Steps**

1. **Deploy the system** to production
2. **Set up cron job** for daily execution
3. **Monitor email delivery** for first few days
4. **Adjust notification intervals** if needed
5. **Set up monitoring** and alerting
6. **Train team** on email management

## 📞 **Support**

If you encounter issues:
1. Check the troubleshooting section above
2. Review system logs for errors
3. Test with the provided test scripts
4. Verify environment variables
5. Contact support if needed

---

**🎉 Your visa notification system is ready to use!**

