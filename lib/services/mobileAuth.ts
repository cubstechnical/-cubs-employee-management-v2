/**
 * Mobile-specific authentication utilities
 * Handles iPhone 13 and other mobile device authentication issues
 */

import { supabase, isSupabaseAvailable } from '@/lib/supabase/client';
import { log } from '@/lib/utils/productionLogger';
import { isCapacitorApp } from '@/utils/mobileDetection';
import { safeLocalStorage, safeClearAuthData } from '@/lib/utils/safeStorage';

export class MobileAuthService {
  /**
   * Enhanced session restoration for mobile devices with better error handling
   */
  static async restoreMobileSession(): Promise<{ session: any; error: any }> {
    if (!isCapacitorApp()) {
      return { session: null, error: null };
    }
    
    // Let Supabase handle session restoration automatically
    // Don't clear session storage - Supabase manages this

    try {
      log.info('MobileAuthService: Checking for existing Supabase session...');

      // Overall timeout for the entire operation to prevent hanging
      const overallTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Mobile session restoration timeout')), 5000)
      );

      const sessionOperation = async () => {
        // Just try to get the current session from Supabase
        // Supabase will automatically restore from localStorage if session exists
        const storedSession = null; // Don't check custom storage
        if (storedSession) {
          try {
            const sessionData = JSON.parse(storedSession);
            log.info('MobileAuthService: Found stored session data');

            // Validate token expiry
            const now = Math.floor(Date.now() / 1000);
            const expiresAt = sessionData.expires_at;

            if (expiresAt && expiresAt < now) {
              log.warn('MobileAuthService: Stored session expired, attempting refresh...');

              try {
                // Only attempt refresh if Supabase is available
                if (!isSupabaseAvailable) {
                  log.warn('MobileAuthService: Supabase not available, cannot refresh session');
                  safeLocalStorage.removeItem('cubs-auth-token');
                  return { session: null, error: new Error('Supabase not available') };
                }

                // Use timeout for refresh session to prevent hanging
                const refreshPromise = supabase.auth.refreshSession({
                  refresh_token: sessionData.refresh_token
                });

                const timeoutPromise = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Refresh timeout')), 5000)
                );

                const { data: refreshData, error: refreshError } = await Promise.race([
                  refreshPromise,
                  timeoutPromise
                ]) as any;

                if (refreshError || !refreshData?.session) {
                  log.warn('MobileAuthService: Session refresh failed:', refreshError);
                  safeLocalStorage.removeItem('cubs-auth-token');
                  return { session: null, error: refreshError };
                }

                // Update stored session using safe storage
                const success = safeLocalStorage.setItem('cubs-auth-token', JSON.stringify({
                  access_token: refreshData.session.access_token,
                  refresh_token: refreshData.session.refresh_token,
                  expires_at: refreshData.session.expires_at
                }));

                if (!success) {
                  log.warn('MobileAuthService: Failed to store refreshed session');
                }

                return { session: refreshData.session, error: null };
              } catch (refreshError) {
                log.warn('MobileAuthService: Session refresh error:', refreshError);
                safeLocalStorage.removeItem('cubs-auth-token');
                return { session: null, error: refreshError };
              }
            }

            // Session is still valid, set it
            if (!isSupabaseAvailable) {
              log.warn('MobileAuthService: Supabase not available, cannot set session');
              return { session: null, error: new Error('Supabase not available') };
            }

            // Use timeout for setSession to prevent hanging
            const setSessionPromise = supabase.auth.setSession({
              access_token: sessionData.access_token,
              refresh_token: sessionData.refresh_token,
            });

            const setSessionTimeout = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Set session timeout')), 5000)
            );

            const { data, error } = await Promise.race([
              setSessionPromise,
              setSessionTimeout
            ]) as any;

            if (error) {
              log.warn('MobileAuthService: Failed to set session:', error);
              safeLocalStorage.removeItem('cubs-auth-token');
              return { session: null, error };
            }

            return { session: data.session, error: null };
          } catch (parseError) {
            log.warn('MobileAuthService: Failed to parse stored session:', parseError);
            safeLocalStorage.removeItem('cubs-auth-token');
          }
        }

        // No stored session, try to get current session with timeout
        if (!isSupabaseAvailable) {
          log.warn('MobileAuthService: Supabase not available, cannot get session');
          return { session: null, error: new Error('Supabase not available') };
        }

        try {
          // Use timeout for getSession to prevent hanging
          const getSessionPromise = supabase.auth.getSession();
          const getSessionTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Get session timeout')), 5000)
          );

          const { data: { session }, error } = await Promise.race([
            getSessionPromise,
            getSessionTimeout
          ]) as any;

          return { session, error };
        } catch (getSessionError) {
          log.warn('MobileAuthService: Get session failed:', getSessionError);
          return { session: null, error: getSessionError };
        }
      };

      return await Promise.race([sessionOperation(), overallTimeout]) as { session: any; error: any; };
    } catch (error) {
      log.error('MobileAuthService: Session restoration error:', error);
      return { session: null, error };
    }
  }

  /**
   * Store session data for mobile persistence
   * NOTE: No longer needed - Supabase handles session persistence automatically
   */
  static storeMobileSession(session: any): void {
    if (!isCapacitorApp() || !session) return;
    // Supabase now handles session persistence automatically
    // No manual storage needed
    log.info('MobileAuthService: Session will be persisted by Supabase automatically');
  }

  /**
   * Clear mobile session data
   */
  static clearMobileSession(): void {
    if (!isCapacitorApp()) return;

    try {
      // Use safe storage wrapper for clearing
      safeClearAuthData();
      log.info('MobileAuthService: Mobile session data cleared');
    } catch (error) {
      log.warn('MobileAuthService: Failed to clear session data:', error);
    }
  }

  /**
   * Check if mobile app is properly initialized
   */
  static isMobileAppReady(): boolean {
    if (!isCapacitorApp()) return true;

    try {
      // Check if Capacitor is properly loaded
      return !!(window.Capacitor && window.Capacitor.isNative);
    } catch (error) {
      return false;
    }
  }
}
