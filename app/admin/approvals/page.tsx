'use client';

import { useState, useEffect } from 'react';

// Force dynamic rendering for this page since it uses authentication
export const dynamic = 'force-dynamic';
// Layout is now handled by the root layout
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { AuthService } from '@/lib/services/auth';
import { useAuth } from '@/lib/contexts/SimpleAuthContext';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  UserCheck,
  Mail,
  Building2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PendingUser {
  id: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  role: string;
  created_at: string;
  approved_by?: string;
}

export default function AdminApprovals() {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  useEffect(() => {
    if (user && 'role' in user && user.role === 'admin') {
      // Only allow main admin (info@cubstechnical.com) to access this page
      if (user.email === 'info@cubstechnical.com') {
        loadPendingUsers();
      } else {
        toast.error('Access denied. Only the main administrator can access this page.');
        setLoading(false);
      }
    }
  }, [user]);

  const loadPendingUsers = async () => {
    setLoading(true);
    try {
      const { users, error } = await AuthService.getPendingApprovals();

      if (error) {
        toast.error('Failed to load pending approvals');
      } else {
        setPendingUsers(users);
      }
    } catch (error) {
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    if (!user) return;

    setProcessingUser(userId);
    try {
      const { error } = await AuthService.approveUser(userId, user.id);

      if (error) {
        toast.error(`Failed to approve user: ${error.message}`);
      } else {
        toast.success('User approved successfully!');

        // Remove from pending list immediately
        setPendingUsers(prev => prev.filter(u => u.id !== userId));

        // Force refresh from database
        await loadPendingUsers();

        // Notify dashboard to refresh
        localStorage.setItem('adminDashboardRefresh', Date.now().toString());
        window.dispatchEvent(new CustomEvent('adminDashboardRefresh'));
      }
    } catch (error) {
      toast.error('Failed to approve user');
    } finally {
      setProcessingUser(null);
    }
  };

  const handleRejectUser = async (userId: string) => {
    setProcessingUser(userId);
    try {
      const { error } = await AuthService.rejectUser(userId);

      if (error) {
        toast.error(`Failed to reject user: ${error.message}`);
      } else {
        toast.success('User rejected and removed successfully!');

        // Remove from pending list immediately
        setPendingUsers(prev => prev.filter(u => u.id !== userId));

        // Force refresh from database
        await loadPendingUsers();

        // Notify dashboard to refresh
        localStorage.setItem('adminDashboardRefresh', Date.now().toString());
        window.dispatchEvent(new CustomEvent('adminDashboardRefresh'));
      }
    } catch (error) {
      toast.error('Failed to reject user');
    } finally {
      setProcessingUser(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user || !('role' in user) || user.role !== 'admin' || user?.email !== 'info@cubstechnical.com') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Only the main administrator (info@cubstechnical.com) can access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Approvals</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage pending user registration requests
            </p>

          </div>
          <Button
            onClick={loadPendingUsers}
            disabled={loading}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingUsers.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Approved Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pendingUsers.filter(u => new Date(u.created_at).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">Loading...</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Pending Users */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <UserCheck className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Pending User Approvals
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading pending approvals...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                All Caught Up!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                There are no pending user approval requests at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((pendingUser) => (
                <div key={pendingUser.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {pendingUser.full_name || `${pendingUser.first_name || ''} ${pendingUser.last_name || ''}`.trim() || 'Unknown User'}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {pendingUser.email}
                          </span>
                          <span className="flex items-center">
                            <Building2 className="w-4 h-4 mr-1" />
                            {pendingUser.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500 dark:text-gray-500">
                      <p>Applied on</p>
                      <p>{formatDate(pendingUser.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={() => handleApproveUser(pendingUser.id)}
                      disabled={processingUser === pendingUser.id}
                      className="flex-1"
                      icon={<CheckCircle className="w-4 h-4" />}
                    >
                      {processingUser === pendingUser.id ? 'Approving...' : 'Approve User'}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleRejectUser(pendingUser.id)}
                      disabled={processingUser === pendingUser.id}
                      className="flex-1"
                      icon={<XCircle className="w-4 h-4" />}
                    >
                      {processingUser === pendingUser.id ? 'Rejecting...' : 'Reject User'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
    </div>
  );
} 