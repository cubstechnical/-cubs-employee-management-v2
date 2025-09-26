'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/SimpleAuthContext';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import OfflineIndicator from '@/components/ui/OfflineIndicator';
import Sidebar from './Sidebar';
import { useMobileApp } from '@/hooks/useMobileApp';
import { isMobileDevice } from '@/utils/mobileDetection';
import { Menu, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { PerformanceTracker } from '@/components/ui/PerformanceTracker';
import { log } from '@/lib/utils/productionLogger';

interface OptimizedLayoutProps {
  children: ReactNode;
  className?: string;
}

function OptimizedLayoutContent({ children, className }: OptimizedLayoutProps) {
  const pathname = usePathname();
  const { isLoading: authLoading, user } = useAuth();
  
  // Safety check for pathname
  const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPublicPage, setIsPublicPage] = useState(false);

  // Initialize mobile app functionality
  useMobileApp();

  // Note: Route prefetching is handled automatically by Next.js App Router
  // when using Link components with prefetch prop in the Sidebar component

  // Update public page status when pathname changes
  useEffect(() => {
    // Define public pages that shouldn't show sidebar
    const publicPages = ['/login', '/register', '/forgot-password', '/reset-password', '/callback', '/delete-account', '/privacy', '/terms', '/pending', '/pending-approval'];
    
    const normalizedPathname = currentPath.replace(/\/$/, '');
    const isPublic = publicPages.includes(normalizedPathname);
    setIsPublicPage(isPublic);
    
    // Only log in development and reduce frequency
    if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
      log.info('🔍 OptimizedLayout: Pathname check:', { 
        pathname: currentPath, 
        normalizedPathname, 
        isPublic 
      });
    }
  }, [currentPath]);

  useEffect(() => {
    const checkMobile = () => {
      try {
        const mobile = isMobileDevice();
        setIsMobile(mobile);
      } catch (error) {
        // Fallback to desktop if mobile detection fails
        setIsMobile(false);
      }
    };

    checkMobile();
    
    // Only add event listeners if window is available
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      window.addEventListener('orientationchange', () => {
        setTimeout(checkMobile, 100);
      });
      
      return () => {
        window.removeEventListener('resize', checkMobile);
        window.removeEventListener('orientationchange', checkMobile);
      };
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Show loading only during auth initialization, not for pathname
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center safe-area-inset-top safe-area-inset-bottom">
        <div className="text-center space-y-4 p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d3194f] mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Initializing Application...
          </p>
        </div>
      </div>
    );
  }

  // For public pages, render without sidebar
  const shouldHideSidebar = isPublicPage;
  
  if (shouldHideSidebar) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-area-inset-top safe-area-inset-bottom">
        {/* Page content */}
        <main className={cn(
          "flex-1 p-4 lg:p-6 overflow-auto",
          isMobile ? "p-2 sm:p-3" : "p-4 lg:p-6",
          className
        )}>
          <div className="min-h-full w-full">
            {children}
          </div>
        </main>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
              border: '1px solid var(--toast-border)',
            },
          }}
        />

        {/* Offline indicator */}
        <OfflineIndicator />
        
        {/* Performance tracking - temporarily disabled due to performance issues */}
        {/* <PerformanceTracker /> */}
      </div>
    );
  }

  // For authenticated pages, render with sidebar only if user is authenticated
  // If user is not authenticated on a protected page, redirect to login
  if (!user && !shouldHideSidebar) {
    // Redirect to login if trying to access protected page without auth
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d3194f] mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" style={{ contain: 'layout style paint' }}>
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar - only show if user is authenticated */}
      {user && (
        <aside
          id="mobile-sidebar"
          className={cn(
            "bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out overflow-hidden",
            // Desktop: always visible, mobile: toggle based on sidebarOpen
            isMobile
              ? "fixed inset-y-0 left-0 z-50 transform " + (sidebarOpen ? "translate-x-0" : "-translate-x-full")
              : "relative flex-shrink-0",
            sidebarCollapsed && !isMobile ? "w-16" : "w-64"
          )}
          style={{ minWidth: sidebarCollapsed && !isMobile ? '4rem' : '16rem' }}
          role="navigation"
          aria-label="Main navigation"
          aria-hidden={isMobile ? !sidebarOpen : false}
        >
          <Sidebar
            onClose={isMobile ? toggleSidebar : undefined}
            onCollapseChange={setSidebarCollapsed}
          />
        </aside>
      )}

      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300",
        isMobile ? "overflow-auto" : "overflow-hidden"
      )}>
        {/* Mobile header - only show if user is authenticated */}
        {isMobile && user && (
          <header
            className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between lg:hidden safe-area-inset-top"
            role="banner"
            aria-label="Mobile navigation header"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Toggle navigation menu"
                aria-expanded={sidebarOpen}
                aria-controls="mobile-sidebar"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                CUBS Technical
              </h1>
            </div>
            <div className="w-10" /> {/* Spacer */}
          </header>
        )}

        {/* Page content */}
        <main className={cn(
          "flex-1 p-4 lg:p-6 overflow-auto safe-area-inset-bottom",
          isMobile ? "p-2 sm:p-3 pb-safe" : "p-4 lg:p-6",
          className
        )}>
          <div className="min-h-full w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            border: '1px solid var(--toast-border)',
          },
        }}
      />

      {/* Offline indicator */}
      <OfflineIndicator />
      
      {/* Performance tracking - temporarily disabled due to performance issues */}
      {/* <PerformanceTracker /> */}
    </div>
  );
}

export default function OptimizedLayout({ children, className }: OptimizedLayoutProps) {
  return (
    <OptimizedLayoutContent className={className}>
      {children}
    </OptimizedLayoutContent>
  );
}
