import { createClient } from '@supabase/supabase-js';

// Use the correct Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://blbybcxkfcyxrwrlldtd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;



// Create Supabase client
let supabase: ReturnType<typeof createClient>;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Missing Supabase environment variables. Using mock client for development.');
  // Create a mock client that won't throw errors
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
    console.error('❌ Error creating Supabase client:', error);
    // Fallback to mock client
    supabase = createClient('https://mock.supabase.co', 'mock-key');
  }
}

export { supabase };

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