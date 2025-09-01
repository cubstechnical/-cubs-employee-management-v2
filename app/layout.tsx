import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClientLayout } from '@/components/layout/ClientLayout'
import AppWrapper from '@/components/layout/AppWrapper'
import { QueryProvider } from '@/components/providers/QueryProvider'
import PerformanceMonitor from '@/components/utils/PerformanceMonitor'

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
      { url: '/assets/appicon-512x512.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/appicon-512x512.png', sizes: '192x192', type: 'image/png' },
      { url: '/assets/appicon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/assets/appicon-512x512.png',
    apple: [
      { url: '/assets/appicon-512x512.png', sizes: '180x180', type: 'image/png' },
      { url: '/assets/appicon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    other: [
      { rel: 'apple-touch-icon-precomposed', url: '/assets/appicon-512x512.png' },
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
        url: '/assets/appicon-512x512.png',
        width: 512,
        height: 512,
        alt: 'CUBS Technical App Icon',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CUBS Technical - Employee Management',
    description: 'Comprehensive employee database and document management system for CUBS Technical.',
    images: ['/assets/appicon-512x512.png'],
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
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CUBS Admin" />
        <meta name="application-name" content="CUBS Admin" />
        <meta name="msapplication-TileColor" content="#111827" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#111827" />
        
        {/* Resource hints for performance */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://s3.us-east-005.backblazeb2.com" />
        
        {/* App icons and manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/assets/appicon-512x512.png" sizes="32x32" />
        <link rel="icon" href="/assets/appicon-512x512.png" sizes="192x192" />
        <link rel="icon" href="/assets/appicon-512x512.png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/assets/appicon-512x512.png" />
        <link rel="apple-touch-icon" href="/assets/appicon-512x512.png" sizes="180x180" />
      </head>
      <body className={`${inter.variable} font-sans`} suppressHydrationWarning={true}>
        <PerformanceMonitor />
        <QueryProvider>
          <ClientLayout>
            <AppWrapper>
              {children}
            </AppWrapper>
          </ClientLayout>
        </QueryProvider>
      </body>
    </html>
  )
}