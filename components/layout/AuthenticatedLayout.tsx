'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/SimpleAuthContext';
import OptimizedLayout from './OptimizedLayout';

interface AuthenticatedLayoutProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

/**
 * Wrapper for pages that require authentication
 * Handles auth checks and redirects
 */
export default function AuthenticatedLayout({ 
  children, 
  requireAuth = true,
  requireAdmin = false 
}: AuthenticatedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && requireAuth) {
      if (!user) {
        // Not authenticated, redirect to login
        router.replace('/login');
      } else if (!user.approved && pathname !== '/pending-approval') {
        // Not approved, redirect to pending approval
        router.replace('/pending-approval');
      } else if (requireAdmin && user.role !== 'admin') {
        // Not admin, redirect to dashboard
        router.replace('/dashboard');
      }
    }
  }, [user, isLoading, requireAuth, requireAdmin, router, pathname]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d3194f] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if auth requirements not met
  if (requireAuth) {
    if (!user) return null;
    if (!user.approved && pathname !== '/pending-approval') return null;
    if (requireAdmin && user.role !== 'admin') return null;
  }

  return (
    <OptimizedLayout>
      {children}
    </OptimizedLayout>
  );
}

