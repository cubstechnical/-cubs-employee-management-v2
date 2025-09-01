import { createClient } from '@supabase/supabase-js';

// Use the correct Supabase URL from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;



// Environment variables check (production optimized)

// Create Supabase client with robust fallback
let supabase: ReturnType<typeof createClient>;
let isSupabaseAvailable = true;

if (!supabaseUrl || !supabaseAnonKey) {
  isSupabaseAvailable = false;
  // Create a minimal mock client
  supabase = createClient('https://mock.supabase.co', 'mock-key');
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  } catch (error) {
    isSupabaseAvailable = false;
    // Fallback to mock client
    supabase = createClient('https://mock.supabase.co', 'mock-key');
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

// Enhanced auth state management with timeout
export const getAuthState = async () => {
  const now = Date.now();

  // Return cached auth state if still valid
  if (authStateCache && (now - authStateCache.timestamp) < AUTH_CACHE_DURATION) {
    return authStateCache;
  }

  try {
    // Add timeout to prevent hanging
    const authPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), 10000)
    );

    const { data: { session }, error } = await Promise.race([authPromise, timeoutPromise]) as any;

    if (error) {
      console.error('Auth state error:', error);
      return { user: null, session: null, timestamp: now };
    }

    // Cache the result
    authStateCache = {
      user: session?.user || null,
      session,
      timestamp: now
    };

    return authStateCache;
  } catch (error) {
    console.error('Auth state timeout or error:', error);
    // Return empty state on timeout
    return { user: null, session: null, timestamp: now };
  }
};

// Clear auth cache when needed
export const clearAuthCache = () => {
  authStateCache = null;
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