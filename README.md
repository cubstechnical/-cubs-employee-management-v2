# CUBS Technical - Visa Management System

A modern, Apple-inspired web application for managing employee databases, documents, and visa expiry notifications for CUBS Technical.

## 🚀 Features

### Core Functionality
- **Employee Management**: Complete CRUD operations for employee records
- **Document Management**: Secure file upload and storage with Backblaze B2
- **Visa Tracking**: Automated visa expiry monitoring and email notifications
- **Department Management**: Organize employees by departments
- **Approval Workflows**: Streamlined approval processes for various requests
- **Real-time Notifications**: In-app and email notifications for important events

### Technical Features
- **Modern UI/UX**: Apple-inspired minimalistic design with smooth animations
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Updates**: Live data synchronization across all devices
- **Secure Authentication**: Supabase-powered authentication with role-based access
- **File Storage**: Scalable document storage with Backblaze B2
- **Email Notifications**: Automated email reminders via SendGrid
- **Type Safety**: Full TypeScript implementation with strict type checking

## 🏗️ Architecture

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful, customizable icons
- **Framer Motion**: Smooth animations and transitions
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation

### Backend Services
- **Supabase**: Authentication, database, and real-time features
- **Backblaze B2**: Document storage and file management
- **SendGrid**: Email notifications and reminders

### Database Schema
```sql
-- Employees table
employees (
  id, employee_id, first_name, last_name, email, phone,
  department, position, hire_date, salary, status,
  visa_expiry_date, passport_number, visa_type,
  created_at, updated_at
)

-- Documents table
documents (
  id, employee_id, name, type, file_url, file_size,
  mime_type, uploaded_by, created_at, updated_at
)

-- Notifications table
notifications (
  id, user_id, title, message, type, read, created_at
)

-- Visa notifications table
visa_notifications (
  id, employee_id, employee_name, visa_expiry_date,
  days_remaining, notification_sent, last_sent_at, created_at
)
```

## 📱 Screen Inventory

### Admin Screens (9 screens)
- Dashboard (`/admin/dashboard`)
- Employees Management (`/admin/employees-apple`)
- Employee Details (`/admin/employees/[id]`)
- New Employee (`/admin/employees/new`)
- Documents Management (`/admin/documents-apple`)
- Notifications (`/admin/notifications`)
- Approvals (`/admin/approvals`)
- Employee Mappings (`/admin/employee-mappings`)
- Component Showcase (`/admin/component-showcase`)

### Main App Screens (9 screens)
- Home Dashboard (`/`)
- Admin Dashboard (`/admin-dashboard`)
- Employees (`/employees`)
- Documents (`/documents`)
- Departments (`/departments`)
- Visa Form (`/visa-form`)
- Notifications (`/notifications`)
- Visa Notifications (`/visa-notifications`)
- Settings (`/settings`)

### Authentication Screens (6 screens)
- Login (`/login`)
- Register (`/register`)
- Forgot Password (`/forgot-password`)
- Reset Password (`/reset-password`)
- Pending (`/pending`)
- Callback (`/callback`)

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Backblaze B2 account
- SendGrid account

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cubs-technical-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file with your credentials:
   ```env
   # Supabase Configuration
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # SendGrid Email Configuration
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=your_from_email

   # Backblaze B2 Storage Configuration
   B2_APPLICATION_KEY_ID=your_b2_key_id
   B2_APPLICATION_KEY=your_b2_application_key
   B2_BUCKET_NAME=your_bucket_name
   B2_ENDPOINT=your_b2_endpoint
   B2_BUCKET_ID=your_bucket_id

   # App Configuration
   EXPO_PUBLIC_APP_NAME=CUBS Visa Management
   EXPO_PUBLIC_APP_VERSION=1.0.0
   ```

4. **Database Setup**
   - Create a new Supabase project
   - Run the database migrations (see `/database` folder)
   - Set up Row Level Security (RLS) policies

5. **Storage Setup**
   - Create a Backblaze B2 bucket
   - Configure CORS settings for file uploads
   - Set up bucket permissions

6. **Email Setup**
   - Configure SendGrid account
   - Set up email templates
   - Verify sender domain

7. **Run the development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Similar to Vercel setup
- **Railway**: Full-stack deployment
- **AWS Amplify**: AWS ecosystem integration

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/reset-password` - Password reset

### Employees
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `GET /api/employees/[id]` - Get employee details
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Delete employee

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document
- `GET /api/documents/[id]` - Get document
- `DELETE /api/documents/[id]` - Delete document

### Notifications
- `GET /api/notifications` - List notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/[id]/read` - Mark as read

## 🔧 Development

### Code Structure
```
├── app/                    # Next.js App Router pages
│   ├── (admin)/           # Admin-only pages
│   ├── (auth)/            # Authentication pages
│   ├── (tabs)/            # Main app pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── layout/           # Layout components
│   └── ui/               # UI components
├── lib/                  # Utility libraries
├── types/                # TypeScript type definitions
├── utils/                # Helper functions
└── public/               # Static assets
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Husky**: Git hooks for code quality

## 🔒 Security

### Authentication
- Supabase Auth with JWT tokens
- Role-based access control (RBAC)
- Session management
- Password policies

### Data Protection
- Row Level Security (RLS) in Supabase
- Encrypted data transmission (HTTPS)
- Secure file uploads with validation
- Input sanitization and validation

### API Security
- Rate limiting
- CORS configuration
- Request validation
- Error handling without data leakage

## 📈 Performance

### Optimization
- Next.js Image optimization
- Code splitting and lazy loading
- Caching strategies
- Database query optimization

### Monitoring
- Error tracking with Sentry
- Performance monitoring
- User analytics
- Uptime monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write unit tests for new features
- Update documentation
- Follow the existing code style
- Test on multiple devices/browsers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Complete employee management system
- Document upload and management
- Visa tracking and notifications
- Admin dashboard and analytics
- Responsive design implementation

---

Built with ❤️ by the CUBS Technical team 

A modern, Apple-inspired web application for managing employee databases, documents, and visa expiry notifications for CUBS Technical.

## 🚀 Features

### Core Functionality
- **Employee Management**: Complete CRUD operations for employee records
- **Document Management**: Secure file upload and storage with Backblaze B2
- **Visa Tracking**: Automated visa expiry monitoring and email notifications
- **Department Management**: Organize employees by departments
- **Approval Workflows**: Streamlined approval processes for various requests
- **Real-time Notifications**: In-app and email notifications for important events

### Technical Features
- **Modern UI/UX**: Apple-inspired minimalistic design with smooth animations
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Updates**: Live data synchronization across all devices
- **Secure Authentication**: Supabase-powered authentication with role-based access
- **File Storage**: Scalable document storage with Backblaze B2
- **Email Notifications**: Automated email reminders via SendGrid
- **Type Safety**: Full TypeScript implementation with strict type checking

## 🏗️ Architecture

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful, customizable icons
- **Framer Motion**: Smooth animations and transitions
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation

### Backend Services
- **Supabase**: Authentication, database, and real-time features
- **Backblaze B2**: Document storage and file management
- **SendGrid**: Email notifications and reminders

### Database Schema
```sql
-- Employees table
employees (
  id, employee_id, first_name, last_name, email, phone,
  department, position, hire_date, salary, status,
  visa_expiry_date, passport_number, visa_type,
  created_at, updated_at
)

-- Documents table
documents (
  id, employee_id, name, type, file_url, file_size,
  mime_type, uploaded_by, created_at, updated_at
)

-- Notifications table
notifications (
  id, user_id, title, message, type, read, created_at
)

-- Visa notifications table
visa_notifications (
  id, employee_id, employee_name, visa_expiry_date,
  days_remaining, notification_sent, last_sent_at, created_at
)
```

## 📱 Screen Inventory

### Admin Screens (9 screens)
- Dashboard (`/admin/dashboard`)
- Employees Management (`/admin/employees-apple`)
- Employee Details (`/admin/employees/[id]`)
- New Employee (`/admin/employees/new`)
- Documents Management (`/admin/documents-apple`)
- Notifications (`/admin/notifications`)
- Approvals (`/admin/approvals`)
- Employee Mappings (`/admin/employee-mappings`)
- Component Showcase (`/admin/component-showcase`)

### Main App Screens (9 screens)
- Home Dashboard (`/`)
- Admin Dashboard (`/admin-dashboard`)
- Employees (`/employees`)
- Documents (`/documents`)
- Departments (`/departments`)
- Visa Form (`/visa-form`)
- Notifications (`/notifications`)
- Visa Notifications (`/visa-notifications`)
- Settings (`/settings`)

### Authentication Screens (6 screens)
- Login (`/login`)
- Register (`/register`)
- Forgot Password (`/forgot-password`)
- Reset Password (`/reset-password`)
- Pending (`/pending`)
- Callback (`/callback`)

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Backblaze B2 account
- SendGrid account

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cubs-technical-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file with your credentials:
   ```env
   # Supabase Configuration
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # SendGrid Email Configuration
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=your_from_email

   # Backblaze B2 Storage Configuration
   B2_APPLICATION_KEY_ID=your_b2_key_id
   B2_APPLICATION_KEY=your_b2_application_key
   B2_BUCKET_NAME=your_bucket_name
   B2_ENDPOINT=your_b2_endpoint
   B2_BUCKET_ID=your_bucket_id

   # App Configuration
   EXPO_PUBLIC_APP_NAME=CUBS Visa Management
   EXPO_PUBLIC_APP_VERSION=1.0.0
   ```

4. **Database Setup**
   - Create a new Supabase project
   - Run the database migrations (see `/database` folder)
   - Set up Row Level Security (RLS) policies

5. **Storage Setup**
   - Create a Backblaze B2 bucket
   - Configure CORS settings for file uploads
   - Set up bucket permissions

6. **Email Setup**
   - Configure SendGrid account
   - Set up email templates
   - Verify sender domain

7. **Run the development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Similar to Vercel setup
- **Railway**: Full-stack deployment
- **AWS Amplify**: AWS ecosystem integration

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/reset-password` - Password reset

### Employees
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `GET /api/employees/[id]` - Get employee details
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Delete employee

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document
- `GET /api/documents/[id]` - Get document
- `DELETE /api/documents/[id]` - Delete document

### Notifications
- `GET /api/notifications` - List notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/[id]/read` - Mark as read

## 🔧 Development

### Code Structure
```
├── app/                    # Next.js App Router pages
│   ├── (admin)/           # Admin-only pages
│   ├── (auth)/            # Authentication pages
│   ├── (tabs)/            # Main app pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── layout/           # Layout components
│   └── ui/               # UI components
├── lib/                  # Utility libraries
├── types/                # TypeScript type definitions
├── utils/                # Helper functions
└── public/               # Static assets
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Husky**: Git hooks for code quality

## 🔒 Security

### Authentication
- Supabase Auth with JWT tokens
- Role-based access control (RBAC)
- Session management
- Password policies

### Data Protection
- Row Level Security (RLS) in Supabase
- Encrypted data transmission (HTTPS)
- Secure file uploads with validation
- Input sanitization and validation

### API Security
- Rate limiting
- CORS configuration
- Request validation
- Error handling without data leakage

## 📈 Performance

### Optimization
- Next.js Image optimization
- Code splitting and lazy loading
- Caching strategies
- Database query optimization

### Monitoring
- Error tracking with Sentry
- Performance monitoring
- User analytics
- Uptime monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write unit tests for new features
- Update documentation
- Follow the existing code style
- Test on multiple devices/browsers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Complete employee management system
- Document upload and management
- Visa tracking and notifications
- Admin dashboard and analytics
- Responsive design implementation

---

Built with ❤️ by the CUBS Technical team 