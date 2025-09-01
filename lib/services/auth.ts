import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

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
  return email === 'info@cubstechnical.com';
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
  // Get current session
  static async getSession(): Promise<{ session: Session | null; error: { message: string } | null }> {
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
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        return null;
      }

      // Get user profile from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

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

  // Sign in with email and password
  static async signIn(credentials: LoginCredentials): Promise<{ user: AuthUser | null; error: { message: string } | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
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
        return { user: authUser, error: null };
      } else if (profileError) {
        console.error('Profile fetch error during sign in:', profileError);
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
      const user = await this.getCurrentUser();
      if (!user) return false;

      // Admins are always considered approved
      if (user.role === 'admin') return true;

      // Check approval status from profile - use approved_by field (consistent with middleware)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('approved_by')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking approval status:', error);
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
