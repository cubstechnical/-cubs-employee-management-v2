'use client';

import { useState, useEffect } from 'react';
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
  Zap
} from 'lucide-react';
import { formatDate, timeAgo } from '@/utils/date';
import { cn } from '@/utils/cn';
import Logo from '@/components/ui/Logo';

// Enhanced mock data with more analytics
const stats = [
  { 
    label: 'Total Employees', 
    value: '1,247', 
    change: '+12%', 
    changeType: 'positive',
    icon: Users, 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    description: 'Active workforce'
  },
  { 
    label: 'Active Documents', 
    value: '3,891', 
    change: '+8%', 
    changeType: 'positive',
    icon: FileText, 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    description: 'Compliance documents'
  },
  { 
    label: 'Pending Approvals', 
    value: '23', 
    change: '-5%', 
    changeType: 'negative',
    icon: Clock, 
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    description: 'Awaiting review'
  },
  { 
    label: 'Departments', 
    value: '12', 
    change: '+2%', 
    changeType: 'positive',
    icon: Building2, 
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    description: 'Organizational units'
  },
];

// Enhanced department data with percentages for charts
const departmentData = [
  { name: 'Engineering', employees: 45, percentage: 36, growth: '+15%', color: 'bg-blue-500', bgLight: 'bg-blue-50 dark:bg-blue-900/20' },
  { name: 'Sales', employees: 32, percentage: 26, growth: '+8%', color: 'bg-green-500', bgLight: 'bg-green-50 dark:bg-green-900/20' },
  { name: 'Marketing', employees: 28, percentage: 22, growth: '+12%', color: 'bg-purple-500', bgLight: 'bg-purple-50 dark:bg-purple-900/20' },
  { name: 'HR', employees: 15, percentage: 12, growth: '+5%', color: 'bg-orange-500', bgLight: 'bg-orange-50 dark:bg-orange-900/20' },
  { name: 'Finance', employees: 12, percentage: 10, growth: '+3%', color: 'bg-red-500', bgLight: 'bg-red-50 dark:bg-red-900/20' },
];

// Monthly growth data for trend chart
const monthlyGrowth = [
  { month: 'Jan', employees: 1200, documents: 3500, approvals: 45 },
  { month: 'Feb', employees: 1220, documents: 3600, approvals: 42 },
  { month: 'Mar', employees: 1240, documents: 3700, approvals: 38 },
  { month: 'Apr', employees: 1235, documents: 3650, approvals: 40 },
  { month: 'May', employees: 1247, documents: 3891, approvals: 23 },
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

function StatCard({ label, value, change, changeType, icon: Icon, color, bgColor, description }: any) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <Card className={cn(
      "p-4 transition-all duration-500 ease-out transform",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      "hover:shadow-lg hover:scale-[1.02] cursor-pointer group"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
          <div className="flex items-center space-x-2">
            <div className={cn(
              "flex items-center space-x-1 text-sm font-medium",
              changeType === 'positive' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {changeType === 'positive' ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span>{change}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">from last month</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        </div>
        <div className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
          bgColor
        )}>
          <Icon className={cn("w-7 h-7", color)} />
        </div>
      </div>
    </Card>
  );
}

function ChartCard({ title, children, className = '', subtitle }: any) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <Card className={cn(
      "transition-all duration-700 ease-out transform",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <Button variant="outline" size="sm" className="hover:bg-gray-50 dark:hover:bg-gray-800">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>
      {children}
    </Card>
  );
}

function DepartmentChart() {
  return (
    <div className="space-y-4">
      {departmentData.map((dept, index) => (
        <div key={index} className="group hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className={cn("w-4 h-4 rounded-full", dept.color)}></div>
              <span className="font-medium text-gray-900 dark:text-white">{dept.name}</span>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900 dark:text-white">{dept.employees}</p>
              <p className="text-sm text-green-600 dark:text-green-400">{dept.growth}</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={cn("h-2 rounded-full transition-all duration-500 ease-out", dept.color)}
              style={{ width: `${dept.percentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{dept.percentage}% of total workforce</p>
        </div>
      ))}
    </div>
  );
}

function TrendChart() {
  const maxEmployees = Math.max(...monthlyGrowth.map(m => m.employees));
  const maxDocuments = Math.max(...monthlyGrowth.map(m => m.documents));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Employees</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Documents</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-end justify-between h-32 space-x-2">
        {monthlyGrowth.map((month, index) => (
          <div key={index} className="flex-1 flex flex-col items-center space-y-2">
            <div className="flex flex-col items-center space-y-1 w-full">
              <div 
                className="w-full bg-blue-500 rounded-t transition-all duration-500 ease-out hover:bg-blue-600"
                style={{ height: `${(month.employees / maxEmployees) * 80}px` }}
              ></div>
              <div 
                className="w-full bg-green-500 rounded-b transition-all duration-500 ease-out hover:bg-green-600"
                style={{ height: `${(month.documents / maxDocuments) * 40}px` }}
              ></div>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">{month.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApprovalCard({ approval }: { approval: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'rejected': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'pending': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
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
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group">
      <div className="flex items-center space-x-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110",
          getStatusColor(approval.status)
        )}>
          {getStatusIcon(approval.status)}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {approval.employee}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{approval.type}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn(
          "text-sm font-medium px-2 py-1 rounded-full transition-all duration-200",
          getStatusColor(approval.status)
        )}>
          {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(approval.date)}</p>
      </div>
    </div>
  );
}

function VisaAlertCard({ alert }: { alert: any }) {
  const getDaysColor = (days: number) => {
    if (days <= 7) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    if (days <= 30) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
    return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
  };

  const getUrgencyIcon = (days: number) => {
    if (days <= 7) return <AlertTriangle className="w-4 h-4" />;
    if (days <= 30) return <Clock className="w-4 h-4" />;
    return <Calendar className="w-4 h-4" />;
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group">
      <div className="flex items-center space-x-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110",
          getDaysColor(alert.daysLeft)
        )}>
          {getUrgencyIcon(alert.daysLeft)}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {alert.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{alert.visaType}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn(
          "text-sm font-medium px-2 py-1 rounded-full transition-all duration-200",
          getDaysColor(alert.daysLeft)
        )}>
          {alert.daysLeft} days left
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(alert.expiryDate)}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-64"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-96"></div>
            </div>
            <div className="flex space-x-3">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Logo size="md" showText={false} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back! Here's what's happening with your organization.
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button className="hover:shadow-lg transition-all duration-200">
              <Eye className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="animate-fade-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <StatCard {...stat} />
            </div>
          ))}
        </div>

        {/* Charts and Data */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Department Distribution */}
          <div className="animate-fade-in" style={{ animationDelay: '600ms' }}>
            <ChartCard title="Department Distribution" subtitle="Employee distribution across departments">
              <DepartmentChart />
            </ChartCard>
          </div>

          {/* Growth Trends */}
          <div className="animate-fade-in" style={{ animationDelay: '750ms' }}>
            <ChartCard title="Growth Trends" subtitle="Monthly employee and document growth">
              <TrendChart />
            </ChartCard>
          </div>

          {/* Recent Approvals */}
          <div className="animate-fade-in" style={{ animationDelay: '900ms' }}>
            <ChartCard title="Recent Approvals" subtitle="Latest approval requests">
              <div className="space-y-2">
                {recentApprovals.map((approval) => (
                  <ApprovalCard key={approval.id} approval={approval} />
                ))}
              </div>
            </ChartCard>
          </div>
        </div>

        {/* Visa Alerts */}
        <ChartCard title="Visa Expiry Alerts" subtitle="Employees with expiring visas" className="col-span-full">
          <div className="space-y-2">
            {visaAlerts.map((alert) => (
              <VisaAlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </ChartCard>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="animate-fade-in" style={{ animationDelay: '1050ms' }}>
            <Card className="p-4 hover:shadow-lg transition-all duration-300 ease-in-out cursor-pointer group hover:scale-[1.02]">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Add Employee</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Register new team member</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '1200ms' }}>
            <Card className="p-4 hover:shadow-lg transition-all duration-300 ease-in-out cursor-pointer group hover:scale-[1.02]">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Upload Documents</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage compliance files</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '1350ms' }}>
            <Card className="p-4 hover:shadow-lg transition-all duration-300 ease-in-out cursor-pointer group hover:scale-[1.02]">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">View Reports</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Generate insights</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
} 