import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider } from '@/lib/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CUBS Technical - Employee Management',
  description: 'Comprehensive employee database and document management system for CUBS Technical',
  keywords: 'employee management, visa tracking, document management, CUBS Technical',
  authors: [{ name: 'CUBS Technical' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  icons: {
    icon: '/assets/favicon.ico',
    shortcut: '/assets/favicon.ico',
    apple: '/assets/appicon.png',
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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
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