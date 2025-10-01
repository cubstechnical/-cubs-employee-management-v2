import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/mobile-optimizations.css'
import '../styles/mobile-pwa.css'
import '../styles/mobile-crud-optimizations.css'
import '../styles/login-background-image.css'
import PWARegistration from '@/components/pwa/PWARegistration'
import CapacitorInit from '@/components/capacitor/CapacitorInit'
import dynamic from 'next/dynamic'

// Dynamically import PerformanceMonitor to prevent chunk loading issues
const PerformanceMonitor = dynamic(() => import('@/components/ui/PerformanceMonitor').then(mod => ({ default: mod.PerformanceMonitor })), {
  loading: () => null
})
import { ClientOnly } from '@/components/common/ClientOnly'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { suppressMobileWarnings } from '@/utils/mobileDetection'
import { initializeEnvironment } from '@/lib/utils/environment'
import { Suspense } from 'react'
import { MobileErrorBoundary } from '@/components/ui/MobileErrorBoundary'
import MobileStatusIndicator from '@/components/ui/MobileStatusIndicator'
import { SimpleAuthProvider } from '@/lib/contexts/SimpleAuthContext'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ThemeProvider } from '@/lib/theme'
// Debug overlay removed for production
// import MobileDebugOverlay from '@/components/debug/MobileDebugOverlay'
import HideSplashScreen from '@/components/capacitor/HideSplashScreen'
import NetworkErrorHandler from '@/components/ui/NetworkErrorHandler'
import { Toaster } from 'react-hot-toast'
import OfflineIndicator from '@/components/ui/OfflineIndicator'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: true, // Enable preload for faster font loading
  variable: '--font-inter', // CSS variable for better performance
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://cubsgroups.com'),
  title: {
    default: 'CUBS Technical - Employee Management',
    template: '%s | CUBS Technical'
  },
  description: 'Comprehensive employee database and document management system for CUBS Technical. Track employee visas, manage documents, and streamline HR processes.',
  keywords: ['employee management', 'visa tracking', 'document management', 'CUBS Technical', 'HR system', 'employee database', 'visa management', 'document storage'],
  authors: [{ name: 'CUBS Technical', url: 'https://cubsgroups.com' }],
  creator: 'CUBS Technical',
  publisher: 'CUBS Technical',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/assets/cubs.webp', sizes: '32x32', type: 'image/webp' },
      { url: '/assets/cubs.webp', sizes: '192x192', type: 'image/webp' },
      { url: '/assets/cubs.webp', sizes: '512x512', type: 'image/webp' },
    ],
    shortcut: '/assets/cubs.webp',
    apple: [
      { url: '/assets/cubs.webp', sizes: '180x180', type: 'image/webp' },
      { url: '/assets/cubs.webp', sizes: '512x512', type: 'image/webp' },
    ],
    other: [
      { rel: 'apple-touch-icon-precomposed', url: '/assets/cubs.webp' },
      { rel: 'mask-icon', url: '/assets/icon.svg', color: '#111827' },
    ],
  },
  openGraph: {
    title: 'CUBS Technical - Employee Management',
    description: 'Comprehensive employee database and document management system for CUBS Technical. Track employee visas, manage documents, and streamline HR processes.',
    type: 'website',
    locale: 'en_US',
    url: 'https://cubsgroups.com',
    siteName: 'CUBS Technical',
    images: [
      {
        url: '/assets/cubs.webp',
        width: 512,
        height: 512,
        alt: 'CUBS Technical Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CUBS Technical - Employee Management',
    description: 'Comprehensive employee database and document management system for CUBS Technical.',
    images: ['/assets/cubs.webp'],
  },
  alternates: {
    canonical: 'https://cubsgroups.com',
  },
  category: 'business',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // For static export, render everything client-side to avoid hydration issues
  const isStaticExport = process.env.BUILD_MOBILE === 'true';

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CUBS Admin" />
        <meta name="application-name" content="CUBS Admin" />
        <meta name="msapplication-TileColor" content="#d3194f" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#d3194f" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-orientations" content="portrait" />
        <meta name="mobile-web-app-status-bar-style" content="default" />

        {/* Resource hints for performance */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://s3.us-east-005.backblazeb2.com" />

        {/* App icons and manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/assets/cubs.webp" sizes="32x32" type="image/webp" />
        <link rel="icon" href="/assets/cubs.webp" sizes="192x192" type="image/webp" />
        <link rel="icon" href="/assets/cubs.webp" sizes="512x512" type="image/webp" />
        <link rel="apple-touch-icon" href="/assets/cubs.webp" />
        <link rel="apple-touch-icon" href="/assets/cubs.webp" sizes="180x180" />
      </head>
      <body className={`${inter.variable} font-sans`} suppressHydrationWarning={true}>
        <ErrorBoundary>
          <ThemeProvider>
            <SimpleAuthProvider>
              <QueryProvider>
                <Toaster position="top-right" />
                <OfflineIndicator />
                
                {/* Client-side initialization */}
                <ClientOnly fallback={null}>
                  {(() => {
                    suppressMobileWarnings();
                    initializeEnvironment();
                    return null;
                  })()}
                  
                  {/* PWA and Capacitor initialization */}
                  <PWARegistration />
                  <CapacitorInit />
                  
                  {/* Mobile components */}
                  <MobileErrorBoundary>
                    <MobileStatusIndicator />
                  </MobileErrorBoundary>
                  {/* Debug overlay removed for production */}
                  {/* <MobileDebugOverlay /> */}
                  <HideSplashScreen />
                  <NetworkErrorHandler />
                  
                  {/* Performance monitor for development */}
                  {process.env.NODE_ENV === 'development' && (
                    <div style={{ display: 'none' }}>
                      <ErrorBoundary fallback={<div />}>
                        <Suspense fallback={<div />}>
                          <PerformanceMonitor />
                        </Suspense>
                      </ErrorBoundary>
                    </div>
                  )}
                </ClientOnly>

                {/* Main content - no OptimizedLayout wrapper */}
                {children}
              </QueryProvider>
            </SimpleAuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}