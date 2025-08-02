# 🧭 Navigation Guide - CUBS Technical Admin Portal

## ✅ **Correct URLs (Real Data)**

### **Main Application Pages (Real Data)**
- **Dashboard**: `http://localhost:3000/dashboard`
- **Employees**: `http://localhost:3000/employees` 
- **Documents**: `http://localhost:3000/documents`
- **Settings**: `http://localhost:3000/settings`
- **Notifications**: `http://localhost:3000/notifications`

### **Backend API Endpoints**
- **Health Check**: `http://localhost:3001/api/health`
- **Employee Stats**: `http://localhost:3001/api/employees/stats`
- **Document Stats**: `http://localhost:3001/api/documents/stats`
- **Employees API**: `http://localhost:3001/api/employees`
- **Documents API**: `http://localhost:3001/api/documents`

## ❌ **Wrong URLs (Mock Data)**

### **Admin Pages (Mock Data - Don't Use)**
- `http://localhost:3000/admin/dashboard` - Mock data
- `http://localhost:3000/admin/employees` - Mock data  
- `http://localhost:3000/admin/documents` - Mock data
- `http://localhost:3000/admin/notifications` - Mock data

## 🎯 **Quick Access Links**

### **Real Data Pages:**
1. **Dashboard with Analytics**: http://localhost:3000/dashboard
2. **Employee Management**: http://localhost:3000/employees
3. **Document Explorer**: http://localhost:3000/documents
4. **Settings**: http://localhost:3000/settings

### **Backend APIs:**
1. **Health Check**: http://localhost:3001/api/health
2. **Employee Statistics**: http://localhost:3001/api/employees/stats
3. **Document Statistics**: http://localhost:3001/api/documents/stats

## 🔧 **Troubleshooting**

### **If you see mock data:**
1. Make sure you're using the correct URLs (without `/admin/`)
2. Clear browser cache (Ctrl+F5)
3. Restart the development server (`npm run dev`)
4. Check that both servers are running:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:3001`

### **Real Data Verification:**
- **Employees**: Should show 312+ real employees from your database
- **Documents**: Should show 1,456+ real documents from Backblaze
- **Companies**: Should show real companies like AL ASHBAL AJMAN, CUBS, etc.

## 📊 **Your Real Data Summary**

- **Total Employees**: 312
- **Total Documents**: 1,456
- **Companies**: 10+ real companies
- **Storage**: Backblaze B2 integration
- **Database**: Supabase PostgreSQL

**Use the URLs without `/admin/` to see your real data!** 🎉 