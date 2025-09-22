// Development authentication service for when Supabase is not configured
import { AuthUser } from './auth';

export interface LoginCredentials {
  email: string;
  password: string;
}

export class DevAuthService {
  private static currentUser: AuthUser | null = null;

  static async getCurrentUser(): Promise<AuthUser | null> {
    return this.currentUser;
  }

  static async getCurrentUserWithApproval(): Promise<{ user: AuthUser | null; isApproved: boolean }> {
    const user = await this.getCurrentUser();
    return { 
      user, 
      isApproved: user?.approved || false 
    };
  }

  static async signIn(credentials: LoginCredentials): Promise<{ user: AuthUser | null; error: { message: string } | null }> {
    // Simple development authentication
    const { email, password } = credentials;
    
    // Allow any email/password combination for development
    if (email && password) {
      // Check for specific admin emails
      const isAdmin = email.includes('admin') || 
                     email === 'info@cubstechnical.com' ||
                     email.includes('cubstechnical.com');
      
      const user: AuthUser = {
        id: 'dev-user-123',
        email,
        role: isAdmin ? 'admin' : 'user',
        name: email === 'info@cubstechnical.com' ? 'CUBS Admin' : email.split('@')[0],
        approved: isAdmin // Only admin users are auto-approved
      };
      
      this.currentUser = user;
      console.log(`🔐 DevAuth: User ${email} logged in as ${user.role}`);
      return { user, error: null };
    }
    
    return { user: null, error: { message: 'Invalid credentials' } };
  }

  static async signOut(): Promise<void> {
    this.currentUser = null;
  }

  static async getSession(): Promise<{ session: any | null; error: { message: string } | null }> {
    if (this.currentUser) {
      return { 
        session: { user: this.currentUser }, 
        error: null 
      };
    }
    return { session: null, error: null };
  }
}
