'use client';

import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Logo from '@/components/ui/Logo';
import { Menu, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { usePWA } from '@/hooks/usePWA';

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
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Debug logging for PWA
      console.log('🔍 Mobile check:', { 
        mobile, 
        width: window.innerWidth, 
        isPWA, 
        isStandalone,
        userAgent: navigator.userAgent.includes('Mobile')
      });
      
      // Close sidebar on mobile when screen size changes
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // PWA-specific: Handle orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(checkMobile, 100); // Small delay to ensure proper dimensions
    });
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, [sidebarOpen, isPWA, isStandalone]);

  const toggleSidebar = () => {
    console.log('🔄 Toggling sidebar:', { 
      currentState: sidebarOpen, 
      newState: !sidebarOpen, 
      isMobile, 
      isPWA 
    });
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    console.log('❌ Closing sidebar');
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
          onTouchEnd={closeSidebar}
          style={{ touchAction: 'manipulation' }}
        />
      )}

      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        onTouchEnd={(e) => {
          e.preventDefault();
          toggleSidebar();
        }}
        className="fixed top-4 left-4 z-50 lg:hidden p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors touch-manipulation"
        style={{ 
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minWidth: '44px',
          minHeight: '44px'
        }}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? (
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        ) : (
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar onClose={closeSidebar} onCollapseChange={setSidebarCollapsed} />
      </div>

      {/* Main content */}
      <main className={cn(
        'transition-all duration-300',
        isMobile ? 'ml-0' : sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64',
        className
      )}>
        {/* Header - Mobile Optimized */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <Logo size={isMobile ? "md" : "lg"} showText={!isMobile} />
            </div>
            <div className="flex items-center space-x-3 lg:space-x-4">
              <ThemeToggle size="sm" variant="minimal" />
            </div>
          </div>
        </header>
        
        {/* Content - Mobile Optimized */}
        <div className="p-3 lg:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
} 