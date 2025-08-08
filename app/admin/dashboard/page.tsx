'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  Clock,
  Building2,
  BarChart3,
  Download,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
  Target,
  Zap,
  Filter,
  RefreshCw,
  Settings,
  Monitor,
  Sparkles,
  Globe,
  Shield,
  Award,
  PieChart,
  LineChart,
  BarChart,
  Target as TargetIcon,
  TrendingDown,
  Plus,
  Minus,
  ChevronRight,
  Play,
  Pause
} from 'lucide-react';
import { formatDate, timeAgo } from '@/utils/date';
import { cn } from '@/utils/cn';
import Logo from '@/components/ui/Logo';
import { EmployeeService, DashboardStats, DepartmentDistribution, GrowthTrendData, ExpiringVisa, DashboardFilters } from '@/lib/services/employees';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import PerformanceDashboard from '@/components/admin/PerformanceDashboard';
import toast from 'react-hot-toast';

// Apple-inspired color palette
const colors = {
  primary: 'from-blue-500 to-purple-600',
  secondary: 'from-emerald-500 to-teal-600',
  accent: 'from-orange-500 to-red-500',
  success: 'from-green-500 to-emerald-600',
  warning: 'from-yellow-500 to-orange-500',
  danger: 'from-red-500 to-pink-600',
  neutral: 'from-gray-500 to-slate-600',
  glass: 'backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10'
};

// Enhanced urgency colors with gradients
const urgencyColors = {
  critical: 'from-red-500 to-pink-600',
  high: 'from-orange-500 to-red-500',
  medium: 'from-yellow-500 to-orange-500',
  low: 'from-green-500 to-emerald-600'
};

// Animated Stat Card with Apple-inspired design
function AnimatedStatCard({ label, value, change, changeType, icon: Icon, gradient, description, loading = false, delay = 0 }: any) {
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
}

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <button className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center space-x-1">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
      <div>
      {children}
      </div>
    </div>
  );
}

// Enhanced Department Chart with Apple aesthetics
function EnhancedDepartmentChart({ data, loading }: { data: DepartmentDistribution[], loading: boolean }) {
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);

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

  const gradients = [
    'from-blue-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-500',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600'
  ];

  return (
    <div className="space-y-4">
      {data.map((dept, index) => (
        <div 
          key={index} 
          className="group p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
          onMouseEnter={() => setHoveredDept(dept.name)}
          onMouseLeave={() => setHoveredDept(null)}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ background: `linear-gradient(135deg, ${gradients[index % gradients.length]})` }}
              ></div>
              <span className="font-medium text-gray-900 dark:text-white">{dept.name}</span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900 dark:text-white">{dept.employees}</p>
              <p className="text-xs text-green-600 dark:text-green-400">{dept.growth}</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="h-2 rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${dept.percentage}%`,
                background: `linear-gradient(135deg, ${gradients[index % gradients.length]})`
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{dept.percentage}% of workforce</p>
        </div>
      ))}
    </div>
  );
}

// Enhanced Trend Chart with Apple design
function EnhancedTrendChart({ data, loading }: { data: GrowthTrendData[], loading: boolean }) {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-32"></div>
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
      </div>
    );
  }

  const maxEmployees = Math.max(...data.map(m => m.employees));
  const maxDocuments = Math.max(...data.map(m => m.documents));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Employees</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Documents</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-end justify-between h-32 space-x-2">
        {data.map((month, index) => (
          <div 
            key={index} 
            className="flex-1 flex flex-col items-center space-y-2 group cursor-pointer"
            onMouseEnter={() => setHoveredMonth(month.month)}
            onMouseLeave={() => setHoveredMonth(null)}
          >
            <div className="flex flex-col items-center space-y-1 w-full relative">
              {/* Employees bar */}
              <div 
                className="w-full rounded-t-lg transition-all duration-300 ease-out"
                style={{ 
                  height: `${maxEmployees > 0 ? (month.employees / maxEmployees) * 80 : 0}px`,
                  background: `linear-gradient(180deg, #3b82f6 0%, #6366f1 100%)`
                }}
              ></div>
              
              {/* Documents bar */}
              <div 
                className="w-full rounded-b-lg transition-all duration-300 ease-out"
                style={{ 
                  height: `${maxDocuments > 0 ? (month.documents / maxDocuments) * 40 : 0}px`,
                  background: `linear-gradient(180deg, #10b981 0%, #14b8a6 100%)`
                }}
              ></div>
              
              {/* Hover effect */}
              {hoveredMonth === month.month && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                  <div>E: {month.employees}</div>
                  <div>D: {month.documents}</div>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {month.month}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Enhanced Visa Alert Card with Apple design
function EnhancedVisaAlertCard({ alert }: { alert: ExpiringVisa }) {
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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  
  // Dashboard data state
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalDocuments: 0,
    pendingApprovals: 0,
    visasExpiringSoon: 0,
    departments: 0
  });
  const [departmentData, setDepartmentData] = useState<DepartmentDistribution[]>([]);
  const [growthData, setGrowthData] = useState<GrowthTrendData[]>([]);
  const [visaAlerts, setVisaAlerts] = useState<ExpiringVisa[]>([]);
  
  // Filter state
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: '30d'
  });

  // Real-time updates (throttled inside hook); enable only when page is visible
  const { isConnected, lastUpdate, refresh } = useRealtimeDashboard({
    onDataChange: fetchDashboardData,
    enabled: isAutoRefresh
  });

  async function fetchDashboardData() {
    try {
      setIsRefreshing(true);
      
      // Fetch all dashboard data in parallel
      const [statsData, deptData, growthData, visaData] = await Promise.all([
        EmployeeService.getAdminDashboardStats(filters),
        EmployeeService.getEmployeeDistributionByDepartment(filters),
        EmployeeService.getGrowthTrendData(filters),
        EmployeeService.getExpiringVisasSummary(5)
      ]);

      setStats(statsData);
      setDepartmentData(deptData);
      setGrowthData(growthData);
      setVisaAlerts(visaData);

      console.log('✅ Dashboard data refreshed successfully');
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleManualRefresh = () => {
    fetchDashboardData();
    toast.success('Dashboard refreshed');
  };

  const statCards = [
    {
      label: 'Total Employees',
      value: stats.totalEmployees,
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      description: 'Active workforce across all departments'
    },
    {
      label: 'Active Documents',
      value: stats.totalDocuments,
      change: '+8%',
      changeType: 'positive' as const,
      icon: FileText,
      gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
      description: 'Compliance documents and records'
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals,
      change: '-5%',
      changeType: 'negative' as const,
      icon: Clock,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
      description: 'Requests awaiting review'
    },
    {
      label: 'Departments',
      value: stats.departments,
      change: '+2%',
      changeType: 'positive' as const,
      icon: Building2,
      gradient: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
      description: 'Organizational units'
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="space-y-6 p-6">
          {/* Compact Header */}
        <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Welcome back! Here's your organization overview.
                {isConnected && (
                  <span className="ml-2 inline-flex items-center text-xs text-green-600 dark:text-green-400">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                    Live
                  </span>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
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
              <button 
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isAutoRefresh ? <Pause className="w-4 h-4 mr-2 inline" /> : <Play className="w-4 h-4 mr-2 inline" />}
                {isAutoRefresh ? 'Auto' : 'Manual'}
              </button>
            </div>
          </div>

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
              <PerformanceDashboard />
        </div>
          )}

          {/* Compact Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Compact Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Department Distribution */}
            <EnhancedChartCard title="Department Distribution" subtitle="Employee distribution" loading={isRefreshing}>
              <EnhancedDepartmentChart data={departmentData} loading={isRefreshing} />
            </EnhancedChartCard>

          {/* Growth Trends */}
            <EnhancedChartCard title="Growth Trends" subtitle="Monthly growth data" loading={isRefreshing}>
              <EnhancedTrendChart data={growthData} loading={isRefreshing} />
            </EnhancedChartCard>
        </div>

        {/* Visa Alerts */}
          <EnhancedChartCard title="Visa Expiry Alerts" subtitle="Employees with expiring visas" loading={isRefreshing}>
            <div className="space-y-3">
              {visaAlerts.length > 0 ? (
                visaAlerts.map((alert) => (
                  <EnhancedVisaAlertCard key={alert.employee_id} alert={alert} />
                ))
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
          </EnhancedChartCard>

          {/* Compact Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5" />
                <div>
                  <h3 className="font-semibold">Add Employee</h3>
                  <p className="text-blue-100 text-sm">Register new team member</p>
                </div>
              </div>
          </div>

            <div className="p-4 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5" />
                <div>
                  <h3 className="font-semibold">Upload Documents</h3>
                  <p className="text-green-100 text-sm">Manage compliance files</p>
                </div>
              </div>
          </div>

            <div className="p-4 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-5 h-5" />
                <div>
                  <h3 className="font-semibold">View Reports</h3>
                  <p className="text-purple-100 text-sm">Generate insights</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 