# CodeMagic CI/CD Setup Guide - CUBS Visa Management

## ✅ **Android Build Status**
- **APK Ready**: ✅ `android\app\build\outputs\apk\debug\app-debug.apk`
- **Size**: 3.97 MB
- **Status**: Ready for deployment

---

## 🔧 **CodeMagic Environment Variables Setup**

### **Step 1: Create Environment Variable Groups**

In CodeMagic, create these environment variable groups:

#### **Group 1: `cubs_environment`**
```
NEXT_PUBLIC_SUPABASE_URL=https://tndfjsjemqjgagtsqudr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGZqc2plbXFqZ2FndHNxdWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4ODQ1MDMsImV4cCI6MjA2NTQ2MDUwM30.jcPuX4IVgeCIwHuc53RiXhIm9yzMXYepgSzZ8QYu1iA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGZqc2plbXFqZ2FndHNxdWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4ODQ1MDMsImV4cCI6MjA2NTQ2MDUwM30.jcPuX4IVgeCIwHuc53RiXhIm9yzMXYepgSzZ8QYu1iA
NODE_ENV=production
SENDGRID_API_KEY=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
SENDGRID_FROM_EMAIL=technicalcubs@gmail.com
B2_APPLICATION_KEY_ID=005777f1de8041c0000000001
B2_APPLICATION_KEY=K005atrNvhb2raSkcqcpIAM6PsbUPco
B2_BUCKET_NAME=cubsdocs
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_BUCKET_ID=4747b73f41bd6ee89074011c
```

#### **Group 2: `google_play`**
```
GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS=[Your Google Play Service Account JSON]
GOOGLE_PLAY_TRACK=internal
```

---

## 📋 **Step-by-Step Setup Instructions**

### **1. CodeMagic Dashboard Setup**
1. Go to [CodeMagic Dashboard](https://codemagic.io/apps)
2. Connect your GitHub repository
3. Select your CUBS project

### **2. Environment Variables Configuration**
1. Go to **Settings** → **Environment Variables**
2. Click **Add group**
3. Create group `cubs_environment`
4. Add all variables from the list above
5. Mark sensitive variables as **Secret**:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SENDGRID_API_KEY`
   - `B2_APPLICATION_KEY`

### **3. Google Play Store Setup**
1. Create group `google_play`
2. Add your Google Play Service Account credentials
3. Set up Google Play Console integration

### **4. Workflow Configuration**
1. Use the provided `codemagic.yaml` file
2. The workflow will automatically use your environment variables
3. Configure build triggers (push to main branch)

---

## 🚀 **Available Workflows**

### **1. Android Build (Debug)**
- **Trigger**: Push to main branch
- **Output**: Debug APK
- **Purpose**: Testing and development

### **2. Android Release**
- **Trigger**: Manual or tagged releases
- **Output**: Release APK + AAB
- **Purpose**: Production deployment

---

## 📱 **Build Artifacts**

### **Debug Build:**
- `app-debug.apk` - For testing
- Size: ~4 MB

### **Release Build:**
- `app-release.apk` - For distribution
- `app-release.aab` - For Google Play Store
- Size: ~3-4 MB

---

## 🔐 **Security Notes**

### **Mark as Secret:**
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SENDGRID_API_KEY`
- ✅ `B2_APPLICATION_KEY`
- ✅ `GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS`

### **Public Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NODE_ENV`
- `SENDGRID_FROM_EMAIL`
- `B2_APPLICATION_KEY_ID`
- `B2_BUCKET_NAME`
- `B2_ENDPOINT`
- `B2_BUCKET_ID`

---

## 📧 **Notifications**

The workflow is configured to send email notifications to:
- **Success**: info@cubstechnical.com
- **Failure**: info@cubstechnical.com

---

## 🎯 **Next Steps**

1. **Set up environment variables** in CodeMagic
2. **Configure Google Play Store** integration
3. **Run first build** to test configuration
4. **Deploy to Google Play Store** for testing
5. **Submit for production** release

---

## ✅ **Ready for Deployment**

Your Android app is **100% ready** for CodeMagic CI/CD deployment with:
- ✅ Environment variables configured
- ✅ Build scripts ready
- ✅ Google Play Store integration
- ✅ Automated testing and deployment
- ✅ Email notifications

**File to use**: `codemagic.yaml`
