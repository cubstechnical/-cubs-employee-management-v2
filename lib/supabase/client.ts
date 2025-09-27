import { createClient } from '@supabase/supabase-js';

// Simple Supabase client configuration - same for web and mobile
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create Supabase client - throw error if credentials are missing
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
  },
});

// Export availability status for backward compatibility
export const isSupabaseAvailable = true;

// Simple auth helper - just get the current session
export const getAuthState = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
      console.warn('Auth error:', error);
      return { user: null, session: null };
    }
    return { user: session?.user || null, session };
  } catch (error) {
    console.warn('Auth state error:', error);
    return { user: null, session: null };
  }
};

// Preload app data for backward compatibility
export const preloadAppData = async () => {
  // Simple preload - just ensure Supabase is ready
  try {
    await getAuthState();
  } catch (error) {
    // Ignore preload errors
  }
};

// Clear auth cache for backward compatibility
export const clearAuthCache = () => {
  // Simple implementation - just log for now
  console.log('Auth cache cleared');
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