'use client';

import { useState, useEffect } from 'react';
import { EmployeeMetrics } from '@/components/dashboard/EmployeeMetrics';
import EmployeeGrowthChart from '@/components/dashboard/EmployeeGrowthChart';
import VisaExpiryTrendChart from '@/components/dashboard/VisaExpiryTrendChart';
import VisaComplianceScore from '@/components/dashboard/VisaComplianceScore';
import VisaStatisticsChart from '@/components/dashboard/VisaStatisticsChart';
import RecentEmployeeActivities from '@/components/dashboard/RecentEmployeeActivities';
import CUBSDashboardHeader from '@/components/dashboard/CUBSDashboardHeader';

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
    visaTrendData: {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      expiring: [15, 18, 22, 19, 25, 23],
      expired: [3, 2, 4, 1, 3, 5],
      renewed: [12, 15, 18, 20, 22, 25],
    },
    visaData: {
      categories: ['H-1B', 'L-1A', 'L-1B', 'E-3', 'TN', 'O-1'],
      valid: [450, 320, 280, 150, 120, 80],
      expiring: [25, 18, 15, 8, 6, 4],
      expired: [12, 8, 6, 3, 2, 1],
      processing: [35, 25, 20, 12, 8, 5],
    },
    complianceScore: 87,
  });

  useEffect(() => {
    // Simulate data loading with animation
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6">
        {/* CUBS Dashboard Header */}
        <CUBSDashboardHeader />
        
        <div className="space-y-8">
          {/* Metrics Cards */}
          <EmployeeMetrics 
            data={dashboardData.metrics} 
            loading={loading} 
          />

          {/* Main Charts Row */}
          <div className="grid grid-cols-12 gap-6">
            {/* Employee Growth Chart */}
            <div className="col-span-12 xl:col-span-8">
              <EmployeeGrowthChart 
                data={dashboardData.growthData} 
                loading={loading} 
              />
            </div>
            
            {/* Visa Compliance Score */}
            <div className="col-span-12 xl:col-span-4">
              <VisaComplianceScore 
                score={dashboardData.complianceScore}
                loading={loading} 
              />
            </div>
          </div>

          {/* Visa Analytics Row */}
          <div className="grid grid-cols-12 gap-6">
            {/* Visa Expiry Trends */}
            <div className="col-span-12 xl:col-span-8">
              <VisaExpiryTrendChart 
                data={dashboardData.visaTrendData} 
                loading={loading} 
              />
            </div>
            
            {/* Recent Activities */}
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
      </div>
    </div>
  );
}







