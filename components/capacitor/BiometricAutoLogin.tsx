'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/SimpleAuthContext';
import { BiometricAuthService } from '@/lib/services/biometricAuth';
import { isCapacitorApp } from '@/utils/mobileDetection';
import { log } from '@/lib/utils/productionLogger';
import toast from 'react-hot-toast';

/**
 * BiometricAutoLogin Component
 * Automatically triggers biometric authentication on app launch
 * if user is not logged in and credentials are stored
 */
export default function BiometricAutoLogin() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    // Only run on mobile apps
    if (!isCapacitorApp()) {
      return;
    }

    // Don't run if already logged in
    if (user) {
      setHasAttempted(true);
      return;
    }

    // Wait for loading to complete
    if (isLoading) {
      return;
    }

    // Only attempt once per session
    if (hasAttempted) {
      return;
    }

    const attemptBiometricLogin = async () => {
      try {
        log.info('BiometricAutoLogin: Starting auto-login check...', {
          hasUser: !!user,
          isLoading,
          hasAttempted
        });

        // Check if biometric is available
        const available = await BiometricAuthService.isBiometricAvailable();
        log.info('BiometricAutoLogin: Biometric available:', available);
        
        if (!available) {
          log.info('BiometricAutoLogin: Biometric not available');
          setHasAttempted(true);
          return;
        }

        // Check if credentials are stored
        const hasCredentials = await BiometricAuthService.hasStoredCredentials();
        log.info('BiometricAutoLogin: Has stored credentials:', hasCredentials);
        
        if (!hasCredentials) {
          log.info('BiometricAutoLogin: No stored credentials');
          setHasAttempted(true);
          return;
        }

        log.info('BiometricAutoLogin: Credentials found, triggering biometric...');
        setHasAttempted(true);

        // Small delay to ensure app is ready
        await new Promise(resolve => setTimeout(resolve, 800));

        // Double-check user is still not logged in
        if (user) {
          log.info('BiometricAutoLogin: User already logged in, skipping');
          return;
        }

        // Trigger biometric authentication
        log.info('BiometricAutoLogin: Calling biometricSignIn...');
        const { user: biometricUser, error } = await BiometricAuthService.biometricSignIn();

        if (error) {
          log.warn('BiometricAutoLogin: Biometric login failed', error);
          // Silently fail - user can use manual login
          return;
        }

        if (biometricUser && biometricUser.id) {
          log.info('BiometricAutoLogin: Biometric login successful!', { userId: biometricUser.id });
          toast.success('Welcome back!');
          
          // Redirect to dashboard
          setTimeout(() => {
            router.replace('/dashboard');
          }, 300);
        } else {
          log.warn('BiometricAutoLogin: No user returned from biometric login');
        }
      } catch (error) {
        log.warn('BiometricAutoLogin: Error during auto-login', error);
        setHasAttempted(true);
      }
    };

    // Wait a bit for app to initialize, then try biometric
    const timer = setTimeout(() => {
      attemptBiometricLogin();
    }, 1500); // 1.5 seconds after component mounts to ensure everything is ready

    return () => {
      clearTimeout(timer);
    };
  }, [user, isLoading, hasAttempted, router]);

  return null; // This component doesn't render anything
}

