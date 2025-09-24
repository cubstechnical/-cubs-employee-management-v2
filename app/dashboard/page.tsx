'use client';

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
// Layout is now handled by the root layout
import { EmployeeMetrics } from '@/components/dashboard/EmployeeMetrics';
import CUBSDashboardHeader from '@/components/dashboard/CUBSDashboardHeader';

// Lazy load heavy chart components for better performance
const EmployeeGrowthChart = lazy(() => import('@/components/dashboard/EmployeeGrowthChart'));
const VisaExpiryTrendChart = lazy(() => import('@/components/dashboard/VisaExpiryTrendChart'));
const VisaComplianceScore = lazy(() => import('@/components/dashboard/VisaComplianceScore'));
const RecentEmployeeActivities = lazy(() => import('@/components/dashboard/RecentEmployeeActivities'));
import { DashboardService, DashboardMetrics, VisaTrendData, RecentActivity } from '@/lib/services/dashboard';
import UnifiedErrorBoundary from '@/components/ui/UnifiedErrorBoundary';
// Temporarily disabled performance monitoring to fix infinite loops
// import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';
// import { CoreWebVitals } from '@/components/performance/CoreWebVitals';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      totalEmployees: 0,
      totalDocuments: 0,
      employeeGrowth: 0,
      documentGrowth: 0,
      activeEmployees: 0,
      inactiveEmployees: 0,
      visaExpiringSoon: 0,
      visaExpired: 0,
      visaValid: 0,
      totalCompanies: 0,
    } as DashboardMetrics,
    visaTrendData: {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      expiring: [15, 18, 22, 19, 25, 23],
      expired: [3, 2, 4, 1, 3, 5],
      renewed: [12, 15, 18, 20, 22, 25],
    } as VisaTrendData,
    recentActivities: [] as RecentActivity[],
    complianceScore: 87,
  });

  const fetchDashboardData = useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🚀 Fetching dashboard data...');

        // Load all data in a single optimized call
        const result = await DashboardService.getAllDashboardData();
        if (!result.error) {
          setDashboardData({
            metrics: result.metrics,
            visaTrendData: result.visaTrendData,
            recentActivities: result.recentActivities,
            complianceScore: result.complianceScore
          });
          console.log('✅ All dashboard data loaded successfully');
        } else {
          setError('Failed to load dashboard data. Please try again.');
        }

      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear cache to force fresh data
      DashboardService.clearCache();
      
      console.log('🔄 Refreshing dashboard data...');

      // Use optimized single call to get all dashboard data
      const result = await DashboardService.getAllDashboardData();

      if (result.error) {
        console.error('❌ Failed to refresh dashboard data:', result.error);
        setError(result.error);
      } else {
        // Update all data at once
        setDashboardData({
          metrics: result.metrics,
          visaTrendData: result.visaTrendData,
          recentActivities: result.recentActivities,
          complianceScore: result.complianceScore
        });
        setLastUpdated(new Date());
        console.log('✅ Dashboard refresh completed');
      }

    } catch (error) {
      console.error('❌ Error refreshing dashboard data:', error);
      setError('Failed to refresh dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <UnifiedErrorBoundary context="Dashboard" showNetworkStatus={true}>
      <div className="space-y-6" data-testid="dashboard">
        {/* Error Banner */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
              <div className="ml-auto pl-3">
              <button
                  onClick={() => window.location.reload()}
                  className="text-sm text-red-800 hover:text-red-600 dark:text-red-200 dark:hover:text-red-400 font-medium"
              >
                Refresh
              </button>
              </div>
            </div>
            </div>
          )}

        {/* CUBS Dashboard Header */}
        <CUBSDashboardHeader onRefresh={handleRefresh} lastUpdated={lastUpdated} />
        
        {/* Top Row: Metrics Cards */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12">
            <EmployeeMetrics 
              data={dashboardData.metrics} 
              loading={loading} 
            />
            </div>
        </div>

        {/* Second Row: Company Chart and Compliance Score */}
        <div className="grid grid-cols-12 gap-4">
            {/* Company Chart - Reduced */}
            <div className="col-span-12 lg:col-span-7">
              <EmployeeGrowthChart 
                loading={loading} 
              />
            </div>

            {/* Visa Compliance Score - Moved here */}
            <div className="col-span-12 lg:col-span-5">
              <VisaComplianceScore 
                score={dashboardData.complianceScore}
                loading={loading}
              />
            </div>
                  </div>

        {/* Third Row: Visa Analytics */}
        <div className="grid grid-cols-12 gap-4">
          {/* Visa Expiry Trends */}
          <div className="col-span-12 xl:col-span-7">
            <VisaExpiryTrendChart 
              data={dashboardData.visaTrendData} 
              loading={loading} 
            />
          </div>

          {/* Recent Activities */}
          <div className="col-span-12 xl:col-span-5">
            <RecentEmployeeActivities 
              data={dashboardData.recentActivities}
              loading={loading} 
            />
          </div>
        </div>

        {/* Performance Monitor - Temporarily disabled to fix infinite loops */}
        {/* <PerformanceMonitor componentName="Dashboard" />
        <CoreWebVitals /> */}
      </div>
    </UnifiedErrorBoundary>
  );
}