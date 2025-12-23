'use client';

import { useEffect } from 'react';
import { CapacitorService } from '@/lib/capacitor';
import { AuthService } from '@/lib/services/auth';
import { log } from '@/lib/utils/logger';

export default function CapacitorInit() {
  useEffect(() => {
    // Initialize Capacitor when the app loads
    CapacitorService.initialize();

    // Mobile-specific authentication initialization
    const initializeMobileAuth = async () => {
      try {
        log.info('CapacitorInit: Initializing mobile authentication...');

        // Ensure Supabase is properly configured for mobile
        if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNative) {
          log.info('CapacitorInit: Mobile app detected, configuring Supabase...');

          // Check if we have stored session data using safe storage
          const storedSession = typeof window !== 'undefined' ? localStorage.getItem('cubs-auth-token') : null;
          if (storedSession) {
            log.info('CapacitorInit: Found stored session data, attempting restoration...');
          } else {
            log.info('CapacitorInit: No stored session data found');
          }

          // Restore mobile session if available
          const { session, error } = await AuthService.restoreMobileSession();

          if (error) {
            log.warn('CapacitorInit: Mobile session restoration failed:', error.message);
          } else if (session) {
            log.info('CapacitorInit: Mobile session restored successfully', {
              userId: session.user.id,
              expiresAt: session.expires_at
            });

            // Force a small delay to ensure the session is properly set
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verify the session is still active
            const { session: verifySession } = await AuthService.getSession();
            if (verifySession) {
              log.info('CapacitorInit: Session verification successful');
            } else {
              log.warn('CapacitorInit: Session verification failed');
            }
          } else {
            log.info('CapacitorInit: No mobile session to restore');
          }

          log.info('CapacitorInit: Mobile authentication configured successfully');
        } else {
          log.info('CapacitorInit: Web or non-native environment detected, skipping mobile auth init');
        }

      } catch (error) {
        log.error('CapacitorInit: Error during mobile auth initialization:', error);
        // Don't throw error to prevent app crashes
      }
    };

    // Handle Hardware Back Button (Android)
    const setupBackButton = async () => {
      try {
        if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNative) {
          const { App } = await import('@capacitor/app');
          App.addListener('backButton', ({ canGoBack }) => {
            if (canGoBack) {
              window.history.back();
            } else {
              const pathname = window.location.pathname;
              // Only exit if on main pages
              if (pathname === '/dashboard' || pathname === '/login' || pathname === '/') {
                App.exitApp();
              } else {
                // If on a sub-page but no history (rare), go to dashboard
                window.location.href = '/dashboard';
              }
            }
          });
        }
      } catch (error) {
        log.error('CapacitorInit: Error setting up back button:', error);
      }
    };

    initializeMobileAuth();
    setupBackButton();
  }, []);

  return null; // This component doesn't render anything
}



