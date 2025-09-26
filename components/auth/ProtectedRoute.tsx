'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/SimpleAuthContext';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  requiredPermission,
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!user.approved) {
        router.push('/pending-approval');
      }
    }
  }, [user, isLoading, router]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <AppLoadingScreen message="Checking Authentication..." />;
  }

  // Redirect to login if not authenticated or to pending approval if not approved
  if (!user || !user.approved) {
    return null; // Will redirect in useEffect
  }

  // Check permissions if required
  if (requiredPermission) {
    // For now, we'll do a simple role check
    // In a real app, you'd want to check specific permissions
    if (user.role !== 'admin' && requiredPermission !== 'view_employees') {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don&apos;t have permission to access this page.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
} 
