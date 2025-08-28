import { AuthService } from '@/lib/services/auth';

// Mock Supabase client
const mockSupabase = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
};

jest.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should successfully sign up a user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      const mockSession = {
        session: { user: mockUser },
        error: null,
      };

      mockSupabase.auth.signUp.mockResolvedValue(mockSession);

      const result = await AuthService.signUp({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            name: 'Test User',
          },
        },
      });

      expect(result).toEqual({
        success: true,
        user: mockUser,
        error: null,
      });
    });

    it('should handle sign up errors', async () => {
      const mockError = { message: 'Email already exists' };
      mockSupabase.auth.signUp.mockResolvedValue({
        session: null,
        error: mockError,
      });

      const result = await AuthService.signUp({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(result).toEqual({
        success: false,
        user: null,
        error: mockError,
      });
    });
  });

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockSession = {
        session: { user: mockUser },
        error: null,
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue(mockSession);

      const result = await AuthService.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        success: true,
        user: mockUser,
        error: null,
      });
    });

    it('should handle sign in errors', async () => {
      const mockError = { message: 'Invalid credentials' };
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        session: null,
        error: mockError,
      });

      const result = await AuthService.signIn({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result).toEqual({
        success: false,
        user: null,
        error: mockError,
      });
    });
  });

  describe('signOut', () => {
    it('should successfully sign out a user', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const result = await AuthService.signOut();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        error: null,
      });
    });

    it('should handle sign out errors', async () => {
      const mockError = { message: 'Sign out failed' };
      mockSupabase.auth.signOut.mockResolvedValue({ error: mockError });

      const result = await AuthService.signOut();

      expect(result).toEqual({
        success: false,
        error: mockError,
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await AuthService.getCurrentUser();

      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should return null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await AuthService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('getSession', () => {
    it('should return session when available', async () => {
      const mockSession = {
        session: {
          user: { id: 'user-123', email: 'test@example.com' },
          access_token: 'token-123',
        },
        error: null,
      };

      mockSupabase.auth.getSession.mockResolvedValue(mockSession);

      const result = await AuthService.getSession();

      expect(mockSupabase.auth.getSession).toHaveBeenCalled();
      expect(result).toEqual(mockSession);
    });

    it('should return null session when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        session: null,
        error: null,
      });

      const result = await AuthService.getSession();

      expect(result.session).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('should successfully send password reset email', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      const result = await AuthService.resetPassword('test@example.com');

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: expect.stringContaining('/reset-password'),
        }
      );

      expect(result).toEqual({
        success: true,
        error: null,
      });
    });

    it('should handle password reset errors', async () => {
      const mockError = { message: 'User not found' };
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: mockError });

      const result = await AuthService.resetPassword('nonexistent@example.com');

      expect(result).toEqual({
        success: false,
        error: mockError,
      });
    });
  });

  describe('updatePassword', () => {
    it('should successfully update password', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await AuthService.updatePassword('newpassword123');

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });

      expect(result).toEqual({
        success: true,
        user: mockUser,
        error: null,
      });
    });

    it('should handle password update errors', async () => {
      const mockError = { message: 'Password too weak' };
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      const result = await AuthService.updatePassword('weak');

      expect(result).toEqual({
        success: false,
        user: null,
        error: mockError,
      });
    });
  });

  describe('getPendingApprovals', () => {
    it('should return pending approvals', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com', status: 'pending' },
        { id: 'user-2', email: 'user2@example.com', status: 'pending' },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.select.mockResolvedValue({
        data: mockUsers,
        error: null,
      });

      const result = await AuthService.getPendingApprovals();

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(result).toEqual({
        users: mockUsers,
        error: null,
      });
    });

    it('should handle database errors', async () => {
      const mockError = { message: 'Database connection failed' };
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.select.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await AuthService.getPendingApprovals();

      expect(result).toEqual({
        users: [],
        error: mockError,
      });
    });
  });

  describe('approveUser', () => {
    it('should successfully approve a user', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.update.mockResolvedValue({
        data: { id: 'user-123', status: 'approved' },
        error: null,
      });

      const result = await AuthService.approveUser('user-123', 'admin-456');

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockQuery.update).toHaveBeenCalledWith({
        status: 'approved',
        approved_by: 'admin-456',
        approved_at: expect.any(String),
      });

      expect(result).toEqual({
        success: true,
        error: null,
      });
    });

    it('should handle approval errors', async () => {
      const mockError = { message: 'User not found' };
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.update.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await AuthService.approveUser('nonexistent-user', 'admin-456');

      expect(result).toEqual({
        success: false,
        error: mockError,
      });
    });
  });

  describe('rejectUser', () => {
    it('should successfully reject a user', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.update.mockResolvedValue({
        data: { id: 'user-123', status: 'rejected' },
        error: null,
      });

      const result = await AuthService.rejectUser('user-123', 'admin-456', 'Invalid information');

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockQuery.update).toHaveBeenCalledWith({
        status: 'rejected',
        approved_by: 'REJECTED',
        rejection_reason: 'Invalid information',
        rejected_at: expect.any(String),
      });

      expect(result).toEqual({
        success: true,
        error: null,
      });
    });
  });
});

