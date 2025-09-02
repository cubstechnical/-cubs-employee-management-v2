'use client';

import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Image from 'next/image';
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
  ShieldX,
  Loader2,
  Globe,
  Award,
  Target
} from 'lucide-react';
import { formatDate, timeAgo } from '@/utils/date';
import { useAuth } from '@/lib/contexts/AuthContext';
import { AuthService } from '@/lib/services/auth';
import { useEmployeeDashboardStats } from '@/lib/hooks/useEmployees';
import toast from 'react-hot-toast';

interface PendingUser {
  id: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  role: string;
  created_at: string;
  approved_by?: string;
}

// Mock data for non-approval stats (will be replaced with real data later)
const departmentStats = [
  { name: 'Engineering', employees: 45, growth: '+15%', color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
  { name: 'Sales', employees: 32, growth: '+8%', color: 'bg-gradient-to-r from-green-500 to-green-600' },
  { name: 'Marketing', employees: 28, growth: '+12%', color: 'bg-gradient-to-r from-purple-500 to-purple-600' },
  { name: 'HR', employees: 15, growth: '+5%', color: 'bg-gradient-to-r from-orange-500 to-orange-600' },
  { name: 'Finance', employees: 12, growth: '+3%', color: 'bg-gradient-to-r from-red-500 to-red-600' },
];

const visaAlerts = [
  { id: 1, name: 'John Smith', visaType: 'H-1B', expiryDate: '2024-02-15', daysLeft: 15 },
  { id: 2, name: 'Lisa Brown', visaType: 'L-1A', expiryDate: '2024-02-20', daysLeft: 20 },
  { id: 3, name: 'Robert Garcia', visaType: 'E-3', expiryDate: '2024-02-25', daysLeft: 25 },
];

function StatCard({ label, value, change, icon: Icon, color, gradient }: any) {
  return (
    <Card className="p-6 bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</p>
          <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {value}
          </div>
          <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">{change}</p>
        </div>
        <div className={`w-16 h-16 ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </Card>
  );
}

function ChartCard({ title, children, className = '', subtitle }: any) {
  return (
    <Card className={`bg-white dark:bg-gray-800 border-0 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          icon={<Download className="w-4 h-4" />}
          className="border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700"
        >
          Export
        </Button>
      </div>
      {children}
    </Card>
  );
}

function ApprovalCard({ approval }: { approval: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 dark:text-green-400';
      case 'rejected': return 'text-red-600 dark:text-red-400';
      case 'pending': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <AlertTriangle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">{approval.employee}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{approval.type}</p>
      </div>
      <div className="text-right">
        <div className={`flex items-center gap-1 ${getStatusColor(approval.status)}`}>
          {getStatusIcon(approval.status)}
          <span className="text-sm font-medium capitalize">{approval.status}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500">{timeAgo(approval.date)}</p>
      </div>
    </div>
  );
}

function VisaAlertCard({ alert }: { alert: any }) {
  const getDaysColor = (days: number) => {
    if (days <= 7) return 'text-red-600 dark:text-red-400';
    if (days <= 14) return 'text-orange-600 dark:text-orange-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">{alert.name}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{alert.visaType}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(alert.expiryDate)}</p>
        <p className={`text-sm font-semibold ${getDaysColor(alert.daysLeft)}`}>
          {alert.daysLeft} days left
        </p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user is main admin (info@cubstechnical.com)
  const isMainAdmin = user?.email === 'info@cubstechnical.com';

  // Use TanStack Query for dashboard stats
  const { 
    data: dashboardStats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useEmployeeDashboardStats();

  // Load pending users data
  const loadPendingUsers = useCallback(async () => {
    if (!isMainAdmin) return;

    try {
      setLoading(true);
      const { users, error } = await AuthService.getPendingApprovals();

      if (error) {
        console.error('Failed to load pending approvals:', error);
        // Don't show error toast for background updates
      } else {
        setPendingUsers(users || []);
      }
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
    } finally {
      setLoading(false);
    }
  }, [isMainAdmin]);

  useEffect(() => {
    if (isMainAdmin) {
      loadPendingUsers();
    } else {
      setLoading(false);
    }

    // Listen for dashboard refresh events from approvals page
    const handleDashboardRefresh = (event: StorageEvent) => {
      if (event.key === 'adminDashboardRefresh' && event.newValue) {
        console.log('📊 Dashboard: Received refresh signal from approvals page');
        loadPendingUsers();
      }
    };

    // Listen for localStorage changes
    window.addEventListener('storage', handleDashboardRefresh);

    // Also listen for custom events (for same-tab updates)
    const handleCustomRefresh = () => {
      console.log('📊 Dashboard: Received custom refresh event');
      loadPendingUsers();
    };

    window.addEventListener('adminDashboardRefresh', handleCustomRefresh);

    return () => {
      window.removeEventListener('storage', handleDashboardRefresh);
      window.removeEventListener('adminDashboardRefresh', handleCustomRefresh);
    };
  }, [isMainAdmin, user, loadPendingUsers]);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Company Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative w-20 h-20">
                <Image
                  src="/assets/CUBS_LOGO.png"
                  alt="CUBS Group of Companies"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  CUBS Dashboard
                </h1>
                <p className="text-xl text-gray-300 mt-2">
                  Group of Companies • UAE • Qatar • Oman • KSA
                </p>
                <p className="text-gray-400 mt-1">
                  Comprehensive overview of your organization's performance and key metrics
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                icon={<Download className="w-4 h-4" />}
                className="border-white/20 text-white hover:bg-white/10 hover:border-white/30"
              >
                Export Report
              </Button>
              <Button 
                icon={<BarChart3 className="w-4 h-4" />}
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 border-0 shadow-lg"
              >
                Generate Report
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Employees */}
          <StatCard
            label="Total Employees"
            value={statsLoading ? "..." : dashboardStats?.totalEmployees?.toLocaleString() || "0"}
            change={statsLoading ? "Loading..." : "Real-time data"}
            icon={Users}
            gradient="bg-gradient-to-r from-blue-500 to-blue-600"
          />

          {/* Active Documents */}
          <StatCard
            label="Active Documents"
            value={statsLoading ? "..." : dashboardStats?.totalDocuments?.toLocaleString() || "0"}
            change={statsLoading ? "Loading..." : "Real-time data"}
            icon={FileText}
            gradient="bg-gradient-to-r from-green-500 to-green-600"
          />

          {/* Pending Approvals - Only show for main admin with real data */}
          {isMainAdmin && (
            <StatCard
              label="Pending Approvals"
              value={loading ? "..." : pendingUsers.length.toString()}
              change={loading ? "Loading..." : `Updated ${new Date().toLocaleTimeString()}`}
              icon={Clock}
              gradient="bg-gradient-to-r from-orange-500 to-orange-600"
            />
          )}

          {/* Departments */}
          <StatCard
            label="Departments"
            value={statsLoading ? "..." : dashboardStats?.departments?.toString() || "0"}
            change={statsLoading ? "Loading..." : "Real-time data"}
            icon={Building2}
            gradient="bg-gradient-to-r from-purple-500 to-purple-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Department Overview */}
          <div className="lg:col-span-2">
            <ChartCard 
              title="Department Overview" 
              subtitle="Employee distribution and growth across departments"
            >
              <div className="space-y-4">
                {departmentStats.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full ${dept.color} shadow-lg`}></div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-lg">{dept.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{dept.employees} employees</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{dept.growth}</p>
                      <div className="w-32 h-3 bg-gray-200 dark:bg-gray-600 rounded-full mt-2">
                        <div 
                          className={`h-3 rounded-full ${dept.color} shadow-lg`}
                          style={{ width: `${(dept.employees / 50) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          {/* Recent Approvals */}
          <div>
            {isMainAdmin ? (
              <ChartCard 
                title="Recent Approvals" 
                subtitle="Pending user registrations requiring approval"
              >
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-3 animate-spin" />
                      <p className="text-gray-600 dark:text-gray-400">Loading approvals...</p>
                    </div>
                  ) : pendingUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400 font-medium">No pending approvals</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">All users are approved</p>
                    </div>
                  ) : (
                    pendingUsers.slice(0, 4).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">New User Registration</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">Pending</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">{timeAgo(user.created_at)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ChartCard>
            ) : (
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
                <div className="text-center py-10">
                  <ShieldX className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Approval Access Restricted
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Only the main administrator can view and manage approvals.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Contact info@cubstechnical.com for access.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Visa Alerts */}
          <ChartCard 
            title="Visa Expiry Alerts" 
            subtitle="Critical visa renewals requiring immediate attention"
          >
            <div className="space-y-3">
              {visaAlerts.map((alert) => (
                <VisaAlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </ChartCard>

          {/* Quick Actions */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Access frequently used features</p>
              </div>
            </div>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                icon={<Users className="w-4 h-4" />} 
                className="w-full justify-start border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700"
              >
                Manage Employees
              </Button>
              <Button 
                variant="outline" 
                icon={<FileText className="w-4 h-4" />} 
                className="w-full justify-start border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700"
              >
                Review Documents
              </Button>
              {isMainAdmin ? (
                <Button 
                  variant="outline" 
                  icon={<CheckCircle className="w-4 h-4" />} 
                  className="w-full justify-start border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700"
                >
                  Process Approvals
                </Button>
              ) : (
                <Button
                  variant="outline"
                  icon={<ShieldX className="w-4 h-4" />}
                  className="w-full justify-start border-gray-200 opacity-50 cursor-not-allowed dark:border-gray-600"
                  disabled
                >
                  Process Approvals (Restricted)
                </Button>
              )}
              <Button 
                variant="outline" 
                icon={<Building2 className="w-4 h-4" />} 
                className="w-full justify-start border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700"
              >
                Department Settings
              </Button>
            </div>
          </Card>
        </div>

        {/* Company Footer */}
        <div className="text-center py-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            © 2024 CUBS Group of Companies. All rights reserved.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Empowering businesses across the Middle East
          </p>
        </div>
      </div>
    </Layout>
  );
} 

