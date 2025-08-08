import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
  avatar_url?: string;
}

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
        console.error('Error getting session:', error);
        return { session: null, error: { message: error.message } };
      }
      return { session, error: null };
    } catch (error) {
      console.error('Error getting session:', error);
      return { session: null, error: { message: 'An unexpected error occurred' } };
    }
  }

  // Handle OAuth callback
  static async handleCallback(): Promise<{ session: Session | null; error: { message: string } | null }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error handling callback:', error);
        return { session: null, error: { message: error.message } };
      }
      return { session, error: null };
    } catch (error) {
      console.error('Error handling callback:', error);
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

      // Try to get user profile from profiles table
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile && !profileError) {
          return {
            id: user.id,
            email: user.email!,
            role: profile.role === 'public' ? 'user' : profile.role as 'admin' | 'user',
            name: profile.full_name || user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            avatar_url: user.user_metadata?.avatar_url
          };
        }
      } catch (profileError) {
        console.log('Profile table not found or user has no profile, using auth user data');
      }

      // Fallback: create user from auth data
      const authUser: AuthUser = {
        id: user.id,
        email: user.email!,
        role: 'user', // Default role
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

      // Try to get user profile from profiles table
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile && !profileError) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email!,
            role: profile.role === 'public' ? 'user' : profile.role as 'admin' | 'user',
            name: profile.full_name || data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
            avatar_url: data.user.user_metadata?.avatar_url
          };
          return { user: authUser, error: null };
        }
      } catch (profileError) {
        console.log('Profile table not found or user has no profile, using auth user data');
      }

      // Fallback: create user from auth data
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        role: 'user', // Default role
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

      // Try to create user profile in profiles table (optional)
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: signupData.email,
            full_name: signupData.name,
            role: signupData.role || 'public',
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

  // Listen to auth state changes
  static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export default AuthService; 
