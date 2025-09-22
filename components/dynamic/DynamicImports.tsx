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
  () => import('@/components/documents/DocumentViewer'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

export const DynamicAdminPanel = dynamic(
  () => import('@/components/admin/AdminPanel'),
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

// Route-based code splitting
export const DynamicDashboard = dynamic(() => import('@/app/dashboard/page'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

export const DynamicEmployees = dynamic(() => import('@/app/employees/page'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

export const DynamicDocuments = dynamic(() => import('@/app/documents/page'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

export const DynamicAdmin = dynamic(() => import('@/app/admin/page'), {
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

export const DynamicReactWindow = dynamic(
  () => import('react-window'),
  {
    loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded"></div>,
    ssr: false
  }
);

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
