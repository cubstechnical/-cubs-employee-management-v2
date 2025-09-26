import { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseAvailable } from '@/lib/supabase/client';
import { DevAuthService } from './auth-dev';
import { authRateLimiter } from './rateLimiter';
import { isCapacitorApp } from '@/utils/mobileDetection';
import { log } from '@/lib/utils/logger';

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
          console.warn('AuthService: Refresh token error, clearing session');
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('Error during sign out:', signOutError);
          }
        }
        return { session: null, error: { message: error.message } };
      }

      // Mobile-specific session validation
      if (isCapacitorApp() && session) {
        console.log('AuthService: Mobile app session detected, validating...');

        // Additional validation for mobile sessions
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = session.expires_at;

        if (expiresAt && expiresAt < now) {
          console.warn('AuthService: Mobile session expired, attempting refresh...');
          try {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.error('AuthService: Failed to refresh mobile session:', refreshError);
              return { session: null, error: { message: 'Session expired' } };
            }
            return { session: refreshData.session, error: null };
          } catch (refreshError) {
            console.error('AuthService: Mobile session refresh error:', refreshError);
            return { session: null, error: { message: 'Session refresh failed' } };
          }
        }
      }

      return { session, error: null };
    } catch (error) {
      console.error('AuthService: Session error:', error);
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
      console.error('Error resending verification:', error);
      return { error: { message: 'An unexpected error occurred' } };
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<AuthUser | null> {
    if (!isSupabaseAvailable) {
      return await DevAuthService.getCurrentUser();
    }
    try {
      console.log('🔍 AuthService: getCurrentUser called');
      
      // Add timeout to prevent hanging - increased for mobile networks
      const userPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getUser timeout')), 10000) // Increased to 10 seconds for mobile
      );
      
      const { data: { user }, error } = await Promise.race([userPromise, timeoutPromise]) as any;
      console.log('🔍 AuthService: getUser result:', { hasUser: !!user, hasError: !!error });
      if (error || !user) {
        console.log('⚠️ AuthService: No user or error:', error?.message);
        return null;
      }

      // Get user profile from profiles table with timeout - increased for mobile
      console.log('🔍 AuthService: Fetching user profile...');
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      const profileTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000) // Increased to 10 seconds for mobile
      );
      
      const { data: profile, error: profileError } = await Promise.race([profilePromise, profileTimeoutPromise]) as any;

      console.log('🔍 AuthService: Profile result:', { hasProfile: !!profile, hasError: !!profileError });

      if (profile && !profileError) {
        const userRole = getUserRole(user.email!, profile.role as string);

        return {
          id: user.id,
          email: user.email!,
          role: userRole,
          name: profile.full_name || user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url,
          approved: profile.approved_by !== null
        };
      } else if (profileError) {
        console.error('Profile fetch error:', profileError);
        // Continue with fallback user data
      }

      // Fallback: create user from auth data
      const authUser: AuthUser = {
        id: user.id,
        email: user.email!,
        role: getUserRole(user.email!, 'user'), // Default role, with master admin override
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url
      };

      return authUser;
    } catch (error) {
      console.error('Error getting current user:', error);
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
      console.log('🔍 AuthService: getCurrentUserWithApproval called');
      
      // Add timeout to prevent hanging - reduced timeout for better UX
      const userPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getUser timeout')), 5000) // Reduced to 5s timeout
      );
      
      let result;
      try {
        result = await Promise.race([userPromise, timeoutPromise]);
      } catch (timeoutError) {
        console.warn('getUser timed out, trying once more...');
        // Try one more time with a shorter timeout
        const retryPromise = supabase.auth.getUser();
        const shortTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getUser retry timeout')), 2000)
        );
        try {
          result = await Promise.race([retryPromise, shortTimeoutPromise]);
        } catch (retryError) {
          console.warn('getUser retry also failed, returning null');
          return { user: null, isApproved: false };
        }
      }
      
      const { data: { user }, error } = result as any;
      console.log('🔍 AuthService: getUser result:', { hasUser: !!user, hasError: !!error });
      
      if (error || !user) {
        console.log('⚠️ AuthService: No user or error:', error?.message);
        return { user: null, isApproved: false };
      }

      // Get user profile from profiles table with timeout and error handling
      console.log('🔍 AuthService: Fetching user profile...');
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

        console.log('🔍 AuthService: Profile result:', { hasProfile: !!profile, hasError: !!profileError });
      } catch (fetchError) {
        console.error('⚠️ AuthService: Profile fetch failed (continuing with fallback):', fetchError);
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
        console.log('⚠️ AuthService: Profile not found or error occurred, using fallback user data');
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
      console.error('❌ AuthService: getCurrentUserWithApproval error:', error);
      return { user: null, isApproved: false };
    }
  }

  // Sign in with email and password
  static async signIn(credentials: LoginCredentials): Promise<{ user: AuthUser | null; error: { message: string } | null }> {
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

      // Get user profile from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profile && !profileError) {
        const userRole = getUserRole(data.user.email!, profile.role as string);

        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email!,
          role: userRole,
          name: profile.full_name || data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          avatar_url: data.user.user_metadata?.avatar_url,
          approved: profile.approved_by !== null
        };
        
        // Clear rate limit on successful login
        authRateLimiter.clear(identifier);
        return { user: authUser, error: null };
      } else if (profileError) {
        // Log profile fetch error securely
        console.error('Profile fetch error during sign in:', profileError?.message || 'Unknown error');
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
      console.error('Error signing in:', error);
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
        const { error: profileError } = await supabase
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
          console.log('Profile creation failed, but continuing with auth user:', profileError.message);
        }
      } catch (profileError) {
        console.log('Profile table not found, continuing with auth user only');
      }

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        role: signupData.role || 'user',
        name: signupData.name
      };

      return { user: authUser, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
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
      console.error('Error signing out:', error);
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
      console.error('Error resetting password:', error);
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
      console.error('Error updating password:', error);
      return { error: { message: 'An unexpected error occurred' } };
    }
  }

  // Check if user is approved
  static async isApproved(): Promise<boolean> {
    try {
      console.log('🔍 AuthService: isApproved called');
      const user = await this.getCurrentUser();
      console.log('🔍 AuthService: isApproved user check:', { hasUser: !!user, userRole: user?.role });
      if (!user) return false;

      // Admins are always considered approved
      if (user.role === 'admin') {
        console.log('✅ AuthService: Admin user, approved');
        return true;
      }

      // Check approval status from profile - use approved_by field (consistent with middleware)
      console.log('🔍 AuthService: Checking approval status from profile...');
      const approvalPromise = supabase
        .from('profiles')
        .select('approved_by')
        .eq('id', user.id)
        .single();
      const approvalTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Approval check timeout')), 3000)
      );
      
      const { data: profile, error } = await Promise.race([approvalPromise, approvalTimeoutPromise]) as any;

      console.log('🔍 AuthService: Approval check result:', { hasProfile: !!profile, hasError: !!error, approvedBy: profile?.approved_by });

      if (error) {
        console.error('❌ AuthService: Error checking approval status:', error);
        return false;
      }

      // User is approved if approved_by is not null/undefined
      return profile?.approved_by !== null && profile?.approved_by !== undefined;
    } catch (error) {
      console.error('Error checking approval status:', error);
      return false;
    }
  }

  // Get all pending approvals (for admin)
  static async getPendingApprovals(): Promise<{ users: any[]; error: { message: string } | null }> {
    try {
      // Get users where approved_by is null (consistent with middleware check)
      // Exclude rejected users (approved_by = 'REJECTED')
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .is('approved_by', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching pending approvals:', error);
        return { users: [], error: { message: error.message } };
      }


      
      return { users: users || [], error: null };
    } catch (error) {
      console.error('Error in getPendingApprovals:', error);
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
        console.error('Error fetching pending approvals count:', error);
        return { count: 0, error: { message: error.message } };
      }

      return { count: count || 0, error: null };
    } catch (error) {
      console.error('Error in getPendingApprovalsCount:', error);
      return { count: 0, error: { message: 'Failed to fetch pending approvals count' } };
    }
  }

  // Approve user (for admin)
  static async approveUser(userId: string, adminId: string): Promise<{ error: { message: string } | null }> {
    try {
      // First, check current state
      const { data: currentUser, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (checkError) {
        console.error('Error checking user before approval:', checkError);
        return { error: { message: `User not found: ${checkError.message}` } };
      }
      
      if (currentUser.approved_by !== null) {
        return { error: { message: 'User already approved' } };
      }

      // Update user approval status - only set approved_by (consistent with middleware)
      const { error, data } = await supabase
        .from('profiles')
        .update({
          approved_by: adminId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .is('approved_by', null) // Only update if currently pending
        .select();

      if (error) {
        console.error('❌ Database update error:', error);
        return { error: { message: `Database error: ${error.message}` } };
      }

      if (!data || data.length === 0) {
        return { error: { message: 'User not found or already approved' } };
      }

      return { error: null };
    } catch (error) {
      console.error('❌ Error in approveUser:', error);
      return { error: { message: 'Failed to approve user' } };
    }
  }

  // Reject user (for admin) - Now allows reapplication
  static async rejectUser(userId: string): Promise<{ error: { message: string } | null }> {
    try {
      // First, check current state
      const { data: currentUser, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (checkError) {
        console.error('Error checking user before rejection:', checkError);
        return { error: { message: `User not found: ${checkError.message}` } };
      }
      
      if (currentUser.approved_by !== null) {
        return { error: { message: 'Cannot reject already approved user' } };
      }

      // Mark user as rejected instead of deleting (allows reapplication)
      const { error, data } = await supabase
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
        console.error('❌ Database update error:', error);
        return { error: { message: `Database error: ${error.message}` } };
      }

      if (!data || data.length === 0) {
        return { error: { message: 'User not found or already approved' } };
      }

      return { error: null };
    } catch (error) {
      console.error('❌ Error in rejectUser:', error);
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
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Allow rejected user to reapply
  static async reapplyUser(userId: string): Promise<{ error: { message: string } | null }> {
    try {
      // Check if user exists and is rejected
      const { data: currentUser, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (checkError) {
        console.error('Error checking user for reapplication:', checkError);
        return { error: { message: `User not found: ${checkError.message}` } };
      }
      
      if (currentUser.approved_by !== 'REJECTED') {
        return { error: { message: 'User is not rejected or already approved' } };
      }

      // Reset user to pending status
      const { error, data } = await supabase
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
        console.error('❌ Database update error during reapplication:', error);
        return { error: { message: `Database error: ${error.message}` } };
      }

      if (!data || data.length === 0) {
        return { error: { message: 'User not found or not rejected' } };
      }

      return { error: null };
    } catch (error) {
      console.error('❌ Error in reapplyUser:', error);
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
        console.error('Error checking rejection status:', error);
        return false;
      }

      return profile?.approved_by === 'REJECTED' || profile?.status === 'rejected';
    } catch (error) {
      console.error('Error checking rejection status:', error);
      return false;
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export default AuthService; 
