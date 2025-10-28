import { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseAvailable } from '@/lib/supabase/client';
import { DevAuthService } from './auth-dev';
import { authRateLimiter } from './rateLimiter';
import { isCapacitorApp } from '@/utils/mobileDetection';
import { log } from '@/lib/utils/productionLogger';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
  avatar_url?: string;
  approved?: boolean;
}

// Helper method to check if user is master admin
const isMasterAdmin = (email: string): boolean => {
  return email === 'info@cubstechnical.com' || email === 'admin@cubstechnical.com';
};

// Helper method to determine user role with master admin override
const getUserRole = (email: string, profileRole?: string): 'admin' | 'user' => {
  if (isMasterAdmin(email)) {
    return 'admin';
  }
  return profileRole === 'public' ? 'user' : (profileRole as 'admin' | 'user') || 'user';
};

// Helper method to check if user has admin privileges
const hasAdminPrivileges = (email: string, role?: string): boolean => {
  return isMasterAdmin(email) || role === 'admin';
};

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'user';
  metadata?: Record<string, any>;
}

export interface UpdatePasswordData {
  newPassword: string;
}

export class AuthService {
  // Cache for user data to reduce excessive API calls
  private static userCache: { user: AuthUser | null; timestamp: number } | null = null;
  private static CACHE_DURATION = 30 * 1000; // 30 seconds cache

  // Get current session with mobile-specific handling
  static async getSession(): Promise<{ session: Session | null; error: { message: string } | null }> {
    if (!isSupabaseAvailable) {
      return await DevAuthService.getSession();
    }
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        // Handle refresh token errors specifically
        if (error.message?.includes('Refresh Token') || error.message?.includes('refresh_token')) {
          log.warn('AuthService: Refresh token error, clearing session');
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            log.error('Error during sign out:', signOutError);
          }
        }
        return { session: null, error: { message: error.message } };
      }

      // Mobile-specific session validation - only if we detect a real mobile app
      if (typeof window !== 'undefined' && window.Capacitor && (window.Capacitor.isNative || (window as any).Capacitor.platform) && session) {
        log.info('AuthService: Mobile app session detected, validating...');

        // Additional validation for mobile sessions
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = session.expires_at;

        if (expiresAt && expiresAt < now) {
          log.warn('AuthService: Mobile session expired, attempting refresh...');
          try {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              log.error('AuthService: Failed to refresh mobile session:', refreshError);
              return { session: null, error: { message: 'Session expired' } };
            }
            return { session: refreshData.session, error: null };
          } catch (refreshError) {
            log.error('AuthService: Mobile session refresh error:', refreshError);
            return { session: null, error: { message: 'Session refresh failed' } };
          }
        }
      }

      return { session, error: null };
    } catch (error) {
      log.error('AuthService: Session error:', error);
      return { session: null, error: { message: 'An unexpected error occurred' } };
    }
  }

  // Mobile-specific session restoration
  static async restoreMobileSession(): Promise<{ session: Session | null; error: { message: string } | null }> {
    if (!isCapacitorApp()) {
      return await this.getSession(); // Use regular session for web
    }

    log.info('AuthService: Attempting to restore mobile session...');

    try {
      // Check if there's a stored session in localStorage
      if (typeof window !== 'undefined') {
        const storedSession = localStorage.getItem('cubs-auth-token');
        if (storedSession) {
          try {
            const sessionData = JSON.parse(storedSession);
            log.info('AuthService: Found stored mobile session data', {
              hasAccessToken: !!sessionData.access_token,
              hasRefreshToken: !!sessionData.refresh_token,
              expiresAt: sessionData.expires_at
            });

            if (sessionData && sessionData.access_token) {
              // Validate token expiry
              const now = Math.floor(Date.now() / 1000);
              const expiresAt = sessionData.expires_at;

              if (expiresAt && expiresAt < now) {
                log.warn('AuthService: Stored mobile session is expired, attempting refresh...');

                // Try to refresh the session
                try {
                  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
                    refresh_token: sessionData.refresh_token
                  });

                  if (refreshError) {
                    log.warn('AuthService: Failed to refresh expired mobile session:', refreshError.message);
                    // Clear expired stored session
                    localStorage.removeItem('cubs-auth-token');
                    return { session: null, error: { message: 'Session expired and refresh failed' } };
                  }

                  log.info('AuthService: Mobile session refreshed successfully');
                  return { session: refreshData.session, error: null };
                } catch (refreshError) {
                  log.warn('AuthService: Mobile session refresh error:', refreshError);
                  return { session: null, error: { message: 'Session refresh failed' } };
                }
              }

              log.info('AuthService: Stored mobile session is valid, setting session...');

              // Set the session in Supabase
              const { data, error } = await supabase.auth.setSession({
                access_token: sessionData.access_token,
                refresh_token: sessionData.refresh_token,
              });

              if (error) {
                log.warn('AuthService: Failed to restore mobile session:', error.message);
                // Clear invalid stored session
                localStorage.removeItem('cubs-auth-token');
                return { session: null, error: { message: error.message } };
              }

              log.info('AuthService: Mobile session restored successfully');
              return { session: data.session, error: null };
            }
          } catch (parseError) {
            log.warn('AuthService: Failed to parse stored mobile session:', parseError);
            // Clear corrupted stored session
            localStorage.removeItem('cubs-auth-token');
          }
        } else {
          log.info('AuthService: No stored mobile session found');
        }
      }

      // If no stored session or restoration failed, try to get current session
      log.info('AuthService: No stored session, checking for existing session...');
      return await this.getSession();
    } catch (error) {
      log.error('AuthService: Mobile session restoration error:', error);
      return { session: null, error: { message: 'Session restoration failed' } };
    }
  }

  // Handle OAuth callback
  static async handleCallback(): Promise<{ session: Session | null; error: { message: string } | null }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {

        return { session: null, error: { message: error.message } };
      }
      return { session, error: null };
    } catch (error) {

      return { session: null, error: { message: 'An unexpected error occurred' } };
    }
  }

  // Resend verification email
  static async resendVerification(email: string): Promise<{ error: { message: string } | null }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error) {
      log.error('Error resending verification:', error);
      return { error: { message: 'An unexpected error occurred' } };
    }
  }

  // Get current user - robust authentication check for mobile
  static async getCurrentUser(): Promise<AuthUser | null> {
    if (!isSupabaseAvailable) {
      return await DevAuthService.getCurrentUser();
    }
    try {
      // Quick timeout to prevent hanging on mobile
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('getUser timeout')), 2000)
      );

      const userPromise = supabase.auth.getUser();
      const { data: { user }, error } = await Promise.race([userPromise, timeoutPromise]) as any;

      if (error || !user) {
        return null; // No authenticated user - this is correct for login page
      }

      // Check if there's an active session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        log.warn('AuthService: User found but no active session');
        return null; // User exists but no active session
      }

      // Return basic user info for authenticated users
      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        role: 'user', // Will be updated with actual role when needed
        approved: true, // Will be updated with actual status when needed
      };

      log.info('AuthService: Authenticated user found:', authUser.email);
      return authUser;
    } catch (error) {
      log.warn('AuthService: getCurrentUser failed:', error);
      return null;
    }
  }

  // Get current user with approval status in a single call (optimized)
  static async getCurrentUserWithApproval(): Promise<{ user: AuthUser | null; isApproved: boolean }> {
    if (!isSupabaseAvailable) {
      return await DevAuthService.getCurrentUserWithApproval();
    }
    
    // Check cache first
    if (this.userCache && Date.now() - this.userCache.timestamp < this.CACHE_DURATION) {
      return { user: this.userCache.user, isApproved: !!this.userCache.user?.approved };
    }
    
    try {
      log.info('🔍 AuthService: getCurrentUserWithApproval called');
      
      // Add timeout to prevent hanging - reduced timeout for better UX
      const userPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getUser timeout')), 5000) // Reduced to 5s timeout
      );
      
      let result;
      try {
        result = await Promise.race([userPromise, timeoutPromise]);
      } catch (timeoutError) {
        log.warn('getUser timed out, trying once more...');
        // Try one more time with a shorter timeout
        const retryPromise = supabase.auth.getUser();
        const shortTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getUser retry timeout')), 2000)
        );
        try {
          result = await Promise.race([retryPromise, shortTimeoutPromise]);
        } catch (retryError) {
          log.warn('getUser retry also failed, returning null');
          return { user: null, isApproved: false };
        }
      }
      
      const { data: { user }, error } = result as any;
      log.info('🔍 AuthService: getUser result:', { hasUser: !!user, hasError: !!error });
      
      if (error || !user) {
        log.info('⚠️ AuthService: No user or error:', error?.message);
        return { user: null, isApproved: false };
      }

      // Get user profile from profiles table with timeout and error handling
      log.info('🔍 AuthService: Fetching user profile...');
      let profile = null;
      let profileError = null;

      try {
        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        const profileTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile fetch timeout')), 10000) // Consistent 10s timeout
        );

        const result = await Promise.race([profilePromise, profileTimeoutPromise]) as any;
        profile = result.data;
        profileError = result.error;

        log.info('🔍 AuthService: Profile result:', { hasProfile: !!profile, hasError: !!profileError });
      } catch (fetchError) {
        log.error('⚠️ AuthService: Profile fetch failed (continuing with fallback):', fetchError);
        // Continue with fallback user data - don't fail completely
      }

      if (profile && !profileError) {
        const userRole = getUserRole(user.email!, profile.role as string);
        const isApproved = profile.approved_by !== null && profile.approved_by !== undefined;

        const authUser: AuthUser = {
          id: user.id,
          email: user.email!,
          role: userRole,
          name: profile.full_name || user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url,
          approved: isApproved
        };

        // Cache the result
        this.userCache = { user: authUser, timestamp: Date.now() };
        return { user: authUser, isApproved };
      } else {
        log.info('⚠️ AuthService: Profile not found or error occurred, using fallback user data');
      }

      // Fallback: create user from auth data with admin override
      const userRole = getUserRole(user.email!, 'user');
      const isApproved = isMasterAdmin(user.email!);

      const fallbackUser: AuthUser = {
        id: user.id,
        email: user.email!,
        role: userRole,
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url,
        approved: isApproved
      };

      // Cache the fallback result
      this.userCache = { user: fallbackUser, timestamp: Date.now() };
      return { user: fallbackUser, isApproved };
    } catch (error) {
      log.error('❌ AuthService: getCurrentUserWithApproval error:', error);
      return { user: null, isApproved: false };
    }
  }

  // Sign in with email and password
  static async signIn(credentials: LoginCredentials): Promise<{ user: AuthUser | null; error: { message: string } | null }> {
    // Clear any problematic sessions before login (especially important for Android)
    if (isCapacitorApp()) {
      try {
        await supabase.auth.signOut();
        // Clear any stored tokens
        if (typeof window !== 'undefined') {
          ['cubs-auth-token', 'supabase.auth.token', 'sb-access-token', 'sb-refresh-token'].forEach(key => {
            try { localStorage.removeItem(key); } catch (e) {}
          });
        }
      } catch (e) {
        // Ignore errors during cleanup
      }
    }

    // Check rate limiting
    const identifier = `login:${credentials.email}`;
    if (!authRateLimiter.isAllowed(identifier)) {
      const resetTime = authRateLimiter.getResetTime(identifier);
      const remainingTime = resetTime ? Math.ceil((resetTime - Date.now()) / 60000) : 15;
      return { 
        user: null, 
        error: { 
          message: `Too many login attempts. Please try again in ${remainingTime} minutes.` 
        } 
      };
    }

    if (!isSupabaseAvailable && process.env.NODE_ENV === 'development') {
      return await DevAuthService.signIn(credentials);
    }
    
    if (!isSupabaseAvailable && process.env.NODE_ENV === 'production') {
      return { user: null, error: { message: 'Authentication service unavailable' } };
    }
    try {
      // Add a small delay to ensure any previous session is fully cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        // Don't increment rate limit for invalid credentials, only for successful attempts
        return { user: null, error: { message: error.message } };
      }

      if (!data.user) {
        return { user: null, error: { message: 'No user data returned' } };
      }

      // On Capacitor, explicitly persist session and trigger a refresh to stabilize auth state
      if (isCapacitorApp() && (data as any).session) {
        try { if (typeof window !== 'undefined') localStorage.setItem('cubs-auth-token', JSON.stringify((data as any).session)); } catch (_) {}
        try { await supabase.auth.refreshSession(); } catch (_) {}
        try { await supabase.auth.getSession(); } catch (_) {}
      }

      // Get user profile from profiles table
      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profile && !profileError) {
        const userRole = getUserRole(data.user.email!, (profile as any).role as string);

        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email!,
          role: userRole,
          name: (profile as any).full_name || data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          avatar_url: data.user.user_metadata?.avatar_url,
          approved: (profile as any).approved_by !== null
        };
        
        // Clear rate limit on successful login
        authRateLimiter.clear(identifier);
        return { user: authUser, error: null };
      } else if (profileError) {
        // Log profile fetch error securely
        log.error('Profile fetch error during sign in:', profileError?.message || 'Unknown error');
        // Continue with fallback user data
      }

      // Fallback: create user from auth data
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        role: getUserRole(data.user.email!, 'user'), // Default role, with master admin override
        name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
        avatar_url: data.user.user_metadata?.avatar_url
      };

      // Clear rate limit on successful login
      authRateLimiter.clear(identifier);
      return { user: authUser, error: null };
    } catch (error) {
      log.error('Error signing in:', error);
      return { user: null, error: { message: 'An unexpected error occurred' } };
    }
  }

  // Sign up new user
  static async signUp(signupData: SignupData): Promise<{ user: AuthUser | null; error: { message: string } | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            name: signupData.name,
            role: signupData.role || 'user',
            ...signupData.metadata
          }
        }
      });

      if (error) {
        return { user: null, error: { message: error.message } };
      }

      if (!data.user) {
        return { user: null, error: { message: 'No user data returned' } };
      }

      // Create user profile in profiles table with approval status
      try {
        const { error: profileError } = await (supabase as any)
          .from('profiles')
          .insert({
            id: data.user.id,
            email: signupData.email,
            full_name: signupData.name,
            first_name: signupData.metadata?.first_name || '',
            last_name: signupData.metadata?.last_name || '',
            role: signupData.role || 'user',
            // approved_by is null by default - indicates pending approval
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          log.info('Profile creation failed, but continuing with auth user:', profileError.message);
        }
      } catch (profileError) {
        log.info('Profile table not found, continuing with auth user only');
      }

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        role: signupData.role || 'user',
        name: signupData.name
      };

      return { user: authUser, error: null };
    } catch (error) {
      log.error('Error signing up:', error);
      return { user: null, error: { message: 'An unexpected error occurred' } };
    }
  }

  // Sign out
  static async signOut(): Promise<{ error: { message: string } | null }> {
    if (!isSupabaseAvailable) {
      await DevAuthService.signOut();
      return { error: null };
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: { message: error.message } };
      }
      return { error: null };
    } catch (error) {
      log.error('Error signing out:', error);
      return { error: { message: 'An unexpected error occurred' } };
    }
  }

  // Reset password
  static async resetPassword(email: string): Promise<{ error: { message: string } | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error) {
      log.error('Error resetting password:', error);
      return { error: { message: 'An unexpected error occurred' } };
    }
  }

  // Update password
  static async updatePassword(data: UpdatePasswordData): Promise<{ error: { message: string } | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error) {
      log.error('Error updating password:', error);
      return { error: { message: 'An unexpected error occurred' } };
    }
  }

  // Check if user is approved
  static async isApproved(): Promise<boolean> {
    try {
      log.info('🔍 AuthService: isApproved called');
      const user = await this.getCurrentUser();
      log.info('🔍 AuthService: isApproved user check:', { hasUser: !!user, userRole: user?.role });
      if (!user) return false;

      // Admins are always considered approved
      if (user.role === 'admin') {
        log.info('✅ AuthService: Admin user, approved');
        return true;
      }

      // Check approval status from profile - use approved_by field (consistent with middleware)
      log.info('🔍 AuthService: Checking approval status from profile...');
      const approvalPromise = supabase
        .from('profiles')
        .select('approved_by')
        .eq('id', user.id)
        .single();
      const approvalTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Approval check timeout')), 3000)
      );
      
      const { data: profile, error } = await Promise.race([approvalPromise, approvalTimeoutPromise]) as any;

      log.info('🔍 AuthService: Approval check result:', { hasProfile: !!profile, hasError: !!error, approvedBy: profile?.approved_by });

      if (error) {
        log.error('❌ AuthService: Error checking approval status:', error);
        return false;
      }

      // User is approved if approved_by is not null/undefined
      return profile?.approved_by !== null && profile?.approved_by !== undefined;
    } catch (error) {
      log.error('Error checking approval status:', error);
      return false;
    }
  }

  // Get all pending approvals (for admin)
  static async getPendingApprovals(): Promise<{ users: any[]; error: { message: string } | null }> {
    try {
      // Get users where approved_by is null (consistent with middleware check)
      // Exclude rejected users (approved_by = 'REJECTED')
      const { data: users, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .is('approved_by', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        log.error('Error fetching pending approvals:', error);
        return { users: [], error: { message: error.message } };
      }


      
      return { users: users || [], error: null };
    } catch (error) {
      log.error('Error in getPendingApprovals:', error);
      return { users: [], error: { message: 'Failed to fetch pending approvals' } };
    }
  }

  // Get pending approvals count (for dashboard)
  static async getPendingApprovalsCount(): Promise<{ count: number; error: { message: string } | null }> {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .is('approved_by', null);

      if (error) {
        log.error('Error fetching pending approvals count:', error);
        return { count: 0, error: { message: error.message } };
      }

      return { count: count || 0, error: null };
    } catch (error) {
      log.error('Error in getPendingApprovalsCount:', error);
      return { count: 0, error: { message: 'Failed to fetch pending approvals count' } };
    }
  }

  // Approve user (for admin)
  static async approveUser(userId: string, adminId: string): Promise<{ error: { message: string } | null }> {
    try {
      // First, check current state
      const { data: currentUser, error: checkError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (checkError) {
        log.error('Error checking user before approval:', checkError);
        return { error: { message: `User not found: ${checkError.message}` } };
      }

      if ((currentUser as any)?.approved_by !== null) {
        return { error: { message: 'User already approved' } };
      }

      // Update user approval status - only set approved_by (consistent with middleware)
      const { error, data } = await (supabase as any)
        .from('profiles')
        .update({
          approved_by: adminId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .is('approved_by', null) // Only update if currently pending
        .select();

      if (error) {
        log.error('❌ Database update error:', error);
        return { error: { message: `Database error: ${error.message}` } };
      }

      if (!data || data.length === 0) {
        return { error: { message: 'User not found or already approved' } };
      }

      return { error: null };
    } catch (error) {
      log.error('❌ Error in approveUser:', error);
      return { error: { message: 'Failed to approve user' } };
    }
  }

  // Reject user (for admin) - Now allows reapplication
  static async rejectUser(userId: string): Promise<{ error: { message: string } | null }> {
    try {
      // First, check current state
      const { data: currentUser, error: checkError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (checkError) {
        log.error('Error checking user before rejection:', checkError);
        return { error: { message: `User not found: ${checkError.message}` } };
      }
      
      if ((currentUser as any)?.approved_by !== null) {
        return { error: { message: 'Cannot reject already approved user' } };
      }

      // Mark user as rejected instead of deleting (allows reapplication)
      const { error, data } = await (supabase as any)
        .from('profiles')
        .update({
          approved_by: 'REJECTED', // Special marker for rejected users
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .is('approved_by', null) // Only update if currently pending
        .select();

      if (error) {
        log.error('❌ Database update error:', error);
        return { error: { message: `Database error: ${error.message}` } };
      }

      if (!data || data.length === 0) {
        return { error: { message: 'User not found or already approved' } };
      }

      return { error: null };
    } catch (error) {
      log.error('❌ Error in rejectUser:', error);
      return { error: { message: 'Failed to reject user' } };
    }
  }

  // Check if user has permission
  static async hasPermission(permission: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      // Admin has all permissions
      if (user.role === 'admin') return true;

      // Define permission matrix
      const permissions = {
        user: ['view_employees', 'view_documents'],
        admin: ['*']
      } as const;

      const rolePermissions = permissions[user.role as keyof typeof permissions] as ReadonlyArray<string> | undefined;
      const userPermissions: ReadonlyArray<string> = rolePermissions ?? [];
      return userPermissions.includes('*') || userPermissions.includes(permission);
    } catch (error) {
      log.error('Error checking permission:', error);
      return false;
    }
  }

  // Allow rejected user to reapply
  static async reapplyUser(userId: string): Promise<{ error: { message: string } | null }> {
    try {
      // Check if user exists and is rejected
      const { data: currentUser, error: checkError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (checkError) {
        log.error('Error checking user for reapplication:', checkError);
        return { error: { message: `User not found: ${checkError.message}` } };
      }
      
      if ((currentUser as any)?.approved_by !== 'REJECTED') {
        return { error: { message: 'User is not rejected or already approved' } };
      }

      // Reset user to pending status
      const { error, data } = await (supabase as any)
        .from('profiles')
        .update({
          approved_by: null, // Reset to pending
          status: 'pending',
          rejected_at: null,
          reapplied_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .eq('approved_by', 'REJECTED') // Only update if currently rejected
        .select();

      if (error) {
        log.error('❌ Database update error during reapplication:', error);
        return { error: { message: `Database error: ${error.message}` } };
      }

      if (!data || data.length === 0) {
        return { error: { message: 'User not found or not rejected' } };
      }

      return { error: null };
    } catch (error) {
      log.error('❌ Error in reapplyUser:', error);
      return { error: { message: 'Failed to reapply user' } };
    }
  }

  // Check if user is rejected
  static async isRejected(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('approved_by, status')
        .eq('id', user.id)
        .single();

      if (error) {
        log.error('Error checking rejection status:', error);
        return false;
      }

      return (profile as any)?.approved_by === 'REJECTED' || (profile as any)?.status === 'rejected';
    } catch (error) {
      log.error('Error checking rejection status:', error);
      return false;
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export default AuthService; 
