"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Loading component for dynamic imports
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d3194f]"></div>
  </div>
);

// Dynamic imports for heavy components
export const DynamicEmployeeGrowthChart = dynamic(
  () => import('@/components/dashboard/EmployeeGrowthChart'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

export const DynamicVisaExpiryTrendChart = dynamic(
  () => import('@/components/dashboard/VisaExpiryTrendChart'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

export const DynamicVisaComplianceScore = dynamic(
  () => import('@/components/dashboard/VisaComplianceScore'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

export const DynamicRecentEmployeeActivities = dynamic(
  () => import('@/components/dashboard/RecentEmployeeActivities'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

export const DynamicVirtualizedEmployeeList = dynamic(
  () => import('@/components/employees/VirtualizedEmployeeList'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

export const DynamicDocumentViewer = dynamic(
  () => import('@/components/documents/DocumentPreview'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

export const DynamicAdminPanel = dynamic(
  () => import('@/components/admin/PerformanceDashboard'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

// Wrapper component for dynamic imports with error boundary
export function DynamicComponentWrapper({ 
  children, 
  fallback = <LoadingSpinner /> 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

// Route-based code splitting with optimized loading
export const DynamicDashboard = dynamic(() => import('@/app/dashboard/page'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

export const DynamicEmployees = dynamic(() => import('@/app/employees/page'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

// Heavy chart components - lazy load only when needed
export const DynamicApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading chart...</p>
      </div>
    </div>
  )
});

// Admin components - only load for admin users (optimized version)
export const DynamicAdminPanelOptimized = dynamic(() => import('@/components/admin/PerformanceDashboard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-32 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading admin panel...</p>
      </div>
    </div>
  )
});

// Document viewer - heavy component (optimized version)
export const DynamicDocumentViewerOptimized = dynamic(() => import('@/components/documents/DocumentPreview'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading document viewer...</p>
      </div>
    </div>
  )
});

// Performance dashboard - only in development
export const DynamicPerformanceDashboard = dynamic(() => import('@/components/performance/PerformanceDashboard'), {
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
});

// Date picker - heavy component with react-datepicker
export const DynamicDatePicker = dynamic(() => import('@/components/ui/DatePicker'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#d3194f]"></div>
      <span className="ml-2 text-sm text-gray-500">Loading date picker...</span>
    </div>
  )
});

export const DynamicDocuments = dynamic(() => import('@/app/documents/page'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

export const DynamicAdmin = dynamic(() => import('@/app/admin/dashboard/page'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

// Conditional loading based on user role
export function ConditionalAdminComponent({ 
  userRole, 
  children 
}: { 
  userRole: string; 
  children: React.ReactNode;
}) {
  if (userRole !== 'admin') {
    return null;
  }

  return (
    <DynamicComponentWrapper>
      {children}
    </DynamicComponentWrapper>
  );
}

// Lazy load heavy libraries
export const DynamicApexCharts = dynamic(
  () => import('react-apexcharts'),
  {
    loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded"></div>,
    ssr: false
  }
);

// Note: react-window is imported directly in components that need it
// export const DynamicReactWindow = dynamic(
//   () => import('react-window'),
//   {
//     loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded"></div>,
//     ssr: false
//   }
// );

// Preload critical components
export function preloadCriticalComponents() {
  if (typeof window !== 'undefined') {
    // Preload dashboard components
    import('@/components/dashboard/EmployeeGrowthChart');
    import('@/components/dashboard/VisaExpiryTrendChart');
    
    // Preload employee components
    import('@/components/employees/VirtualizedEmployeeList');
  }
}

// Preload on user interaction
export function preloadOnHover(componentPath: string) {
  return () => {
    import(componentPath);
  };
}

export default DynamicComponentWrapper;
