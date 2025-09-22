import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create regular Supabase client for server-side use
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Only create admin client if service key is available (server-side only)
let supabaseAdmin: any = null;

if (typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { supabaseAdmin };


