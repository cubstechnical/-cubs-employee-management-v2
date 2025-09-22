'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import AuthService from '@/lib/services/auth';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setIsValidToken(false);
      return;
    }
    // Here you would typically validate the token with your backend
    setIsValidToken(true);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    
    try {
      const token = searchParams.get('token');
      if (!token) {
        toast.error('Invalid reset token');
        return;
      }

      // Here you would typically call your backend to reset the password
      // const { error } = await AuthService.resetPasswordWithToken(token, password);
      
      // For now, simulate success
      toast.success('Password reset successfully!');
      router.push('/login');
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d3194f] mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              Validating reset token...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <AlertCircle className="w-16 h-16 text-red-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Invalid Reset Link
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                This password reset link is invalid or has expired.
              </p>
            </div>

            <Button
              onClick={() => router.push('/forgot-password')}
              className="w-full"
            >
              Request New Reset Link
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reset Password
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your new password below
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="New Password"
              type="password"
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              loading={isLoading}
              disabled={!password || !confirmPassword || isLoading}
              className="w-full"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>
              Remember your password?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-[#d3194f] hover:text-[#b0173a] font-medium"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}



