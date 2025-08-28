'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
        "relative overflow-hidden rounded-3xl p-8 transition-all duration-700 ease-out transform cursor-pointer group",
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95",
        "hover:scale-105 hover:shadow-2xl",
        colors.glass
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: `linear-gradient(135deg, ${gradient})`,
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)'
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full blur-2xl transform -translate-x-12 translate-y-12"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <p className="text-sm font-medium text-white/80 mb-2">{label}</p>
            <p className="text-4xl font-bold text-white mb-3 tracking-tight">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {change && (
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "flex items-center space-x-1 text-sm font-medium px-3 py-1 rounded-full",
                  changeType === 'positive' 
                    ? "bg-green-500/20 text-green-100" 
                    : "bg-red-500/20 text-red-100"
                )}>
                  {changeType === 'positive' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span>{change}</span>
                </div>
                <span className="text-xs text-white/60">from last month</span>
              </div>
            )}
            <p className="text-sm text-white/70 mt-3">{description}</p>
          </div>
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-12",
            "bg-white/20 backdrop-blur-sm"
          )}>
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300",
        isHovered && "opacity-100"
      )}></div>
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
        "rounded-3xl p-8 transition-all duration-700 ease-out transform",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        "hover:scale-[1.02] hover:shadow-2xl",
        colors.glass
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
          {subtitle && (
            <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
        <button className="rounded-full px-6 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white transition-all duration-300 text-sm font-medium">
          <Download className="w-4 h-4 mr-2 inline" />
          Export
        </button>
      </div>
      <div className={cn("transition-transform duration-300", isHovered && "scale-105")}>
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
    <div className="space-y-6">
      {data.map((dept, index) => (
        <div 
          key={index} 
          className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-500 hover:scale-105 hover:shadow-xl"
          style={{
            background: `linear-gradient(135deg, ${gradients[index % gradients.length]})`,
            transform: hoveredDept === dept.name ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)'
          }}
          onMouseEnter={() => setHoveredDept(dept.name)}
          onMouseLeave={() => setHoveredDept(null)}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 rounded-full bg-white/30 backdrop-blur-sm"></div>
                <span className="font-semibold text-white text-lg">{dept.name}</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-white text-xl">{dept.employees}</p>
                <p className="text-green-200 text-sm font-medium">{dept.growth}</p>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm overflow-hidden">
              <div 
                className="h-3 rounded-full transition-all duration-1000 ease-out bg-white/80 backdrop-blur-sm"
                style={{ width: `${dept.percentage}%` }}
              ></div>
            </div>
            <p className="text-white/80 text-sm mt-2">{dept.percentage}% of total workforce</p>
          </div>
          
          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
      
      <div className="flex items-end justify-between h-48 space-x-3">
        {data.map((month, index) => (
          <div 
            key={index} 
            className="flex-1 flex flex-col items-center space-y-3 group cursor-pointer"
            onMouseEnter={() => setHoveredMonth(month.month)}
            onMouseLeave={() => setHoveredMonth(null)}
          >
            <div className="flex flex-col items-center space-y-2 w-full relative">
              {/* Employees bar */}
              <div 
                className="w-full rounded-t-2xl transition-all duration-500 ease-out hover:scale-105"
                style={{ 
                  height: `${maxEmployees > 0 ? (month.employees / maxEmployees) * 120 : 0}px`,
                  background: `linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%)`
                }}
              ></div>
              
              {/* Documents bar */}
              <div 
                className="w-full rounded-b-2xl transition-all duration-500 ease-out hover:scale-105"
                style={{ 
                  height: `${maxDocuments > 0 ? (month.documents / maxDocuments) * 80 : 0}px`,
                  background: `linear-gradient(180deg, #10b981 0%, #14b8a6 100%)`
                }}
              ></div>
              
              {/* Hover effect */}
              {hoveredMonth === month.month && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-10">
                  <div>Employees: {month.employees}</div>
                  <div>Documents: {month.documents}</div>
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-300">
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
      className="relative overflow-hidden rounded-2xl p-6 transition-all duration-500 hover:scale-105 hover:shadow-xl cursor-pointer group"
      style={{
        background: `linear-gradient(135deg, ${urgencyColors[alert.urgency]})`
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl transform translate-x-12 -translate-y-12"></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              {getUrgencyIcon(alert.urgency)}
            </div>
            <div>
              <p className="font-bold text-white text-lg group-hover:text-white/90 transition-colors">
                {alert.name}
              </p>
              <p className="text-white/80 text-sm">{alert.visa_type}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-bold text-lg px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
              {alert.daysLeft} days left
            </p>
            <p className="text-white/70 text-sm mt-2">{formatDate(alert.visa_expiry_date)}</p>
          </div>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-300",
        isHovered && "opacity-100"
      )}></div>
    </div>
  );
}

export default function EnhancedDashboard() {
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

  const fetchDashboardData = useCallback(async () => {
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
  }, [filters]);

  // Real-time updates (throttled inside hook)
  const { isConnected, lastUpdate, refresh } = useRealtimeDashboard({
    onDataChange: fetchDashboardData,
    enabled: isAutoRefresh
  });

  useEffect(() => {
    fetchDashboardData();
  }, [filters, fetchDashboardData]);

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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="space-y-8 p-8">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Logo size="lg" showText={false} />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Welcome back! Here&apos;s what&apos;s happening with your organization.
                {isConnected && (
                  <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Live updates enabled
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="rounded-2xl px-6 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white transition-all duration-300"
            >
              <RefreshCw className={`w-5 h-5 mr-2 inline ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={() => setShowPerformance(!showPerformance)}
              className="rounded-2xl px-6 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-600 hover:text-white transition-all duration-300"
            >
              <Monitor className="w-5 h-5 mr-2 inline" />
              {showPerformance ? 'Hide' : 'Show'} Performance
            </button>
            <button 
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className="rounded-2xl px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl text-white"
            >
              {isAutoRefresh ? <Pause className="w-5 h-5 mr-2 inline" /> : <Play className="w-5 h-5 mr-2 inline" />}
              {isAutoRefresh ? 'Auto' : 'Manual'}
            </button>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className={cn("rounded-3xl p-6", colors.glass)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Filter className="w-6 h-6 text-gray-500" />
              <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">Filters</span>
              
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange({ dateRange: e.target.value as any })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
                <option value="all">All time</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {timeAgo(lastUpdate)}
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Dashboard */}
        {showPerformance && (
          <div className="animate-fade-in">
            <PerformanceDashboard />
          </div>
        )}

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div 
              key={index} 
              className="animate-fade-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <AnimatedStatCard {...stat} loading={isRefreshing} delay={index * 100} />
            </div>
          ))}
        </div>

        {/* Enhanced Charts and Data */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Distribution */}
          <div className="animate-fade-in" style={{ animationDelay: '600ms' }}>
            <EnhancedChartCard title="Department Distribution" subtitle="Employee distribution across departments" loading={isRefreshing}>
              <EnhancedDepartmentChart data={departmentData} loading={isRefreshing} />
            </EnhancedChartCard>
          </div>

          {/* Growth Trends */}
          <div className="animate-fade-in" style={{ animationDelay: '750ms' }}>
            <EnhancedChartCard title="Growth Trends" subtitle="Monthly employee and document growth" loading={isRefreshing}>
              <EnhancedTrendChart data={growthData} loading={isRefreshing} />
            </EnhancedChartCard>
          </div>

          {/* Recent Approvals */}
          <div className="animate-fade-in" style={{ animationDelay: '900ms' }}>
            <EnhancedChartCard title="Recent Approvals" subtitle="Latest approval requests" loading={isRefreshing}>
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 text-white" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Approvals system coming soon</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Advanced approval workflows in development</p>
              </div>
            </EnhancedChartCard>
          </div>
        </div>

        {/* Enhanced Visa Alerts */}
        <EnhancedChartCard title="Visa Expiry Alerts" subtitle="Employees with expiring visas" loading={isRefreshing}>
          <div className="space-y-4">
            {visaAlerts.length > 0 ? (
              visaAlerts.map((alert) => (
                <EnhancedVisaAlertCard key={alert.employee_id} alert={alert} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">No visas expiring soon</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">All employee visas are up to date</p>
              </div>
            )}
          </div>
        </EnhancedChartCard>

        {/* Enhanced Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="animate-fade-in" style={{ animationDelay: '1050ms' }}>
            <div className="group relative overflow-hidden rounded-3xl p-8 cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}>
              <div className="relative z-10">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xl">Add Employee</h3>
                    <p className="text-white/80 text-sm">Register new team member</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '1200ms' }}>
            <div className="group relative overflow-hidden rounded-3xl p-8 cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl" style={{ background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)' }}>
              <div className="relative z-10">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xl">Upload Documents</h3>
                    <p className="text-white/80 text-sm">Manage compliance files</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '1350ms' }}>
            <div className="group relative overflow-hidden rounded-3xl p-8 cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)' }}>
              <div className="relative z-10">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xl">View Reports</h3>
                    <p className="text-white/80 text-sm">Generate insights</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 