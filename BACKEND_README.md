# 🏗️ Backend Architecture Documentation

## Overview

The CUBS Technical Admin Portal backend is built using **Next.js 14 API Routes** with a comprehensive service-oriented architecture. The system integrates multiple external services for authentication, database, file storage, and email notifications.

## 🏛️ Architecture Stack

### Core Technologies
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **File Storage**: Backblaze B2 + Supabase Storage (metadata)
- **Email Service**: SendGrid
- **Deployment**: Vercel (recommended)

### External Services Integration
- ✅ **Supabase**: Authentication, Database, Real-time subscriptions
- ✅ **Backblaze B2**: Document storage with S3-compatible API
- ✅ **SendGrid**: Email notifications and automated alerts
- ✅ **AWS SDK**: S3 client for Backblaze B2 integration

## 📁 Project Structure

```
app/
├── api/                          # API Routes
│   ├── auth/                     # Authentication endpoints
│   │   ├── login/route.ts
│   │   └── logout/route.ts
│   ├── employees/                # Employee management
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── documents/                # Document management
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── admins/                   # Admin management
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── notifications/            # Visa expiry alerts
│   │   └── route.ts
│   ├── dashboard/                # Analytics and stats
│   │   └── route.ts
│   └── cron/                     # Automated tasks
│       └── visa-notifications/route.ts

lib/
├── api/
│   └── middleware.ts             # Authentication & authorization middleware
├── services/
│   ├── employees.ts              # Employee business logic
│   ├── admins.ts                 # Admin management logic
│   ├── fileUpload.ts             # File upload & storage
│   ├── email.ts                  # Email notifications
│   └── visaNotifications.ts      # Automated visa alerts
└── supabase/
    └── client.ts                 # Supabase client configuration
```

## 🔐 Authentication & Authorization

### Middleware System
The backend uses a three-tier authentication system:

1. **`withAuth`**: Basic authentication for all users
2. **`withAdminAuth`**: Admin-level access (admin + master_admin)
3. **`withMasterAdminAuth`**: Master admin-only access

### Role-Based Access Control
- **`master_admin`**: Full system access, can manage other admins
- **`admin`**: CRUD operations on employees and documents
- **Approval System**: New admins require master admin approval

## 📊 API Endpoints

### Authentication
```
POST /api/auth/login          # User login
POST /api/auth/logout         # User logout
```

### Employee Management
```
GET    /api/employees         # List employees with filters
POST   /api/employees         # Create new employee
GET    /api/employees/[id]    # Get employee details
PUT    /api/employees/[id]    # Update employee
DELETE /api/employees/[id]    # Delete employee
```

### Document Management
```
GET    /api/documents         # List documents
POST   /api/documents         # Upload document
GET    /api/documents/[id]    # Get document with download URL
PUT    /api/documents/[id]    # Update document metadata
DELETE /api/documents/[id]    # Delete document
```

### Admin Management
```
GET    /api/admins            # List admins
POST   /api/admins            # Invite new admin
GET    /api/admins/[id]       # Get admin details
PUT    /api/admins/[id]       # Update/approve admin
DELETE /api/admins/[id]       # Delete admin
```

### Notifications & Analytics
```
GET    /api/notifications     # Visa expiry alerts
POST   /api/notifications     # Manual notification check
GET    /api/dashboard         # Analytics and statistics
```

### Automated Tasks
```
POST   /api/cron/visa-notifications  # Automated visa alerts
GET    /api/cron/visa-notifications  # Manual trigger (testing)
```

## 🔄 Automated Visa Expiry Notifications

### Notification Schedule
The system automatically sends email notifications at:
- **90 days** before expiry
- **60 days** before expiry
- **30 days** before expiry
- **15 days** before expiry
- **7 days** before expiry

### Implementation
- **Service**: `VisaNotificationService`
- **Email Templates**: Professional HTML emails with urgency indicators
- **Tracking**: Database flags prevent duplicate notifications
- **Cron Job**: Automated daily checks via API endpoint

### Email Features
- ✅ **Responsive Design**: Mobile-friendly email templates
- ✅ **Urgency Indicators**: Color-coded based on days remaining
- ✅ **Professional Branding**: CUBS Technical branding
- ✅ **Action Items**: Clear instructions for visa renewal

## 📁 File Storage System

### Architecture
- **Primary Storage**: Backblaze B2 (cost-effective, S3-compatible)
- **Metadata Storage**: Supabase PostgreSQL
- **File Organization**: `documents/{employee_id}/{timestamp}-{filename}`

### Features
- ✅ **File Validation**: Size and type restrictions
- ✅ **Signed URLs**: Secure, time-limited download links
- ✅ **Metadata Management**: Document categorization and tracking
- ✅ **Cleanup**: Automatic file deletion with metadata

### Supported File Types
- PDF documents
- JPEG/JPG images
- PNG images
- Word documents (DOC/DOCX)

## 📧 Email Service Integration

### SendGrid Configuration
- **Templates**: Professional HTML email templates
- **Automation**: Scheduled visa expiry notifications
- **Notifications**: Admin approval and system alerts

### Email Types
1. **Visa Expiry Notifications**: Automated alerts with urgency levels
2. **Admin Invitations**: Welcome emails for new admins
3. **Approval Notifications**: Account approval confirmations
4. **System Alerts**: Important system notifications

## 🔒 Security Features

### Authentication Security
- **JWT Tokens**: Secure session management
- **Role-Based Access**: Granular permission system
- **Approval Workflow**: Admin account approval process

### Data Security
- **Input Validation**: Comprehensive field validation
- **SQL Injection Protection**: Supabase parameterized queries
- **File Upload Security**: Type and size validation
- **CORS Protection**: Configured origin restrictions

### API Security
- **Rate Limiting**: Request throttling
- **Error Handling**: Secure error responses
- **Logging**: Comprehensive audit trails

## 🚀 Deployment Configuration

### Environment Variables Required
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# SendGrid
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Backblaze B2
BACKBLAZE_ACCESS_KEY_ID=your_access_key
BACKBLAZE_SECRET_ACCESS_KEY=your_secret_key
BACKBLAZE_BUCKET_NAME=your_bucket_name

# Security
CRON_SECRET=your_cron_secret
NEXTAUTH_SECRET=your_nextauth_secret
```

### Vercel Deployment
1. **Connect Repository**: Link your GitHub repository
2. **Environment Variables**: Configure all required variables
3. **Build Settings**: Next.js 14 with TypeScript
4. **Cron Jobs**: Set up automated visa notification checks

### Cron Job Setup
```bash
# Daily at 9:00 AM UTC
0 9 * * * curl -X POST https://your-domain.vercel.app/api/cron/visa-notifications \
  -H "Authorization: Bearer your_cron_secret"
```

## 📈 Performance Optimization

### Database Optimization
- **Indexed Queries**: Optimized for employee and document lookups
- **Pagination**: Efficient large dataset handling
- **Caching**: Supabase edge caching

### File Upload Optimization
- **Streaming**: Efficient large file handling
- **Parallel Processing**: Concurrent upload operations
- **CDN Integration**: Backblaze B2 CDN for fast downloads

### API Performance
- **Parallel Requests**: Concurrent data fetching
- **Response Caching**: Static data caching
- **Error Recovery**: Graceful failure handling

## 🧪 Testing & Monitoring

### API Testing
- **Endpoint Testing**: Comprehensive API route testing
- **Authentication Testing**: Role-based access verification
- **Error Handling**: Edge case testing

### Monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Response time tracking
- **Usage Analytics**: API usage statistics

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Backblaze B2 account
- SendGrid account

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev

# Run type checking
npm run type-check

# Run build
npm run build
```

### Database Setup
1. **Supabase Project**: Create new project
2. **Tables**: Import schema from `database/schema.sql`
3. **Policies**: Configure RLS policies
4. **Functions**: Set up database functions

## 📋 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "error": "Error description",
  "status": 400
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## 🔄 Database Schema

### Core Tables
- **`users`**: Admin user profiles and authentication
- **`employee_table`**: Employee data with visa information
- **`documents`**: Document metadata and file references
- **`admin_invites`**: Pending admin invitations

### Key Relationships
- Users → Employee management
- Employees → Document associations
- Admin invites → User approval workflow

## 🎯 Future Enhancements

### Planned Features
- **Real-time Notifications**: WebSocket integration
- **Advanced Analytics**: Machine learning insights
- **Mobile API**: Native mobile app support
- **Multi-language Support**: Internationalization
- **Advanced Reporting**: Custom report generation

### Scalability Considerations
- **Database Sharding**: Horizontal scaling
- **Microservices**: Service decomposition
- **CDN Integration**: Global content delivery
- **Load Balancing**: Traffic distribution

---

## 📞 Support & Documentation

For technical support or questions about the backend architecture, please refer to:
- **API Documentation**: `/api/docs` (when implemented)
- **Code Comments**: Comprehensive inline documentation
- **TypeScript Types**: Strong typing for all interfaces
- **Error Handling**: Detailed error messages and logging

The backend architecture is designed for scalability, security, and maintainability, providing a robust foundation for the CUBS Technical Admin Portal. 