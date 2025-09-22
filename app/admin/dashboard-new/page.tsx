'use client';

import { useState, useEffect } from 'react';
// Layout is now handled by the root layout
import { EmployeeMetrics } from '@/components/dashboard/EmployeeMetrics';
import EmployeeGrowthChart from '@/components/dashboard/EmployeeGrowthChart';
import VisaStatisticsChart from '@/components/dashboard/VisaStatisticsChart';
import RecentEmployeeActivities from '@/components/dashboard/RecentEmployeeActivities';

export default function ModernDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      totalEmployees: 1247,
      totalDocuments: 3891,
      employeeGrowth: 12.5,
      documentGrowth: 8.2,
      activeEmployees: 1150,
      inactiveEmployees: 97,
      visaExpiringSoon: 23,
      visaExpired: 5,
      visaValid: 1219,
      totalCompanies: 9,
    },
    growthData: {
      companies: ['CUBS', 'CUBS CONTRACTING', 'AL MACEN', 'RUKIN AL ASHBAL', 'GOLDEN CUBS', 'FLUID ENGINEERING', 'AL HANA TOURS & TRAVELS', 'AL ASHBAL AJMAN', 'ASHBAL AL KHALEEJ'],
      employees: [450, 320, 280, 150, 120, 80, 60, 40, 30],
    },
    visaData: {
      categories: ['H-1B', 'L-1A', 'L-1B', 'E-3', 'TN', 'O-1'],
      valid: [450, 320, 280, 150, 120, 80],
      expiring: [25, 18, 15, 8, 6, 4],
      expired: [12, 8, 6, 3, 2, 1],
      processing: [35, 25, 20, 12, 8, 5],
    },
  });

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Employee Management Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Overview of your employee data and system activities
            </p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        {/* Metrics Cards */}
        <EmployeeMetrics 
          data={dashboardData.metrics} 
          loading={loading} 
        />

        {/* Charts Row */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-8">
            <EmployeeGrowthChart 
              data={dashboardData.growthData} 
              loading={loading} 
            />
          </div>
          <div className="col-span-12 xl:col-span-4">
            <RecentEmployeeActivities 
              loading={loading} 
            />
          </div>
        </div>

        {/* Visa Statistics */}
        <VisaStatisticsChart 
          data={dashboardData.visaData} 
          loading={loading} 
        />
      </div>
  );
}








