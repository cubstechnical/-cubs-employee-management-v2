import { supabase } from '@/lib/supabase/client';
import { User, AdminInvite } from '@/types';

export interface CreateAdminData {
  email: string;
  name: string;
  role: 'admin';
}

export interface UpdateAdminData {
  name?: string;
  role?: 'admin';
  is_approved?: boolean;
}

export class AdminService {
  // Get all admins
  static async getAdmins(): Promise<{ admins: User[]; error: string | null }> {
    try {
      const { data: admins, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['master_admin', 'admin'])
        .order('created_at', { ascending: false });

      if (error) {
        return { admins: [], error: error.message };
      }

      return { admins: (admins || []) as unknown as User[], error: null };
    } catch (error) {
      return { admins: [], error: 'Failed to fetch admins' };
    }
  }

  // Get admin by ID
  static async getAdminById(id: string): Promise<{ admin: User | null; error: string | null }> {
    try {
      const { data: admin, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .in('role', ['master_admin', 'admin'])
        .single();

      if (error) {
        return { admin: null, error: error.message };
      }

      return { admin: admin as unknown as User, error: null };
    } catch (error) {
      return { admin: null, error: 'Failed to fetch admin' };
    }
  }

  // Create new admin (invite)
  static async inviteAdmin(adminData: CreateAdminData & { invited_by: string }): Promise<{ invite: AdminInvite | null; error: string | null }> {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', adminData.email)
        .single();

      if (existingUser) {
        return { invite: null, error: 'User with this email already exists' };
      }

      // Create admin invite
      const { data: invite, error } = await supabase
        .from('admin_invites')
        .insert([{
          email: adminData.email,
          name: adminData.name,
          role: adminData.role,
          invited_by: adminData.invited_by,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        }])
        .select()
        .single();

      if (error) {
        return { invite: null, error: error.message };
      }

      return { invite: invite as unknown as AdminInvite, error: null };
    } catch (error) {
      return { invite: null, error: 'Failed to invite admin' };
    }
  }

  // Approve admin (for first-time login)
  static async approveAdmin(adminId: string, approvedBy: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          approved_by: approvedBy,
          updated_at: new Date().toISOString(),
        })
        .eq('id', adminId)
        .eq('role', 'admin');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: 'Failed to approve admin' };
    }
  }

  // Update admin
  static async updateAdmin(adminId: string, adminData: UpdateAdminData): Promise<{ admin: User | null; error: string | null }> {
    try {
      const { data: admin, error } = await supabase
        .from('profiles')
        .update(adminData as any)
        .eq('id', adminId)
        .in('role', ['master_admin', 'admin'])
        .select()
        .single();

      if (error) {
        return { admin: null, error: error.message };
      }

      return { admin: admin as unknown as User, error: null };
    } catch (error) {
      return { admin: null, error: 'Failed to update admin' };
    }
  }

  // Delete admin
  static async deleteAdmin(adminId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Check if trying to delete master admin
      const { data: admin } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', adminId)
        .single();

      if (admin?.role === 'master_admin') {
        return { success: false, error: 'Cannot delete master admin' };
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', adminId)
        .eq('role', 'admin');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: 'Failed to delete admin' };
    }
  }

  // Get pending admin invites
  static async getPendingInvites(): Promise<{ invites: AdminInvite[]; error: string | null }> {
    try {
      const { data: invites, error } = await supabase
        .from('admin_invites')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        return { invites: [], error: error.message };
      }

      return { invites: (invites || []) as unknown as AdminInvite[], error: null };
    } catch (error) {
      return { invites: [], error: 'Failed to fetch pending invites' };
    }
  }

  // Accept admin invite (for first-time login)
  static async acceptInvite(inviteId: string, userData: { name: string; password: string }): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data: invite, error: inviteError } = await supabase
        .from('admin_invites')
        .select('*')
        .eq('id', inviteId)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invite) {
        return { success: false, error: 'Invalid or expired invite' };
      }

      // Check if invite is expired
      if (new Date(invite.expires_at as string) < new Date()) {
        return { success: false, error: 'Invite has expired' };
      }

      // Create user account
      const { data: user, error: userError } = await supabase.auth.signUp({
        email: invite.email as string,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: 'admin',
            is_approved: false,
          }
        }
      });

      if (userError) {
        return { success: false, error: userError.message };
      }

      // Update invite status
      await supabase
        .from('admin_invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId);

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: 'Failed to accept invite' };
    }
  }

  // Get unapproved admins (for master admin approval)
  static async getUnapprovedAdmins(): Promise<{ admins: User[]; error: string | null }> {
    try {
      const { data: admins, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .is('approved_by', null)
        .order('created_at', { ascending: false });

      if (error) {
        return { admins: [], error: error.message };
      }

      return { admins: (admins || []) as unknown as User[], error: null };
    } catch (error) {
      return { admins: [], error: 'Failed to fetch unapproved admins' };
    }
  }
} 