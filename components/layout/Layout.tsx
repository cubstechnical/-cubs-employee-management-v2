'use client';

import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Logo from '@/components/ui/Logo';
import { Menu, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { usePWA } from '@/hooks/usePWA';

import { isMobileDevice } from '@/utils/mobileDetection';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export default function Layout({ children, className }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [persistentSidebar, setPersistentSidebar] = useState(false);
  const { isPWA, isStandalone } = usePWA();

  useEffect(() => {
    // Load persistent sidebar preference from localStorage
    const savedPersistentSidebar = localStorage.getItem('pwa-persistent-sidebar');
    if (savedPersistentSidebar === 'true' && isPWA) {
      setPersistentSidebar(true);
      setSidebarOpen(true);
    }

    const checkMobile = () => {
      // Use the reliable mobile detection utility
      const mobile = isMobileDevice();
      
      setIsMobile(mobile);
      
      // Close sidebar on mobile when screen size changes (unless persistent)
      if (mobile && sidebarOpen && !persistentSidebar) {
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
  }, [sidebarOpen, isPWA, isStandalone, persistentSidebar]);

  const toggleSidebar = () => {
    console.log('🔄 Toggling sidebar:', { 
      currentState: sidebarOpen, 
      newState: !sidebarOpen, 
      isMobile, 
      isPWA,
      isStandalone,
      windowWidth: window.innerWidth,
      touchSupport: 'ontouchstart' in window,
      persistentSidebar
    });
    
    // Force state update
    setSidebarOpen(prev => {
      console.log('Setting sidebar from', prev, 'to', !prev);
      return !prev;
    });
  };

  const closeSidebar = () => {
    console.log('❌ Closing sidebar');
    setSidebarOpen(false);
  };

  const togglePersistentSidebar = () => {
    const newPersistentState = !persistentSidebar;
    setPersistentSidebar(newPersistentState);
    localStorage.setItem('pwa-persistent-sidebar', newPersistentState.toString());
    
    if (newPersistentState && isPWA) {
      setSidebarOpen(true);
    } else if (!newPersistentState) {
      setSidebarOpen(false);
    }
    
    console.log('🔄 Toggled persistent sidebar:', newPersistentState);
  };

  // Mobile behavior is now independent of PWA detection
  const isMobileBehavior = isMobile;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile sidebar overlay - Simple */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={closeSidebar}
          style={{
            touchAction: 'manipulation'
          }}
        />
      )}

      {/* Mobile menu button - Simple and reliable */}
      {isMobile && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Menu button clicked, current state:', sidebarOpen);
            toggleSidebar();
          }}
          className="mobile-menu-button fixed top-4 left-4 z-50 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '48px',
            minHeight: '48px',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          aria-label="Toggle navigation menu"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          ) : (
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      )}

      {/* Sidebar - Simple and reliable */}
      <div 
        className={cn(
          'fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out',
          // On mobile, slide in/out based on sidebarOpen state
          isMobile 
            ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full')
            : 'lg:translate-x-0'
        )}
        style={{
          width: '256px',
          backgroundColor: 'white',
          borderRight: '1px solid #e5e7eb'
        }}
      >
        {/* Simple inline sidebar content */}
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="text-lg font-semibold text-gray-800">Menu</div>
            <button
              onClick={closeSidebar}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <a href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700">
              <div className="w-5 h-5 bg-blue-500 rounded"></div>
              Dashboard
            </a>
            <a href="/employees" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700">
              <div className="w-5 h-5 bg-green-500 rounded"></div>
              Employees
            </a>
            <a href="/documents" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700">
              <div className="w-5 h-5 bg-purple-500 rounded"></div>
              Documents
            </a>
            <a href="/notifications" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700">
              <div className="w-5 h-5 bg-yellow-500 rounded"></div>
              Notifications
            </a>
            <a href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700">
              <div className="w-5 h-5 bg-gray-500 rounded"></div>
              Settings
            </a>
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600">
              <div className="w-5 h-5 bg-red-500 rounded"></div>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className={cn(
        'transition-all duration-300',
        // On mobile with persistent sidebar, add margin
        // On mobile without persistent, no margin (sidebar overlays)
        // On desktop, add margin based on sidebar state
        isMobile 
          ? (persistentSidebar ? (sidebarCollapsed ? 'ml-16' : 'ml-64') : 'ml-0')
          : sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64',
        className
      )}>
        
        {/* Debug indicator - temporary */}
        {isMobile && (
          <div className="fixed top-16 left-4 z-50 p-2 bg-blue-500 text-white text-xs rounded">
            Sidebar: {sidebarOpen ? 'OPEN' : 'CLOSED'}
          </div>
        )}
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