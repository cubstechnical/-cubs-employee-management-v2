## Documents performance: Materialized Views

For fastest loads on Documents, enable materialized views and set `NEXT_PUBLIC_USE_DOCS_MV=1`.

1. Run the SQL in `docs/sql/materialized_views.sql` on your Supabase project.
2. Create a scheduled refresh (e.g., every 5–15 minutes) or call the API:

```bash
curl -X POST https://<your-domain>/api/docs/refresh-views
```

3. Ensure the service role key is available in the environment for the API route.

# CUBS Employee Management System

A modern, secure, and performant employee management system built with Next.js, Supabase, and Backblaze B2.

## 🚀 Features

- **Secure Authentication**: Supabase Auth with role-based access control
- **Document Management**: Upload, preview, and manage employee documents
- **Employee Database**: Comprehensive employee information management
- **Visa Tracking**: Automated visa expiry notifications
- **Performance Optimized**: Caching, lazy loading, and optimized queries
- **Type Safety**: Full TypeScript implementation with strict checking
- **Automated Quality Control**: Pre-commit hooks prevent broken code

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Storage**: Backblaze B2 (S3-compatible)
- **Styling**: Tailwind CSS, Lucide React Icons
- **Forms**: React Hook Form + Zod validation
- **Notifications**: React Hot Toast, SendGrid Email
- **Quality**: ESLint, Prettier, Husky pre-commit hooks

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Backblaze B2 account
- SendGrid account (for email notifications)

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd cubs-employee-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   Fill in your environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `BACKBLAZE_ACCESS_KEY_ID`
   - `BACKBLAZE_SECRET_ACCESS_KEY`
   - `SENDGRID_API_KEY`

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Pre-commit Hooks

This project uses Husky and lint-staged to ensure code quality:

- **TypeScript checking**: All `.ts` and `.tsx` files are type-checked before commit
- **Automatic blocking**: Commits with TypeScript errors are automatically blocked

### Performance Optimizations

- **Caching**: 5-minute cache for document folders
- **Lazy Loading**: Components and data loaded on demand
- **Query Optimization**: Reduced database queries with efficient aggregation
- **Debounced Search**: 50ms debounce for instant search response

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── (admin)/           # Admin-only routes
│   ├── (auth)/            # Authentication routes
│   ├── (tabs)/            # Main application tabs
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
├── lib/                   # Utility libraries
│   ├── services/          # Business logic services
│   ├── supabase/          # Supabase configuration
│   └── contexts/          # React contexts
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
└── supabase/              # Supabase Edge Functions
```

## 🔐 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Environment Variables**: Secure configuration management
- **Input Validation**: Zod schema validation
- **Type Safety**: TypeScript prevents runtime errors
- **Pre-commit Hooks**: Automated code quality checks

## 📊 Database Schema

The system uses the following main tables:
- `profiles` - User profiles and authentication
- `employee_table` - Employee information
- `employee_documents` - Document metadata and storage paths
- `admin_users` - Admin user management

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application: `npm run build`
2. Start the production server: `npm run start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit your changes: `git commit -m 'feat: Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions, please contact the development team.

---

**Built with ❤️ for CUBS Technical** 