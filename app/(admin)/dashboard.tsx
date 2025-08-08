'use client';

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
  Eye
} from 'lucide-react';
import { formatDate, timeAgo } from '@/utils/date';

// Mock data
const stats = [
  { label: 'Total Employees', value: '1,247', change: '+12%', icon: Users, color: 'text-blue-600 dark:text-blue-400' },
  { label: 'Active Documents', value: '3,891', change: '+8%', icon: FileText, color: 'text-green-600 dark:text-green-400' },
  { label: 'Pending Approvals', value: '23', change: '-5%', icon: Clock, color: 'text-orange-600 dark:text-orange-400' },
  { label: 'Departments', value: '12', change: '+2%', icon: Building2, color: 'text-purple-600 dark:text-purple-400' },
];

const departmentStats = [
  { name: 'Engineering', employees: 45, growth: '+15%', color: 'bg-blue-500' },
  { name: 'Sales', employees: 32, growth: '+8%', color: 'bg-green-500' },
  { name: 'Marketing', employees: 28, growth: '+12%', color: 'bg-purple-500' },
  { name: 'HR', employees: 15, growth: '+5%', color: 'bg-orange-500' },
  { name: 'Finance', employees: 12, growth: '+3%', color: 'bg-red-500' },
];

const recentApprovals = [
  { id: 1, employee: 'Sarah Johnson', type: 'Visa Extension', status: 'pending', date: '2024-01-15' },
  { id: 2, employee: 'Michael Chen', type: 'Document Upload', status: 'approved', date: '2024-01-14' },
  { id: 3, employee: 'Emily Davis', type: 'New Employee', status: 'pending', date: '2024-01-13' },
  { id: 4, employee: 'David Wilson', type: 'Department Transfer', status: 'rejected', date: '2024-01-12' },
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
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Overview of your organization's performance and key metrics.
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
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
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
            <ChartCard title="Recent Approvals">
              <div className="space-y-3">
                {recentApprovals.map((approval) => (
                  <ApprovalCard key={approval.id} approval={approval} />
                ))}
              </div>
            </ChartCard>
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
              <Button variant="outline" icon={<CheckCircle className="w-4 h-4" />} className="w-full justify-start">
                Process Approvals
              </Button>
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

