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

        // Restore mobile session if available
        const { session, error } = await AuthService.restoreMobileSession();

        if (error) {
          log.warn('CapacitorInit: Mobile session restoration failed:', error.message);
        } else if (session) {
          log.info('CapacitorInit: Mobile session restored successfully', {
            userId: session.user.id,
            expiresAt: session.expires_at
          });
        } else {
          log.info('CapacitorInit: No mobile session to restore');
        }

        // Ensure mobile app is properly configured for authentication
        if (typeof window !== 'undefined' && window.Capacitor) {
          log.info('CapacitorInit: Mobile app detected, authentication configured');
        }

      } catch (error) {
        log.error('CapacitorInit: Error during mobile auth initialization:', error);
      }
    };

    initializeMobileAuth();
  }, []);

  return null; // This component doesn't render anything
}



