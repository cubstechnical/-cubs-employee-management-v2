'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Clock,
  RefreshCw,
  Building2,
  CheckCircle,
  AlertCircle,
  LogOut,
  UserCheck,
  XCircle
} from 'lucide-react';
import { AuthService } from '@/lib/services/auth';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function PendingApproval() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isRejected, setIsRejected] = useState(false);

  const checkUserProfile = useCallback(async () => {
    try {
      const user = await AuthService.getCurrentUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile && !error) {
          setUserProfile(profile);
        }
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
    }
  }, []);

  const checkApprovalStatus = useCallback(async () => {
    setCheckingStatus(true);
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('approved_by, status')
        .eq('id', user.id)
        .single();

      if (profile && !error) {
        if (profile.approved_by && profile.approved_by !== 'REJECTED') {
          toast.success('Your account has been approved! Redirecting to dashboard...');
          router.push('/dashboard');
        } else if (profile.approved_by === 'REJECTED' || profile.status === 'rejected') {
          // User is rejected
          setIsRejected(true);
          setCheckingStatus(false);
        } else {
          // Still not approved, stay on this page
          setIsRejected(false);
          setCheckingStatus(false);
        }
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
      setCheckingStatus(false);
    }
  }, [router]);

  useEffect(() => {
    checkApprovalStatus();
    checkUserProfile();
  }, [checkApprovalStatus, checkUserProfile]);

  const handleRefresh = () => {
    checkApprovalStatus();
  };

  const handleReapply = async () => {
    setLoading(true);
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        toast.error('User not found');
        return;
      }

      const { error } = await AuthService.reapplyUser(user.id);
      if (error) {
        toast.error(`Failed to reapply: ${error.message}`);
      } else {
        toast.success('Reapplication submitted successfully! Please wait for admin approval.');
        setIsRejected(false);
        // Refresh the page to show pending status
        window.location.reload();
      }
    } catch (error) {
      toast.error('Failed to reapply');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await AuthService.signOut();
      if (error) {
        toast.error('Failed to sign out');
      } else {
        router.push('/login');
      }
    } catch (error) {
      toast.error('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 dark:bg-primary-500 rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CUBS Technical</h1>
        </div>

        <Card className="p-8 text-center">
          {isRejected ? (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Account Rejected
              </h2>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your account application was not approved. You can reapply if you believe this was an error or if your circumstances have changed.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Account Pending Approval
              </h2>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your account has been created successfully and is waiting for admin approval.
              </p>
            </>
          )}

          {userProfile && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                <UserCheck className="w-4 h-4 mr-2" />
                Account Details:
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>Email:</strong> {userProfile.email}</p>
                <p><strong>Name:</strong> {userProfile.full_name}</p>
                <p><strong>Role:</strong> {userProfile.role}</p>
                <p><strong>Status:</strong> 
                  {isRejected ? (
                    <span className="text-red-600 dark:text-red-400">Rejected</span>
                  ) : (
                    <span className="text-orange-600 dark:text-orange-400">Pending Approval</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {isRejected ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6 text-left">
              <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                About reapplying:
              </h4>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                <li>• Click &quot;Reapply&quot; to submit a new application</li>
                <li>• Your previous application data will be preserved</li>
                <li>• An admin will review your new application</li>
                <li>• You&apos;ll receive notification when approved</li>
              </ul>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 text-left">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                What happens next:
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• An admin will review your account</li>
                <li>• You&apos;ll receive email notification when approved</li>
                <li>• This process typically takes 1-2 business days</li>
                <li>• You can check status by refreshing this page</li>
              </ul>
            </div>
          )}

          <div className="space-y-4">
            {isRejected ? (
              <div className="flex space-x-3">
                <Button
                  onClick={handleReapply}
                  disabled={loading}
                  className="flex-1"
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  {loading ? 'Reapplying...' : 'Reapply'}
                </Button>

                <Button
                  onClick={handleSignOut}
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                  icon={<LogOut className="w-4 h-4" />}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Button
                  onClick={handleRefresh}
                  disabled={checkingStatus}
                  variant="outline"
                  className="flex-1"
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  {checkingStatus ? 'Checking...' : 'Check Status'}
                </Button>

                <Button
                  onClick={handleSignOut}
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                  icon={<LogOut className="w-4 h-4" />}
                >
                  Sign Out
                </Button>
              </div>
            )}

            <div className="text-sm text-gray-500 dark:text-gray-500">
              {isRejected 
                ? 'Need help? Contact your system administrator if you have questions about the rejection.'
                : 'Need help? Contact your system administrator for approval status.'
              }
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {isRejected
                  ? 'Click "Reapply" to submit a new application for review.'
                  : 'Once approved, you&apos;ll be automatically redirected to the dashboard.'
                }
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
