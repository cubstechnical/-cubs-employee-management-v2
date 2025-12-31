import { createClient } from '@supabase/supabase-js';
import { log } from '@/lib/utils/productionLogger';
import type { Database } from '@/types/database.types';

// Use the correct Supabase URL from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;



// Environment variables check (production optimized)

// Create Supabase client with robust fallback
let supabase: ReturnType<typeof createClient<Database>>;
let isSupabaseAvailable = true;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === '' || supabaseAnonKey === '') {
  isSupabaseAvailable = false;

  // CRITICAL: Show user-friendly error in mobile builds
  if (typeof window !== 'undefined') {
    const isMobileBuild = !supabaseUrl || supabaseUrl === '';

    if (isMobileBuild) {
      console.error('❌ CRITICAL ERROR: Supabase credentials missing in mobile build!');
      console.error('This means the app was built without environment variables.');
      console.error('Please rebuild the app with: npm run build:mobile');

      // Show error to user after a delay to ensure DOM is ready
      setTimeout(() => {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #111827;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 999999;
          text-align: center;
          font-family: system-ui, -apple-system, sans-serif;
        `;
        errorDiv.innerHTML = `
          <div style="max-width: 400px;">
            <h1 style="font-size: 24px; margin-bottom: 20px; color: #ef4444;">⚠️ Configuration Error</h1>
            <p style="margin-bottom: 20px; color: #9ca3af; line-height: 1.6;">
              The app is missing required configuration. Please contact support or reinstall the app.
            </p>
            <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">
              Error Code: SUPABASE_CONFIG_MISSING
            </p>
          </div>
        `;
        document.body.appendChild(errorDiv);
      }, 1000);
    }
  }

  log.warn('Supabase credentials not configured. Using mock client for development.');

  // Create a more robust mock client for mobile/PWA compatibility
  supabase = createClient<Database>('https://mock.supabase.co', 'mock-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
} else {
  try {
    // Enhanced auth configuration for mobile apps
    const authConfig = {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Use default Supabase storage - don't override storageKey to avoid conflicts
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    };

    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: authConfig,
    });

    // Note: Auth state listener is handled in SimpleAuthContext to avoid multiple listeners
  } catch (error) {
    isSupabaseAvailable = false;
    log.error('Failed to create Supabase client:', error);
    // Fallback to mock client
    supabase = createClient<Database>('https://mock.supabase.co', 'mock-key');
  }
}

// Export availability status
export { isSupabaseAvailable };

export { supabase };

// Auth state cache to improve performance
let authStateCache: {
  user: any;
  session: any;
  timestamp: number;
} | null = null;

const AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let authPromise: Promise<any> | null = null; // Prevent multiple simultaneous calls

// OPTIMIZED: Enhanced auth state management with faster timeout and better caching
export const getAuthState = async () => {
  const now = Date.now();

  log.info('🔍 Supabase: getAuthState called, isSupabaseAvailable:', isSupabaseAvailable);

  // If Supabase is not available, return empty state immediately
  if (!isSupabaseAvailable) {
    log.info('⚠️ Supabase: Not available, returning empty state');
    return { user: null, session: null, timestamp: now };
  }

  // Return cached auth state if still valid
  if (authStateCache && (now - authStateCache.timestamp) < AUTH_CACHE_DURATION) {
    return authStateCache;
  }

  // If there's already an auth request in progress, wait for it
  if (authPromise) {
    try {
      return await authPromise;
    } catch (error) {
      // If the existing promise fails, continue with new request
      authPromise = null;
    }
  }

  try {
    log.info('🔍 Supabase: Creating new auth promise...');
    // Create new auth promise
    authPromise = (async () => {
      log.info('🔍 Supabase: Calling supabase.auth.getSession()...');
      // PERFORMANCE: Reduced timeout from 5s to 2s for faster initial load
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth timeout')), 2000)
      );

      const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;

      log.info('🔍 Supabase: Session result:', {
        hasSession: !!session,
        hasError: !!error,
        errorMessage: error?.message
      });

      if (error) {
        log.error('❌ Supabase: Auth state error:', error);

        // Handle refresh token errors specifically
        if (error.message?.includes('Refresh Token') || error.message?.includes('refresh_token')) {
          log.warn('🔄 Supabase: Refresh token error detected, clearing session');
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            log.error('Error during sign out:', signOutError);
          }
        }

        return { user: null, session: null, timestamp: now };
      }

      // Cache the result
      authStateCache = {
        user: session?.user || null,
        session,
        timestamp: now
      };

      log.info('✅ Supabase: Auth state cached successfully');
      return authStateCache;
    })();

    const result = await authPromise;
    authPromise = null; // Clear the promise after completion
    log.info('✅ Supabase: Auth promise completed');
    return result;
  } catch (error) {
    log.error('❌ Supabase: Auth state timeout or error:', error);
    authPromise = null; // Clear the promise on error
    // PERFORMANCE: Return empty state on timeout to prevent blocking
    return { user: null, session: null, timestamp: now };
  }
};

// Clear auth cache when needed
export const clearAuthCache = () => {
  authStateCache = null;
  authPromise = null;
};

// Clear auth state and sign out when refresh token errors occur
export const handleRefreshTokenError = async () => {
  log.warn('🔄 Clearing auth state due to refresh token error');
  clearAuthCache();
  try {
    await supabase.auth.signOut();
  } catch (error) {
    log.error('Error during sign out:', error);
  }
};

// Preload critical app data
export const preloadAppData = async () => {
  if (!isSupabaseAvailable) return;

  try {
    // Preloading critical app data...

    // Preload common data in background
    const preloadPromises = [
      // Preload user profile if logged in
      getAuthState().then(async (auth) => {
        if (auth.session) {
          try {
            await supabase.from('profiles').select('id, full_name, role').limit(1);
          } catch (e) {
            // Ignore preload errors
          }
        }
      }),

      // Preload basic employee count
      (async () => {
        try {
          await supabase.from('employee_table').select('count').limit(1);
        } catch (error) {
          // Ignore preload errors
        }
        return null;
      })(),
    ];

    // Don't wait for preload, just initiate
    Promise.allSettled(preloadPromises);

  } catch (error) {
    // Ignore preload errors - continue silently
  }
};

// Type definitions for our database tables
export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  dob: string;
  trade: string;
  nationality: string;
  joining_date: string;
  passport_no: string;
  passport_expiry: string;
  labourcard_no: string;
  labourcard_expiry: string;
  visastamping_date: string;
  visa_expiry_date: string;
  eid: string;
  leave_date?: string;
  wcc: string;
  lulu_wps_card: string;
  basic_salary: string;
  company_name: string;
  created_at: string;
  updated_at: string;
  passport_number?: string;
  visa_number?: string;
  visa_type?: string;
  visa_status: string;
  date_of_birth?: string;
  join_date?: string;
  mobile_number?: string;
  home_phone_number?: string;
  email_id?: string;
  company_id?: string;
  status: string;
  is_active: boolean;
}

export interface Document {
  id: string;
  employee_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  category: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  created_at: string;
}

export interface VisaNotification {
  id: string;
  employee_id: string;
  visa_type: string;
  expiry_date: string;
  days_until_expiry: number;
  notification_sent: boolean;
  sent_at?: string;
  created_at: string;
} 