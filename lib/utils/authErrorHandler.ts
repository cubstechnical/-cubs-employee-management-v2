/**
 * Auth Error Handler
 * Handles authentication errors gracefully, especially refresh token errors
 */

import { supabase } from '@/lib/supabase/client';
import { clearAuthCache } from '@/lib/supabase/client';
import { log } from '@/lib/utils/logger';

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * Check if an error is related to refresh token issues
 */
export const isRefreshTokenError = (error: any): boolean => {
  if (!error?.message) return false;
  
  const message = error.message.toLowerCase();
  return (
    message.includes('refresh token') ||
    message.includes('refresh_token') ||
    message.includes('invalid refresh token') ||
    message.includes('refresh token not found') ||
    message.includes('token expired') ||
    message.includes('jwt expired')
  );
};

/**
 * Handle authentication errors gracefully
 */
export const handleAuthError = async (error: any): Promise<void> => {
  log.error('Auth Error Handler:', error);
  
  if (isRefreshTokenError(error)) {
    log.warn('Refresh token error detected, clearing auth state');
    
    try {
      // Clear local auth cache
      clearAuthCache();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear any stored session data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.removeItem('supabase.auth.token');
      }
      
      log.info('Auth state cleared successfully');
    } catch (signOutError) {
      log.error('Error during auth cleanup:', signOutError);
    }
  }
};

