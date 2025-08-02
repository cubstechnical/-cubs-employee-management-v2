'use client';

import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { cn } from '@/utils/cn';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export default function Layout({ children, className }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
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
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className={cn(
        'transition-all duration-300',
        isMobile ? 'ml-0' : 'lg:ml-64',
        className
      )}>
        <div className="p-4 lg:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
} 