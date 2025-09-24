"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, UserCheck, Sun, Moon } from "lucide-react";
import { DashboardRefreshButton } from './DashboardRefreshButton';
import { useAuth } from '@/lib/contexts/AuthContext';
import { AuthService } from '@/lib/services/auth';
import { useTheme } from '@/lib/theme';

interface CUBSDashboardHeaderProps {
  onRefresh?: () => Promise<void>;
  lastUpdated?: Date;
}

const CUBSDashboardHeader = React.memo(function CUBSDashboardHeader({ onRefresh, lastUpdated }: CUBSDashboardHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchPendingCount = async () => {
        try {
          const { count } = await AuthService.getPendingApprovalsCount();
          setPendingCount(count);
        } catch (error) {
          console.error('Error fetching pending approvals count:', error);
        }
      };
      fetchPendingCount();
    }
  }, [user]);

  return (
    <div className="mb-8">
      {/* Top Header with Logo and Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-32 h-32 flex items-center justify-center">
            <Image
              src="/assets/cubs.webp"
              alt="CUBS Logo"
              width={120}
              height={120}
              priority
              className="w-32 h-32 opacity-90 hover:opacity-100 transition-opacity"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              CUBS Technical
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              GROUP OF COMPANIES
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              UAE • QATAR • OMAN • KSA
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onRefresh && (
            <DashboardRefreshButton onRefresh={onRefresh} lastUpdated={lastUpdated} />
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
          {user?.role === 'admin' && (
            <button 
              onClick={() => router.push('/admin/approvals')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors relative"
            >
              <UserCheck className="w-4 h-4" />
              Approve Users
              {pendingCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
          <button 
            onClick={() => router.push('/employees/new')}
            className="bg-[#d3194f] hover:bg-[#b0173a] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Main Dashboard Title Section */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Employee Management Dashboard
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Comprehensive workforce management across multiple countries and industries.
        </p>

        {/* Key Indicators */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#d3194f] rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              500+ Active Employees
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Multi-Industry Operations
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Regional Presence
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CUBSDashboardHeader;
