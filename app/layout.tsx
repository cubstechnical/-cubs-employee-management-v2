import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider } from '@/lib/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
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
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#111827" />
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                  border: '1px solid var(--toast-border)',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}