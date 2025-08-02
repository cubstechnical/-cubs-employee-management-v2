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
  Plus,
  Eye,
  Download
} from 'lucide-react';
import { formatDate, timeAgo } from '@/utils/date';

// Mock data
const stats = [
  { label: 'Total Employees', value: '1,247', change: '+12%', icon: Users, color: 'text-blue-600 dark:text-blue-400' },
  { label: 'Active Documents', value: '3,891', change: '+8%', icon: FileText, color: 'text-green-600 dark:text-green-400' },
  { label: 'Visa Expiring Soon', value: '23', change: '-5%', icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400' },
  { label: 'This Month', value: '156', change: '+15%', icon: Calendar, color: 'text-purple-600 dark:text-purple-400' },
];

const recentEmployees = [
  { id: 1, name: 'Sarah Johnson', position: 'Software Engineer', department: 'Engineering', date: '2024-01-15', avatar: 'SJ' },
  { id: 2, name: 'Michael Chen', position: 'Product Manager', department: 'Product', date: '2024-01-14', avatar: 'MC' },
  { id: 3, name: 'Emily Davis', position: 'UX Designer', department: 'Design', date: '2024-01-13', avatar: 'ED' },
  { id: 4, name: 'David Wilson', position: 'Data Analyst', department: 'Analytics', date: '2024-01-12', avatar: 'DW' },
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
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">{change} from last month</p>
        </div>
        <div className={`w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}

function EmployeeCard({ employee }: { employee: any }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-apple dark:hover:shadow-apple-dark transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
          <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">{employee.avatar}</span>
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{employee.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{employee.position}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-600 dark:text-gray-400">{employee.department}</p>
        <p className="text-xs text-gray-500 dark:text-gray-500">{timeAgo(employee.date)}</p>
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

export default function HomeDashboard() {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back! Here's what's happening with your team.
            </p>
          </div>
          <Button icon={<Plus className="w-4 h-4" />}>
            Add Employee
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Employees */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Employees</h2>
              <Button variant="outline" size="sm" icon={<Eye className="w-4 h-4" />}>
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {recentEmployees.map((employee) => (
                <EmployeeCard key={employee.id} employee={employee} />
              ))}
            </div>
          </Card>

          {/* Visa Alerts */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Visa Expiry Alerts</h2>
              <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>
                Export
              </Button>
            </div>
            <div className="space-y-3">
              {visaAlerts.map((alert) => (
                <VisaAlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" icon={<Users className="w-4 h-4" />} className="justify-start">
              Manage Employees
            </Button>
            <Button variant="outline" icon={<FileText className="w-4 h-4" />} className="justify-start">
              Upload Documents
            </Button>
            <Button variant="outline" icon={<Calendar className="w-4 h-4" />} className="justify-start">
              Schedule Meeting
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
} 

