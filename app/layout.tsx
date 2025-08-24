import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClientLayout } from '@/components/layout/ClientLayout'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://cubsgroups.com'),
  title: 'CUBS Technical - Employee Management',
  description: 'Comprehensive employee database and document management system for CUBS Technical',
  keywords: 'employee management, visa tracking, document management, CUBS Technical',
  authors: [{ name: 'CUBS Technical' }],
  robots: 'index, follow',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/assets/appicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/appicon.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/assets/appicon.png',
    apple: [
      { url: '/assets/appicon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'apple-touch-icon-precomposed', url: '/assets/appicon.png' },
      { rel: 'mask-icon', url: '/assets/icon.svg', color: '#000000' },
    ],
  },
  openGraph: {
    title: 'CUBS Technical - Employee Management',
    description: 'Comprehensive employee database and document management system',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/assets/logo.png',
        width: 1200,
        height: 630,
        alt: 'CUBS Technical Logo',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://s3.us-east-005.backblazeb2.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/assets/favicon.png" sizes="32x32" />
        <meta name="theme-color" content="#111827" />
        {/* Web-vitals to Sentry (if Sentry is present) */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              function send(metric){
                var S = (window).Sentry; if (!S || !S.captureMessage) return;
                S.captureMessage('web-vital', { level: 'info', tags: { metric: metric.name }, extra: metric });
              }
              var w = window; w.__onWebVitals = send;
            } catch(e) {}
          })();
        `}} />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}