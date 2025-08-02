'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  Users, 
  FileText, 
  Bell, 
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react';
import { EmployeeService } from '@/lib/services/employees';
import { Employee } from '@/lib/supabase/client';
import { formatDate } from '@/utils/date';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  recentDocuments: number;
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    recentDocuments: 0,
  });
  const [recentEmployees, setRecentEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch employees for stats
        const employeesData = await EmployeeService.getEmployees({
          page: 1,
          pageSize: 1000
        });
        
        // Calculate dashboard stats from employee data
        const totalEmployees = employeesData.total;
        const activeEmployees = employeesData.employees.filter(emp => emp.is_active).length;
        const recentDocuments = Math.floor(Math.random() * 50) + 10; // Mock data
        
        setStats({
          totalEmployees,
          activeEmployees,
          recentDocuments
        });
        
        // Set recent employees (first 5)
        setRecentEmployees(employeesData.employees.slice(0, 5));
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, color, trend }: { 
    title: string; 
    value: number; 
    icon: React.ReactNode; 
    color: string;
    trend?: string;
  }) => (
    <Card className={color}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <p className="text-xs text-green-600 dark:text-green-400">{trend}</p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50">
          {icon}
        </div>
      </div>
    </Card>
  );

  const EmployeeCard = ({ employee }: { employee: Employee }) => (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {employee.name || 'Unknown Employee'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{employee.trade || 'No Trade'}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {employee.created_at ? formatDate(employee.created_at) : 'Unknown Date'}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening with your team.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees}
            icon={<Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
            color="bg-blue-100 dark:bg-blue-900/20"
            trend="+12% this month"
          />
          <StatCard
            title="Active Employees"
            value={stats.activeEmployees}
            icon={<CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />}
            color="bg-green-100 dark:bg-green-900/20"
          />

          <StatCard
            title="Recent Documents"
            value={stats.recentDocuments}
            icon={<FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
            color="bg-purple-100 dark:bg-purple-900/20"
          />
        </div>

        {/* Recent Employees */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Employees</h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="space-y-3">
            {recentEmployees.length > 0 ? (
              recentEmployees.map(employee => (
                <EmployeeCard key={employee.employee_id} employee={employee} />
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No recent employees</p>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-16 flex-col gap-2">
              <Users className="w-6 h-6" />
              <span>Add Employee</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-2">
              <FileText className="w-6 h-6" />
              <span>Upload Document</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-2">
              <Bell className="w-6 h-6" />
              <span>Send Notifications</span>
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
} 

