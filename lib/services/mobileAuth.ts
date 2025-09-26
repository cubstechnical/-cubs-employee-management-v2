/**
 * Mobile-specific authentication utilities
 * Handles iPhone 13 and other mobile device authentication issues
 */

import { supabase } from '@/lib/supabase/client';
import { log } from '@/lib/utils/logger';
import { isCapacitorApp } from '@/utils/mobileDetection';

export class MobileAuthService {
  /**
   * Enhanced session restoration for mobile devices
   */
  static async restoreMobileSession(): Promise<{ session: any; error: any }> {
    if (!isCapacitorApp()) {
      return { session: null, error: null };
    }

    try {
      log.info('MobileAuthService: Starting mobile session restoration...');

      // Check for stored session data
      const storedSession = localStorage.getItem('cubs-auth-token');
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
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
                refresh_token: sessionData.refresh_token
              });

              if (refreshError || !refreshData.session) {
                log.warn('MobileAuthService: Session refresh failed:', refreshError);
                localStorage.removeItem('cubs-auth-token');
                return { session: null, error: refreshError };
              }

              // Update stored session
              localStorage.setItem('cubs-auth-token', JSON.stringify({
                access_token: refreshData.session.access_token,
                refresh_token: refreshData.session.refresh_token,
                expires_at: refreshData.session.expires_at
              }));

              return { session: refreshData.session, error: null };
            } catch (refreshError) {
              log.warn('MobileAuthService: Session refresh error:', refreshError);
              localStorage.removeItem('cubs-auth-token');
              return { session: null, error: refreshError };
            }
          }

          // Session is still valid, set it
          const { data, error } = await supabase.auth.setSession({
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token,
          });

          if (error) {
            log.warn('MobileAuthService: Failed to set session:', error);
            localStorage.removeItem('cubs-auth-token');
            return { session: null, error };
          }

          return { session: data.session, error: null };
        } catch (parseError) {
          log.warn('MobileAuthService: Failed to parse stored session:', parseError);
          localStorage.removeItem('cubs-auth-token');
        }
      }

      // No stored session, try to get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      return { session, error };
    } catch (error) {
      log.error('MobileAuthService: Session restoration error:', error);
      return { session: null, error };
    }
  }

  /**
   * Store session data for mobile persistence
   */
  static storeMobileSession(session: any): void {
    if (!isCapacitorApp() || !session) return;

    try {
      localStorage.setItem('cubs-auth-token', JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }));
      
      localStorage.setItem('cubs_session_persisted', 'true');
      localStorage.setItem('cubs_last_login', new Date().toISOString());
      
      log.info('MobileAuthService: Session data stored for mobile persistence');
    } catch (error) {
      log.warn('MobileAuthService: Failed to store session data:', error);
    }
  }

  /**
   * Clear mobile session data
   */
  static clearMobileSession(): void {
    if (!isCapacitorApp()) return;

    try {
      localStorage.removeItem('cubs-auth-token');
      localStorage.removeItem('cubs_session_persisted');
      localStorage.removeItem('cubs_last_login');
      localStorage.removeItem('cubs_user_email');
      localStorage.removeItem('cubs_user_id');
      
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
