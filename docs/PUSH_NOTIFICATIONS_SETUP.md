# 📱 Push Notifications Setup Guide

## Overview
This guide will help you set up push notifications for the CUBS Visa Management mobile app.

## Prerequisites
- Firebase project
- Supabase database access
- Mobile app built with Capacitor

## Step 1: Firebase Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name: `CUBS-Visa-Management`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Cloud Messaging
1. In Firebase Console, go to "Project Settings"
2. Click "Cloud Messaging" tab
3. Note your Server Key (you'll need this later)

### 1.3 Download Configuration Files

#### For Android:
1. In Firebase Console, click "Add app" → "Android"
2. Package name: `com.cubstechnical.admin`
3. Download `google-services.json`
4. Place in: `android/app/google-services.json`

#### For iOS:
1. In Firebase Console, click "Add app" → "iOS"
2. Bundle ID: `com.cubstechnical.admin`
3. Download `GoogleService-Info.plist`
4. Place in: `ios/App/App/GoogleService-Info.plist`

## Step 2: Install Firebase Admin SDK

```bash
npm install firebase-admin
```

## Step 3: Environment Variables

Add to your `.env` file:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"
```

### 3.1 Get Firebase Service Account
1. In Firebase Console, go to "Project Settings"
2. Click "Service accounts" tab
3. Click "Generate new private key"
4. Download JSON file
5. Extract values to environment variables

## Step 4: Database Setup

### 4.1 Create Device Tokens Table

Run this SQL in your Supabase SQL editor:

```sql
-- Create device_tokens table
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_token)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_platform ON device_tokens(platform);

-- Enable RLS
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own device tokens" ON device_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device tokens" ON device_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device tokens" ON device_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device tokens" ON device_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Admin can view all device tokens
CREATE POLICY "Admins can view all device tokens" ON device_tokens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

## Step 5: Update Firebase Admin SDK

### 5.1 Update Push Notification API

Uncomment and update the Firebase Admin SDK code in:
`app/api/push-notifications/send/route.ts`

## Step 6: Test Push Notifications

### 6.1 Build and Install Mobile App
```bash
# Build for Android
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug

# Install on device
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 6.2 Test Notification
1. Open the app on your device
2. Grant notification permissions
3. Check console logs for device token
4. Test via API endpoint

## Step 7: Verification

### 7.1 Check Device Token Storage
```sql
-- Check if device tokens are being stored
SELECT * FROM device_tokens ORDER BY created_at DESC LIMIT 5;
```

### 7.2 Test Push Notification API
```bash
curl -X POST http://localhost:3002/api/push-notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "token": "DEVICE_TOKEN_HERE",
    "notification": {
      "title": "Test Notification",
      "body": "This is a test push notification"
    }
  }'
```

## Troubleshooting

### Common Issues:

1. **"google-services.json not found"**
   - Ensure file is in `android/app/` directory
   - Check file permissions

2. **"Firebase not initialized"**
   - Verify environment variables are set
   - Check Firebase Admin SDK installation

3. **"Permission denied"**
   - Ensure user has admin role
   - Check RLS policies

4. **"Device token not found"**
   - Verify app has notification permissions
   - Check device token storage in database

### Debug Commands:

```bash
# Check Firebase configuration
npx cap doctor

# Check Android build
cd android && ./gradlew assembleDebug --info

# Check iOS build (macOS only)
cd ios && xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug
```

## Production Deployment

### 1. Update Environment Variables
Ensure all Firebase environment variables are set in production.

### 2. Update Capacitor Configuration
Verify `capacitor.config.ts` has correct production settings.

### 3. Test Production Build
```bash
npm run build
npx cap sync
# Build production APK/IPA
```

## Support

For issues:
1. Check Firebase Console logs
2. Check Supabase logs
3. Check mobile app console logs
4. Verify all configuration files are in place
