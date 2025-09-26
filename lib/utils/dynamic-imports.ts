// Dynamic imports utility for better performance
import dynamic from 'next/dynamic';

// Dashboard components - lazy loaded
export const LazyDashboardStats = dynamic(() => import('@/components/dashboard/DashboardStats'), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
});

export const LazyEmployeeOverview = dynamic(() => import('@/components/dashboard/EmployeeOverview'), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
});

export const LazyVisaExpiryAlerts = dynamic(() => import('@/components/dashboard/VisaExpiryAlerts'), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-48 rounded-lg"></div>
});

// Admin components - lazy loaded
export const LazyAdminDashboard = dynamic(() => import('@/app/admin/dashboard/page'), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-96 rounded-lg"></div>
});

export const LazyAdminEmployees = dynamic(() => import('@/app/admin/employees/page'), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-96 rounded-lg"></div>
});

// Heavy libraries - lazy loaded
export const LazyApexCharts = dynamic(() => import('react-apexcharts'), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>,
  ssr: false
});

export const LazyFramerMotion = dynamic(() => import('framer-motion'), {
  loading: () => null,
  ssr: false
});
