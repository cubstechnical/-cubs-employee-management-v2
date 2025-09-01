'use client';

import { useState, useEffect, useCallback } from 'react';
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
  ShieldX,
  Loader2
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
  { name: 'Engineering', employees: 45, growth: '+15%', color: 'bg-blue-500' },
  { name: 'Sales', employees: 32, growth: '+8%', color: 'bg-green-500' },
  { name: 'Marketing', employees: 28, growth: '+12%', color: 'bg-purple-500' },
  { name: 'HR', employees: 15, growth: '+5%', color: 'bg-orange-500' },
  { name: 'Finance', employees: 12, growth: '+3%', color: 'bg-red-500' },
];

const visaAlerts = [
  { id: 1, name: 'John Smith', visaType: 'H-1B', expiryDate: '2024-02-15', daysLeft: 15 },
  { id: 2, name: 'Lisa Brown', visaType: 'L-1A', expiryDate: '2024-02-20', daysLeft: 20 },
  { id: 3, name: 'Robert Garcia', visaType: 'E-3', expiryDate: '2024-02-25', daysLeft: 25 },
];

function StatCard({ label, value, change, icon: Icon, color }: any) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</div>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">{change} from last month</p>
        </div>
        <div className={`w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}

function ChartCard({ title, children, className = '' }: any) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>
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
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{approval.employee}</p>
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
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{alert.name}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{alert.visaType}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(alert.expiryDate)}</p>
        <p className={`text-sm font-medium ${getDaysColor(alert.daysLeft)}`}>
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Overview of your organization&apos;s performance and key metrics.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" icon={<Download className="w-4 h-4" />}>
              Export Report
            </Button>
            <Button icon={<BarChart3 className="w-4 h-4" />}>
              Generate Report
            </Button>
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
            color="text-blue-600 dark:text-blue-400"
          />

          {/* Active Documents */}
          <StatCard
            label="Active Documents"
            value={statsLoading ? "..." : dashboardStats?.totalDocuments?.toLocaleString() || "0"}
            change={statsLoading ? "Loading..." : "Real-time data"}
            icon={FileText}
            color="text-green-600 dark:text-green-400"
          />

          {/* Pending Approvals - Only show for main admin with real data */}
          {isMainAdmin && (
            <StatCard
              label="Pending Approvals"
              value={loading ? "..." : pendingUsers.length.toString()}
              change={loading ? "Loading..." : `Updated ${new Date().toLocaleTimeString()}`}
              icon={Clock}
              color="text-orange-600 dark:text-orange-400"
            />
          )}

          {/* Departments */}
          <StatCard
            label="Departments"
            value={statsLoading ? "..." : dashboardStats?.departments?.toString() || "0"}
            change={statsLoading ? "Loading..." : "Real-time data"}
            icon={Building2}
            color="text-purple-600 dark:text-purple-400"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Overview */}
          <div className="lg:col-span-2">
            <ChartCard title="Department Overview">
              <div className="space-y-4">
                {departmentStats.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${dept.color}`}></div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{dept.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{dept.employees} employees</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">{dept.growth}</p>
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full mt-1">
                        <div 
                          className={`h-2 rounded-full ${dept.color}`}
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
              <ChartCard title="Recent Approvals">
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-6">
                      <p className="text-gray-600 dark:text-gray-400">Loading approvals...</p>
                    </div>
                  ) : pendingUsers.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">No pending approvals</p>
                    </div>
                  ) : (
                    pendingUsers.slice(0, 4).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
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
              <Card>
                <div className="text-center py-8">
                  <ShieldX className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visa Alerts */}
          <ChartCard title="Visa Expiry Alerts">
            <div className="space-y-3">
              {visaAlerts.map((alert) => (
                <VisaAlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </ChartCard>

          {/* Quick Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <Button variant="outline" icon={<Users className="w-4 h-4" />} className="w-full justify-start">
                Manage Employees
              </Button>
              <Button variant="outline" icon={<FileText className="w-4 h-4" />} className="w-full justify-start">
                Review Documents
              </Button>
              {isMainAdmin ? (
                <Button variant="outline" icon={<CheckCircle className="w-4 h-4" />} className="w-full justify-start">
                  Process Approvals
                </Button>
              ) : (
                <Button
                  variant="outline"
                  icon={<ShieldX className="w-4 h-4" />}
                  className="w-full justify-start opacity-50 cursor-not-allowed"
                  disabled
                >
                  Process Approvals (Restricted)
                </Button>
              )}
              <Button variant="outline" icon={<Building2 className="w-4 h-4" />} className="w-full justify-start">
                Department Settings
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 

