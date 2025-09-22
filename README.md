## Documents performance: Materialized Views

For fastest loads on Documents, enable materialized views and set `NEXT_PUBLIC_USE_DOCS_MV=1`.

1. Run the SQL in `docs/sql/materialized_views.sql` on your Supabase project.
2. Create a scheduled refresh (e.g., every 5–15 minutes) or call the API:

```bash
curl -X POST https://<your-domain>/api/docs/refresh-views
```

3. Ensure the service role key is available in the environment for the API route.

# CUBS Technical Admin Portal

A comprehensive admin portal for managing employees, documents, and company operations with mobile app support.

## Features

- **Dashboard**: Analytics and overview of company operations
- **Employee Management**: Complete CRUD operations for employee records
- **Document Management**: File upload, organization, and sharing
- **Authentication**: Secure login with Supabase Auth
- **Mobile App**: Native iOS and Android apps via Capacitor
- **PWA Support**: Progressive Web App capabilities
- **Real-time Updates**: Live data synchronization
- **Offline Support**: Cached data and pending operations queue

## Tech Stack

- **Frontend**: Next.js 13+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Storage**: Backblaze B2 for document storage
- **Mobile**: Capacitor for native iOS/Android apps
- **Email**: Gmail SMTP for notifications
- **Deployment**: Vercel (web), GitHub Actions (mobile builds)

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Backblaze B2 account
- Gmail account with App Password

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cubs-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3002](http://localhost:3002)

## Mobile App Development

### Setup Mobile Environment

**Windows (PowerShell):**
```powershell
.\scripts\setup-mobile.ps1
```

**macOS/Linux (Bash):**
```bash
./scripts/setup-mobile.sh
```

### Build Mobile Apps

**Local Development:**
```bash
# Build for mobile
npm run build:mobile

# Open in Android Studio
npm run cap:open:android

# Open in Xcode (macOS only)
npm run cap:open:ios
```

**Cloud Builds:**
- Push to `main` branch to trigger automated builds
- Download artifacts from GitHub Actions
- Manual builds via workflow dispatch

### Mobile App Features

- Native iOS and Android apps
- Offline data caching
- Push notifications (configurable)
- Biometric authentication
- Native file picker
- Status bar customization
- Keyboard management

## Environment Variables

Create a `.env` file with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gmail SMTP Email Service (Primary Email Provider)
GMAIL_USER=technicalcubs@gmail.com
GMAIL_APP_PASSWORD=your-app-password-here
GMAIL_FROM_NAME=CUBS Technical

# Backblaze B2
B2_APPLICATION_KEY_ID=your_b2_key_id
B2_APPLICATION_KEY=your_b2_application_key
B2_BUCKET_NAME=your_bucket_name
B2_ENDPOINT=your_b2_endpoint
B2_BUCKET_ID=your_bucket_id
```

## Available Scripts

### Web Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

### Mobile Development
- `npm run build:mobile` - Build for mobile platforms
- `npm run cap:init` - Initialize Capacitor
- `npm run cap:add:android` - Add Android platform
- `npm run cap:add:ios` - Add iOS platform
- `npm run cap:sync` - Sync web assets to native platforms
- `npm run cap:open:android` - Open in Android Studio
- `npm run cap:open:ios` - Open in Xcode

### Email Service Testing
- `npm run test:email` - Test email service via command line
- `POST /api/test-email` - Test email service via API endpoint

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── (admin)/           # Admin routes
│   ├── (auth)/            # Authentication routes
│   ├── dashboard/         # Dashboard page
│   ├── employees/         # Employee management
│   ├── documents/         # Document management
│   └── settings/          # Settings page
├── components/            # Reusable React components
├── lib/                   # Utility libraries
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── public/                # Static assets
├── android/               # Android native project (Capacitor)
├── ios/                   # iOS native project (Capacitor)
├── docs/                  # Documentation
└── scripts/               # Build and setup scripts
```

## Deployment

### Web App (Vercel)

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Mobile Apps

#### Android
1. Build release AAB: `./gradlew bundleRelease`
2. Upload to Google Play Console
3. Complete store listing and review process

#### iOS
1. Build release IPA with proper signing
2. Upload to App Store Connect
3. Complete review process

### Cloud Builds

The GitHub Actions workflow automatically builds both platforms:
- **Android**: APK (debug) and AAB (release)
- **iOS**: IPA (development build)

## Testing

### Web App
```bash
npm run test:e2e    # Run Playwright tests
npm run test:unit   # Run unit tests (if configured)
```

### Mobile App
- Test on physical devices
- Use Android Studio emulator
- Use Xcode simulator (macOS)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Documentation

- [Mobile Deployment Guide](docs/mobile-deployment.md)
- [API Documentation](docs/api.md)
- [Database Schema](docs/database.md)

## Support

For issues and questions:
- Check the documentation
- Review GitHub Issues
- Contact the development team

## License

This project is proprietary software. All rights reserved. 