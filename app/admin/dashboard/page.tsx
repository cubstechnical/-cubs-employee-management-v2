'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { lazy, Suspense } from 'react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Users,
  FileText,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  Monitor,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck
} from 'lucide-react';
import { formatDate, timeAgo } from '@/utils/date';
import { cn } from '@/utils/cn';
import { OptimizedDashboardService, OptimizedDashboardStats } from '@/lib/services/dashboard';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { AuthService } from '@/lib/services/auth';
import { useAuth } from '@/lib/contexts/AuthContext';
import toast from 'react-hot-toast';
import LoadingTracker from '@/components/performance/LoadingTracker';
import { LazyChart, LazyPerformanceDashboard, ChartLoadingFallback } from '@/components/performance/LazyComponents';

// PERFORMANCE: Using optimized lazy loading components

// CUBS-inspired magenta color palette
const colors = {
  primary: 'from-pink-500 to-purple-600',
  secondary: 'from-purple-500 to-indigo-600',
  accent: 'from-rose-500 to-pink-600',
  success: 'from-emerald-500 to-teal-600',
  warning: 'from-amber-500 to-orange-500',
  danger: 'from-red-500 to-pink-600',
  neutral: 'from-gray-500 to-slate-600',
  glass: 'backdrop-blur-xl bg-pink-50/20 dark:bg-pink-900/10 border border-pink-200/30 dark:border-pink-600/30'
};

// Enhanced urgency colors with gradients
const urgencyColors = {
  critical: 'from-red-500 to-pink-600',
  high: 'from-orange-500 to-red-500',
  medium: 'from-yellow-500 to-orange-500',
  low: 'from-green-500 to-emerald-600'
};

// Animated Stat Card with Apple-inspired design
const AnimatedStatCard = memo(function AnimatedStatCard({ label, value, change, changeType, icon: Icon, gradient, description, loading = false, delay = 0 }: any) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-8 animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-full w-24"></div>
          <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded-full w-20"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-full w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ease-out cursor-pointer group",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        "hover:shadow-lg hover:-translate-y-1",
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Content */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${gradient})` }}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </div>
            </div>
          </div>
          {change && (
          <div className="flex items-center space-x-2">
            <div className={cn(
                "flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full",
                changeType === 'positive' 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" 
                  : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            )}>
              {changeType === 'positive' ? (
                  <ArrowUpRight className="w-3 h-3" />
              ) : (
                  <ArrowDownRight className="w-3 h-3" />
              )}
              <span>{change}</span>
            </div>
              <span className="text-xs text-gray-500">vs last month</span>
          </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Enhanced Chart Card with Apple design
function EnhancedChartCard({ title, children, className = '', subtitle, loading = false, gradient = colors.primary }: any) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className={cn("rounded-3xl p-8 animate-pulse", colors.glass)}>
        <div className="space-y-6">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded-full w-48"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-full w-64"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-300 dark:bg-gray-600 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-300 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        "hover:shadow-lg",
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>
      <div>
      {children}
      </div>
    </div>
  );
}

// OPTIMIZED: Enhanced Company Chart with lazy loading
function EnhancedCompanyChart({ data, loading }: { data: any[], loading: boolean }) {

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-32 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  const labels = (data || []).map(d => d.name);
  const series = (data || []).map(d => Math.max(0, Number(d.employees) || 0));
  const total = series.reduce((a, b) => a + b, 0);
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const options: any = {
    chart: {
      type: 'donut',
      animations: { enabled: true, easing: 'easeinout', speed: 700 },
      toolbar: { show: false },
      dropShadow: { enabled: true, top: 2, left: 2, blur: 3, opacity: 0.15 }
    },
    labels,
    legend: { position: 'bottom', labels: { colors: undefined } },
    stroke: { width: 2, colors: ['transparent'] },
    dataLabels: { enabled: true, style: { fontSize: '12px' } },
    tooltip: { y: { formatter: (val: number) => `${val.toLocaleString()} employees` } },
    fill: {
      type: 'gradient',
      gradient: { shade: 'light', type: 'horizontal', shadeIntensity: 0.3, opacityFrom: 0.9, opacityTo: 0.9 }
    },
    theme: { mode: isDark ? 'dark' : 'light' },
    plotOptions: {
      pie: {
        startAngle: 0,
        donut: {
          size: '62%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Employees',
              formatter: () => total.toLocaleString()
            }
          }
        }
      }
    },
    responsive: [
      { breakpoint: 1280, options: { chart: { height: 340 } } },
      { breakpoint: 1024, options: { chart: { height: 300 }, legend: { position: 'bottom' } } },
      { breakpoint: 640, options: { chart: { height: 280 } } }
    ]
  };

  return (
    <div className="w-full">
      <LazyChart options={options} series={series} type="donut" height={380} />
    </div>
  );
}

// Enhanced Visa Alert Card with Apple design
function EnhancedVisaAlertCard({ alert }: { alert: any }) {
  const [isHovered, setIsHovered] = useState(false);

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <AlertTriangle className="w-5 h-5" />;
      case 'high': return <Clock className="w-5 h-5" />;
      case 'medium': return <Calendar className="w-5 h-5" />;
      default: return <CheckCircle className="w-5 h-5" />;
    }
  };

  return (
    <div 
      className="p-4 rounded-xl border-l-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
      style={{
        borderLeftColor: alert.urgency === 'critical' ? '#ef4444' : 
                         alert.urgency === 'high' ? '#f97316' : 
                         alert.urgency === 'medium' ? '#eab308' : '#22c55e'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: alert.urgency === 'critical' ? '#fee2e2' : 
                              alert.urgency === 'high' ? '#fed7aa' : 
                              alert.urgency === 'medium' ? '#fef3c7' : '#dcfce7',
              color: alert.urgency === 'critical' ? '#dc2626' : 
                     alert.urgency === 'high' ? '#ea580c' : 
                     alert.urgency === 'medium' ? '#ca8a04' : '#16a34a'
            }}
          >
            {getUrgencyIcon(alert.urgency)}
        </div>
        <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {alert.name}
          </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{alert.visa_type}</p>
        </div>
      </div>
      <div className="text-right">
          <p 
            className="font-semibold text-sm px-3 py-1 rounded-full"
            style={{
              backgroundColor: alert.urgency === 'critical' ? '#fee2e2' : 
                              alert.urgency === 'high' ? '#fed7aa' : 
                              alert.urgency === 'medium' ? '#fef3c7' : '#dcfce7',
              color: alert.urgency === 'critical' ? '#dc2626' : 
                     alert.urgency === 'high' ? '#ea580c' : 
                     alert.urgency === 'medium' ? '#ca8a04' : '#16a34a'
            }}
          >
            {alert.daysLeft} days left
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(alert.visa_expiry_date)}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [isRefreshingApprovals, setIsRefreshingApprovals] = useState(false);
  // Auto refresh disabled per requirements

  // OPTIMIZED: Single dashboard data state
  const [dashboardData, setDashboardData] = useState<OptimizedDashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalDocuments: 0,
    pendingApprovals: 0,
    visasExpiringSoon: 0,
    departments: 0,
    companyDistribution: [],
    departmentDistribution: [],
    expiringVisas: [],
    recentActivity: []
  });
  
  // Filter state
  const [filters, setFilters] = useState<{dateRange: string}>({
    dateRange: '30d'
  });

  const loadPendingApprovals = useCallback(async (showToast = false) => {
    setIsRefreshingApprovals(true);
    try {
      const { users, error } = await AuthService.getPendingApprovals();
      if (!error) {
        const previousCount = pendingApprovals.length;

        setPendingApprovals(users);

        // Show toast if count changed and showToast is true
        if (showToast && previousCount !== users.length) {
          if (users.length === 0) {
            toast.success('All pending approvals have been processed!');
          } else if (users.length < previousCount) {
            toast.success('Pending approvals updated!');
          }
        }
      }
    } catch (error) {
      // Silent error handling for background polling
    } finally {
      setIsRefreshingApprovals(false);
    }
  }, [pendingApprovals.length]);

  // Load pending approvals
  useEffect(() => {
    if (user?.role === 'admin') {
      // Initial load
      loadPendingApprovals();

      // Set up periodic refresh for pending approvals (every 30 seconds to reduce load)
      const interval = setInterval(() => {
        loadPendingApprovals();
      }, 30000);

      // Listen for approval/rejection events from admin approvals page
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'adminDashboardRefresh' && e.newValue) {
          // Force immediate refresh with no delay
          setTimeout(() => {
            loadPendingApprovals(true);
            // Clear the flag
            localStorage.removeItem('adminDashboardRefresh');
          }, 100); // Small delay to ensure the database operation is complete
        }
      };

      // Also listen for localStorage changes in the same tab
      const handleLocalStorageChange = () => {
        const refreshFlag = localStorage.getItem('adminDashboardRefresh');
        if (refreshFlag) {
          setTimeout(() => {
            loadPendingApprovals(true);
            localStorage.removeItem('adminDashboardRefresh');
          }, 100); // Small delay to ensure the database operation is complete
        }
      };

      window.addEventListener('storage', handleStorageChange);

      // Check for refresh flag on component mount
      handleLocalStorageChange();

      return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [user, loadPendingApprovals]);

  // OPTIMIZED: Single API call for all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const startTime = performance.now();

      // PERFORMANCE: Single optimized API call
      const data = await OptimizedDashboardService.getDashboardStats();
      setDashboardData(data);
      setIsLoading(false);

      const endTime = performance.now();
      console.log(`✅ Dashboard loaded in ${(endTime - startTime).toFixed(2)}ms`);

    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
      setIsLoading(false);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Function to refresh pending approvals (can be called from child components)
  const refreshPendingApprovals = () => {
    loadPendingApprovals();
  };

  // Real-time updates (throttled inside hook); enable only when page is visible
  const { isConnected, lastUpdate, refresh } = useRealtimeDashboard({
    onDataChange: fetchDashboardData,
    enabled: false
  });

  useEffect(() => {
    // OPTIMIZED: Single load with all data
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleFilterChange = (newFilters: Partial<{dateRange: string}>) => {
    setFilters((prev: {dateRange: string}) => ({ ...prev, ...newFilters }));
  };

  const handleManualRefresh = () => {
    // Clear cache to force fresh data
    OptimizedDashboardService.clearCache();
    fetchDashboardData();
    toast.success('Dashboard refreshed');
  };

  const statCards = [
    {
      label: 'Employees',
      value: dashboardData.totalEmployees,
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
      gradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
      description: 'Current headcount'
    },
    {
      label: 'Documents',
      value: dashboardData.totalDocuments,
      change: '+8%',
      changeType: 'positive' as const,
      icon: FileText,
      gradient: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
      description: 'All compliance files'
    },
    {
      label: 'Upcoming Visa Expiries',
      value: dashboardData.expiringVisas.length,
      change: '',
      changeType: 'positive' as const,
      icon: Clock,
      gradient: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
      description: 'Next 90 days'
    }
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="space-y-8 p-8">
            {/* Header skeleton */}
          <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse w-80"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse w-96"></div>
            </div>
              <div className="flex space-x-4">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse w-32"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse w-32"></div>
            </div>
          </div>
          
            {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-3xl animate-pulse"></div>
              ))}
              </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <LoadingTracker />
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 border-4 border-pink-300 dark:border-pink-600 rounded-3xl m-4">
        
        {/* MAGENTA REDESIGN INDICATOR */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-center py-4 px-6 rounded-2xl shadow-xl border-4 border-pink-300 m-6">
          <h2 className="text-2xl font-bold"> CUBS Dashboard - Employee Management System</h2>
          <p className="text-pink-100 mt-1">Automated Visa Monitoring and Document Management</p>
        </div>
        
        <div className="space-y-6 p-6">
          {/* Compact Header */}
        <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4">
                <div className="relative w-12 h-12">
                  <img
                    src="/assets/CUBS_LOGO.png"
                    alt="CUBS Group of Companies"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  CUBS Admin Dashboard
                </h1>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Welcome back! Here&apos;s your organization overview.
                {isConnected && (
                  <span className="ml-2 inline-flex items-center text-xs text-green-600 dark:text-green-400">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                    Live
                  </span>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              <Link href="/admin/approvals">
                <button className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative">
                  <UserCheck className="w-4 h-4 mr-2 inline" />
                  User Approvals
                  {pendingApprovals.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingApprovals.length > 9 ? '9+' : pendingApprovals.length}
                    </span>
                  )}
                </button>
              </Link>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 inline ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowPerformance(!showPerformance)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Monitor className="w-4 h-4 mr-2 inline" />
                {showPerformance ? 'Hide' : 'Show'} Performance
              </button>
            </div>
          </div>

          {/* Pending Approvals Alert */}
          {pendingApprovals.length > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-orange-900 dark:text-orange-100">
                      Pending User Approvals
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-200">
                      {pendingApprovals.length} user{pendingApprovals.length > 1 ? 's' : ''} waiting for approval
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => loadPendingApprovals(true)}
                    variant="outline"
                    size="sm"
                    disabled={isRefreshingApprovals}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshingApprovals ? 'animate-spin' : ''}`} />
                    {isRefreshingApprovals ? 'Refreshing...' : 'Refresh'}
                  </Button>
                  <Link href="/admin/approvals">
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                      Review Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Compact Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
                
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange({ dateRange: e.target.value as any })}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                  <option value="all">All time</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Updated: {timeAgo(lastUpdate)}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Dashboard */}
          {showPerformance && (
            <div className="animate-fade-in">
              <LazyPerformanceDashboard />
            </div>
          )}

          {/* Stats Grid: exactly three cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-2 border-pink-200 dark:border-pink-700 rounded-2xl bg-gradient-to-r from-pink-50/30 to-purple-50/30 dark:from-pink-900/10 dark:to-purple-900/10">
            {statCards.map((stat, index) => (
            <div 
              key={index} 
              className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
            >
                <AnimatedStatCard {...stat} loading={isRefreshing} delay={index * 50} />
            </div>
          ))}
        </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 border-2 border-pink-200 dark:border-pink-700 rounded-2xl bg-gradient-to-r from-purple-50/20 to-indigo-50/20 dark:from-purple-900/5 dark:to-indigo-900/5">
            {/* Employees per company */}
            <EnhancedChartCard title="Employees per Company" subtitle="Active employees grouped by company" loading={isRefreshing}>
              <EnhancedCompanyChart data={dashboardData.companyDistribution} loading={isRefreshing} />
            </EnhancedChartCard>

            {/* Upcoming visa expiries */}
            <div className="relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Visa Expiries</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Next 90 days</p>
                </div>
              </div>
                            <div>
                {dashboardData.expiringVisas.length > 0 ? (
                <div className="space-y-6">
                  {/* Summary chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { label: '≤7d', color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', count: dashboardData.expiringVisas.filter(a => a.daysLeft <= 7).length },
                      { label: '≤15d', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400', count: dashboardData.expiringVisas.filter(a => a.daysLeft > 7 && a.daysLeft <= 15).length },
                      { label: '≤30d', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400', count: dashboardData.expiringVisas.filter(a => a.daysLeft > 15 && a.daysLeft <= 30).length },
                      { label: '≤60d', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400', count: dashboardData.expiringVisas.filter(a => a.daysLeft > 30 && a.daysLeft <= 60).length },
                      { label: '≤90d', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', count: dashboardData.expiringVisas.filter(a => a.daysLeft > 60 && a.daysLeft <= 90).length },
                    ].map((chip, idx) => (
                      <div key={idx} className={cn('rounded-lg px-3 py-2 text-center text-sm font-medium', chip.color)}>
                        {chip.label}: {chip.count}
                      </div>
                    ))}
                  </div>

                  {/* Stacked progress bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    {(() => {
                      const totals = [
                        dashboardData.expiringVisas.filter(a => a.daysLeft <= 7).length,
                        dashboardData.expiringVisas.filter(a => a.daysLeft > 7 && a.daysLeft <= 15).length,
                        dashboardData.expiringVisas.filter(a => a.daysLeft > 15 && a.daysLeft <= 30).length,
                        dashboardData.expiringVisas.filter(a => a.daysLeft > 30 && a.daysLeft <= 60).length,
                        dashboardData.expiringVisas.filter(a => a.daysLeft > 60 && a.daysLeft <= 90).length,
                      ];
                      const total = Math.max(1, totals.reduce((a,b)=>a+b,0));
                      const colors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#22c55e'];
                      return (
                        <div className="flex w-full h-3">
                          {totals.map((v, i) => (
                            <div key={i} style={{ width: `${(v/total)*100}%`, backgroundColor: colors[i] }} className="h-3 transition-all duration-500"></div>
                          ))}
                        </div>
                      );
                    })()} 
                  </div>

                  {/* Top N list */}
                  <div className="space-y-3">
                    {dashboardData.expiringVisas.slice(0, 8).map((alert) => (
                  <EnhancedVisaAlertCard key={alert.employee_id} alert={alert} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">No visas expiring soon</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">All employee visas are up to date</p>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 