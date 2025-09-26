"use client";
import React, { useState } from "react";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { log } from '@/lib/utils/productionLogger';

interface DashboardRefreshButtonProps {
  onRefresh: () => Promise<void>;
  lastUpdated?: Date;
}

export const DashboardRefreshButton = ({ onRefresh, lastUpdated }: DashboardRefreshButtonProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshStatus, setLastRefreshStatus] = useState<'success' | 'error' | null>(null);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setLastRefreshStatus(null);
      
      await onRefresh();
      setLastRefreshStatus('success');
      
      // Clear success status after 2 seconds
      setTimeout(() => setLastRefreshStatus(null), 2000);
    } catch (error) {
      log.error('Refresh failed:', error);
      setLastRefreshStatus('error');
      
      // Clear error status after 3 seconds
      setTimeout(() => setLastRefreshStatus(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    }
  };

  return (
    <div className="flex items-center space-x-3">
      {lastUpdated && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Last updated: {formatLastUpdated(lastUpdated)}
        </div>
      )}
      
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`
          flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
          ${isRefreshing 
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400' 
            : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
          }
          border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md
        `}
      >
        <RefreshCw 
          className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
        />
        <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
      </button>

      {/* Status Indicator */}
      {lastRefreshStatus && (
        <div className={`
          flex items-center space-x-1 text-xs px-2 py-1 rounded-full
          ${lastRefreshStatus === 'success' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }
        `}>
          {lastRefreshStatus === 'success' ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <AlertCircle className="w-3 h-3" />
          )}
          <span>
            {lastRefreshStatus === 'success' ? 'Updated' : 'Failed'}
          </span>
        </div>
      )}
    </div>
  );
};
