'use client';

import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Logo from '@/components/ui/Logo';
import RoutePreloader from '@/components/performance/RoutePreloader';

import { cn } from '@/utils/cn';
import { usePWA } from '@/hooks/usePWA';
import { Menu, X } from 'lucide-react';
import { isMobileDevice } from '@/utils/mobileDetection';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export default function Layout({ children, className }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isPWA, isStandalone } = usePWA();

  useEffect(() => {
    const checkMobile = () => {
      // Use the reliable mobile detection utility
      const mobile = isMobileDevice();
      
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(checkMobile, 100); // Small delay to ensure proper dimensions
    });
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []); // Remove sidebarOpen dependency!

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };





  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="mobile-sidebar-overlay fixed inset-0 bg-black bg-opacity-50 lg:hidden"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            closeSidebar();
          }}
          style={{
            zIndex: 50,
            touchAction: 'manipulation'
          }}
          aria-label="Close sidebar"
          role="button"
          tabIndex={0}
        />
      )}



      {/* Sidebar */}
      <div 
        id="main-navigation"
        className={cn(
          'fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out z-[60]',
          // Simple mobile logic: if mobile, show/hide based on sidebarOpen state
          // If desktop, always show (translate-x-0)
          isMobile 
            ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full')
            : 'lg:translate-x-0'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <Sidebar 
          onClose={closeSidebar} 
          onCollapseChange={setSidebarCollapsed}
        />
      </div>

      {/* Main content */}
      <main className={cn(
        'transition-all duration-300 min-h-screen',
        // MOBILE OPTIMIZED: Better responsive layout
        isMobile 
          ? 'ml-0' // Mobile: full width
          : sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64', // Desktop: account for sidebar
        className
      )}>
        {/* Header - Mobile Optimized */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 lg:space-x-4">
              {/* Mobile menu button - positioned next to logo */}
              {isMobile && (
                <button
                  onClick={toggleSidebar}
                  className="mobile-menu-btn p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors lg:hidden"
                  aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
                  aria-expanded={sidebarOpen}
                  aria-controls="main-navigation"
                >
                  {sidebarOpen ? (
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              )}
              <Logo size={isMobile ? "md" : "lg"} showText={!isMobile} />
            </div>
            <div className="flex items-center space-x-3 lg:space-x-4">
              <ThemeToggle size="sm" variant="minimal" />
            </div>
          </div>
        </header>
        
        {/* Content - Mobile Optimized */}
        <div className={cn(
          'bg-gray-50 dark:bg-gray-900 min-h-screen',
          // MOBILE OPTIMIZED: Responsive padding for better mobile experience
          isMobile ? 'p-2 sm:p-3' : 'p-4 lg:p-6'
        )}>
          {children}
        </div>
      </main>
      
      {/* Route preloader for smooth navigation */}
      <RoutePreloader />
    </div>
  );
}
