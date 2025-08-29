# 🔑 **Get iOS Certificates & Profiles for Codemagic**

## 🎯 **What You Need**
To fix the "No matching profiles" error, you need:
1. **iOS Distribution Certificate** (`.p12` file)
2. **App Store Distribution Provisioning Profile** (`.mobileprovision` file)

---

## 📋 **Step 1: Create iOS Distribution Certificate**

### **1.1 Go to Apple Developer Portal:**
1. **Visit**: https://developer.apple.com/account/resources/certificates/list
2. **Sign in** with `info@cubstechnical.com`
3. **Click**: "+" to add new certificate

### **1.2 Create Distribution Certificate:**
1. **Select**: "iOS Distribution (App Store and Ad Hoc)"
2. **Click**: "Continue"
3. **Upload CSR**: If you don't have one, create it:
   - **On Mac**: Use Keychain Access
   - **On Windows**: Use OpenSSL (see below)
4. **Download** the `.cer` file

### **1.3 Convert to .p12 (if needed):**
If you have a `.cer` file, convert it to `.p12`:
```bash
# On Mac with Keychain Access
# 1. Double-click .cer file to install in Keychain
# 2. Export as .p12 with password
```

---

## 🔧 **Step 2: Create App Store Distribution Profile**

### **2.1 Go to Profiles:**
1. **Visit**: https://developer.apple.com/account/resources/profiles/list
2. **Click**: "+" to create new profile

### **2.2 Configure Profile:**
1. **Select**: "App Store" distribution type
2. **Select**: Your App ID (`com.cubstechnical.admin`)
3. **Select**: Your distribution certificate
4. **Name**: "CUBS Employee Management App Store"
5. **Click**: "Generate"
6. **Download** the `.mobileprovision` file

---

## ⚙️ **Step 3: Add to Codemagic Environment Variables**

### **3.1 Go to Codemagic:**
1. **Visit**: https://codemagic.io/apps
2. **Select**: Your app (`-cubs-employee-management-v2`)
3. **Click**: "Settings" → "Environment variables"

### **3.2 Add These Variables:**

| Variable Name | Value | Secure |
|---------------|-------|--------|
| `APP_STORE_CERTIFICATE` | **Content of your .p12 file** | ✅ **YES** |
| `APP_STORE_PROVISIONING_PROFILE` | **Content of your .mobileprovision file** | ✅ **YES** |
| `APP_STORE_CONNECT_API_KEY` | **Content of your .p8 file** | ✅ **YES** |
| `APP_STORE_CONNECT_KEY_ID` | `fde9acef-6408-4dab-b6ed-31f8a3e5817b` | ❌ No |
| `APP_STORE_CONNECT_ISSUER_ID` | `MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgbdfBnq24esDTgFpA` | ❌ No |

### **3.3 How to Get File Contents:**
1. **Open** the file in a text editor
2. **Copy** the entire content
3. **Paste** into the environment variable
4. **Mark as secure** ✅

---

## 🛠️ **Alternative: Create CSR on Windows**

### **Using OpenSSL:**
```bash
# Install OpenSSL if not available
# Then run:
openssl genrsa -out private.key 2048
openssl req -new -key private.key -out certificate.csr
```

### **Using Online CSR Generator:**
1. **Visit**: https://certificatetools.com/
2. **Generate** CSR with your details
3. **Download** the `.csr` file

---

## 🚀 **Step 4: Run the Manual Signing Workflow**

### **4.1 Start Build:**
1. **Go to**: Codemagic dashboard
2. **Click**: "Start new build"
3. **Select**: `ios-build-testflight-manual` workflow
4. **Click**: "Start build"

### **4.2 What Happens:**
1. **Codemagic uses** your certificates and profiles
2. **Builds and signs** the app properly
3. **Creates signed IPA**
4. **Uploads to App Store Connect**
5. **Appears in TestFlight**

---

## ⚠️ **Troubleshooting**

### **If Certificate Issues:**
- **Check** certificate is valid and not expired
- **Verify** certificate matches your team
- **Ensure** .p12 file includes private key

### **If Profile Issues:**
- **Check** profile includes correct App ID
- **Verify** profile includes correct certificate
- **Ensure** profile is for App Store distribution

### **If Build Still Fails:**
- **Check** all environment variables are set
- **Verify** file contents are complete
- **Ensure** variables are marked as secure

---

## 🎯 **Success Indicators**

### **✅ Certificate Success:**
- Certificate appears in Apple Developer portal
- .p12 file contains both certificate and private key

### **✅ Profile Success:**
- Profile appears in Apple Developer portal
- Profile includes your App ID and certificate

### **✅ Build Success:**
```
✅ IPA created successfully:
🚀 Ready for App Store Connect upload!
```

---

## 📞 **Next Steps**

1. **Create** the distribution certificate
2. **Create** the App Store distribution profile
3. **Add** both to Codemagic environment variables
4. **Run** the `ios-build-testflight-manual` workflow
5. **Test** on your iPhone via TestFlight

**This manual signing approach will definitely work!** 🚀
