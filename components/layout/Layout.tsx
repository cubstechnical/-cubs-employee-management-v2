'use client';

import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Logo from '@/components/ui/Logo';
import { Menu, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { usePWA } from '@/hooks/usePWA';
import { PWADebugger } from '@/components/ui/PWADebugger';

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
      // More comprehensive mobile detection for PWA
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 1024;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // In PWA mode, prioritize touch device detection
      const mobile = isPWA ? (isMobileDevice || isTouchDevice || isSmallScreen) : isSmallScreen;
      
      setIsMobile(mobile);
      
      // Debug logging for PWA
      console.log('🔍 Mobile check:', { 
        mobile, 
        width: window.innerWidth,
        height: window.innerHeight,
        isPWA, 
        isStandalone,
        isMobileDevice,
        isSmallScreen,
        isTouchDevice,
        userAgent: navigator.userAgent.includes('Mobile'),
        touchSupport: 'ontouchstart' in window,
        maxTouchPoints: navigator.maxTouchPoints,
        persistentSidebar
      });
      
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
    setSidebarOpen(!sidebarOpen);
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

  // Determine if we should show mobile behavior
  const isMobileBehavior = isPWA || isMobile;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile sidebar overlay - Enhanced for PWA */}
      {sidebarOpen && isMobileBehavior && !persistentSidebar && (
        <div 
          className="pwa-sidebar-overlay pwa-sidebar-backdrop fixed inset-0 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile menu button - Enhanced for PWA */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "pwa-sidebar-button pwa-sidebar-menu-button fixed top-4 left-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors",
          // Always show in PWA mode, or on mobile screens
          isMobileBehavior ? "block" : "lg:hidden"
        )}
        style={{ 
          // Force visibility in PWA mode
          display: isMobileBehavior ? 'flex !important' : undefined,
          alignItems: 'center',
          justifyContent: 'center',
          // Add visual feedback for PWA
          boxShadow: isPWA ? '0 4px 12px rgba(0, 0, 0, 0.15)' : undefined
        }}
        aria-label="Toggle navigation menu"
      >
        {sidebarOpen ? (
          <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        ) : (
          <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {/* Sidebar - Enhanced for PWA */}
      <div className={cn(
        'pwa-sidebar pwa-sidebar-content pwa-sidebar-transition fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out',
        // In PWA mode with persistent sidebar, always show
        // In PWA mode without persistent, use mobile behavior (slide in/out)
        // On desktop, show sidebar by default unless mobile
        isMobileBehavior 
          ? (persistentSidebar ? 'translate-x-0' : (sidebarOpen ? 'translate-x-0' : '-translate-x-full'))
          : 'lg:translate-x-0',
        // Add backdrop blur for PWA
        isPWA && sidebarOpen ? 'backdrop-blur-sm' : ''
      )}>
        <Sidebar 
          onClose={persistentSidebar ? undefined : closeSidebar} 
          onCollapseChange={setSidebarCollapsed}
          isPersistent={persistentSidebar}
          onTogglePersistent={togglePersistentSidebar}
          isPWA={isPWA}
        />
      </div>

      {/* Main content */}
      <main className={cn(
        'transition-all duration-300',
        // In PWA mode with persistent sidebar, add margin
        // In PWA mode without persistent, no margin (sidebar overlays)
        // On desktop, add margin based on sidebar state
        isMobileBehavior 
          ? (persistentSidebar ? (sidebarCollapsed ? 'ml-16' : 'ml-64') : 'ml-0')
          : sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64',
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
      
      {/* PWA Debugger - Only shows in development or PWA mode */}
      <PWADebugger />
    </div>
  );
}