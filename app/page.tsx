'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/SimpleAuthContext';
import Image from 'next/image';

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
        // User is not authenticated, redirect to login immediately
        router.replace('/login');
      } else if (!user.approved) {
        console.log('🏠 HomePage: User not approved, redirecting to pending approval');
        // User is authenticated but not approved, redirect to pending approval
        router.replace('/pending-approval');
      } else {
        console.log('🏠 HomePage: User approved, redirecting to dashboard');
        // User is authenticated and approved, redirect to main dashboard
        router.replace('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  // Show minimal loading screen (faster, smaller logo)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#d3194f]/5 via-white to-[#b0173a]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center space-y-4">
        {/* Small CUBS Logo */}
        <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto shadow-lg border border-gray-200 dark:border-gray-700">
          <Image
            src="/assets/cubs.webp"
            alt="CUBS Technical"
            width={40}
            height={40}
            className="object-contain"
            priority
          />
        </div>
        
        {/* Loading Spinner */}
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d3194f]"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isLoading ? 'Loading...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    </div>
  );
} 