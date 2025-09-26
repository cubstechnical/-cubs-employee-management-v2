'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Clock, Mail, RefreshCw, LogOut } from 'lucide-react';
import AuthService from '@/lib/services/auth';
import toast from 'react-hot-toast';
import { log } from '@/lib/utils/productionLogger';

export default function PendingApproval() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        log.error('Error checking user status:', error);
      }
    };

    checkUserStatus();
  }, []);

  const handleCheckApproval = async () => {
    setIsChecking(true);
    
    try {
      const isApproved = await AuthService.isApproved();
      
      if (isApproved) {
        toast.success('Your account has been approved!');
        router.push('/dashboard');
      } else {
        toast('Your account is still pending approval');
      }
    } catch (error) {
      log.error('Error checking approval status:', error);
      toast.error('Failed to check approval status');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      router.push('/login');
    } catch (error) {
      log.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Account Pending Approval
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your account is currently under review by our administrators.
            </p>
          </div>

          {/* User Info */}
          {user && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Account Details:
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user.name || user.email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          {/* Status Message */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  What happens next?
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Our team will review your account and send you an email once it&apos;s approved. 
                  This usually takes 1-2 business days.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleCheckApproval}
              loading={isChecking}
              disabled={isChecking}
              icon={<RefreshCw className="w-4 h-4" />}
              className="w-full"
            >
              {isChecking ? 'Checking...' : 'Check Approval Status'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSignOut}
              icon={<LogOut className="w-4 h-4" />}
              className="w-full"
            >
              Sign Out
            </Button>
          </div>

          {/* Footer */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>
              Need help? Contact{' '}
              <a
                href="mailto:support@cubstechnical.com"
                className="text-[#d3194f] hover:text-[#b0173a] font-medium"
              >
                support@cubstechnical.com
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
