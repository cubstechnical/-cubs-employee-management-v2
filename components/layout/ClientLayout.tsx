'use client';

import { ThemeProvider } from '@/lib/theme';
import { SimpleAuthProvider } from '@/lib/contexts/SimpleAuthContext';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import OfflineIndicator from '@/components/ui/OfflineIndicator';
import { useMobileApp } from '@/hooks/useMobileApp';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  // Initialize mobile app functionality
  useMobileApp();

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <SimpleAuthProvider>
          {children}
          <OfflineIndicator />
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
        </SimpleAuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
