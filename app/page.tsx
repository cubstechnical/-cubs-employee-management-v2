'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { AppLoadingScreen } from '@/components';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  console.log('🏠 HomePage: Auth state:', { 
    isLoading, 
    hasUser: !!user, 
    userRole: user?.role 
  });

  useEffect(() => {
    console.log('🏠 HomePage: useEffect triggered with:', { 
      isLoading, 
      hasUser: !!user
    });
    
    if (!isLoading) {
      if (!user) {
        console.log('🏠 HomePage: No user, redirecting to login');
        // User is not authenticated, redirect to login
        router.push('/login');
      } else if (!user.approved) {
        console.log('🏠 HomePage: User not approved, redirecting to pending approval');
        // User is authenticated but not approved, redirect to pending approval
        router.push('/pending-approval');
      } else {
        console.log('🏠 HomePage: User approved, redirecting to dashboard');
        // User is authenticated and approved, redirect to main dashboard
        // Both admin and regular users now use the same dashboard
        router.push('/dashboard');
      }
    } else {
      console.log('🏠 HomePage: Still loading, showing loading screen');
    }
  }, [user, isLoading, router]);

  // Show loading screen while checking authentication
  if (isLoading) {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3194f] mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
} 