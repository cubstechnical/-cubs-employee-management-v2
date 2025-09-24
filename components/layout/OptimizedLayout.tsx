'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@/lib/theme';
import { AuthProvider, useAuth } from '@/lib/contexts/AuthContext';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import OfflineIndicator from '@/components/ui/OfflineIndicator';
import Sidebar from './Sidebar';
import { useMobileApp } from '@/hooks/useMobileApp';
import { isMobileDevice } from '@/utils/mobileDetection';
import { Menu, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { PerformanceTracker } from '@/components/ui/PerformanceTracker';

interface OptimizedLayoutProps {
  children: ReactNode;
  className?: string;
}

function OptimizedLayoutContent({ children, className }: OptimizedLayoutProps) {
  const pathname = usePathname();
  const { isLoading: authLoading, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPublicPage, setIsPublicPage] = useState(false);

  // Initialize mobile app functionality
  useMobileApp();

  // Update public page status when pathname changes
  useEffect(() => {
    // Define public pages that shouldn't show sidebar
    const publicPages = ['/login', '/register', '/forgot-password', '/reset-password', '/callback', '/delete-account', '/privacy', '/terms', '/pending', '/pending-approval'];
    
    // Use pathname if available, otherwise fallback to window.location
    const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
    const normalizedPathname = currentPath.replace(/\/$/, '');
    const isPublic = publicPages.includes(normalizedPathname);
    setIsPublicPage(isPublic);
    
    // Only log in development and reduce frequency
    if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
      console.log('🔍 OptimizedLayout: Pathname check:', { 
        pathname, 
        currentPath, 
        normalizedPathname, 
        isPublic 
      });
    }
  }, [pathname]);

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Page content */}
        <main className={cn("flex-1 p-4 lg:p-6", className)}>
          {children}
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
        <div className={cn(
          "bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out overflow-hidden",
          // Desktop: always visible, mobile: toggle based on sidebarOpen
          isMobile 
            ? "fixed inset-y-0 left-0 z-50 transform " + (sidebarOpen ? "translate-x-0" : "-translate-x-full")
            : "relative flex-shrink-0",
          sidebarCollapsed && !isMobile ? "w-16" : "w-64"
        )} style={{ minWidth: sidebarCollapsed && !isMobile ? '4rem' : '16rem' }}>
          <Sidebar 
            onClose={isMobile ? toggleSidebar : undefined}
            onCollapseChange={setSidebarCollapsed}
          />
        </div>
      )}

      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300",
        isMobile ? "overflow-auto" : "overflow-hidden"
      )}>
        {/* Mobile header - only show if user is authenticated */}
        {isMobile && user && (
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between lg:hidden">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              CUBS Technical
            </h1>
            <div className="w-10" /> {/* Spacer */}
          </header>
        )}

        {/* Page content */}
        <main className={cn(
          "flex-1 p-4 lg:p-6 overflow-auto",
          isMobile ? "p-2 sm:p-3" : "p-4 lg:p-6",
          className
        )}>
          {children}
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
    <ErrorBoundary>
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            <OptimizedLayoutContent className={className}>
              {children}
            </OptimizedLayoutContent>
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
