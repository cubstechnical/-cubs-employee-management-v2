'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';

export default function HomePage() {
  const router = useRouter();
  const { user, loading, isApproved } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User is not authenticated, redirect to login
        router.push('/login');
      } else if (!isApproved) {
        // User is authenticated but not approved, redirect to pending approval
        router.push('/pending-approval');
      } else {
        // User is authenticated and approved, redirect to appropriate dashboard
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [user, loading, isApproved, router]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <AppLoadingScreen 
        message="Initializing Application..." 
        showProgress={true}
        progress={50}
      />
    );
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
} 