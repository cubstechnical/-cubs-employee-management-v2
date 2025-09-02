'use client';

import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load heavy components for better initial load performance

// Chart components (heavy libraries)
export const ApexChart = lazy(() => import('react-apexcharts'));

// Dashboard components
export const PerformanceDashboard = lazy(() => import('@/components/admin/PerformanceDashboard'));

// Document components
export const DocumentPreview = lazy(() => import('@/components/documents/DocumentPreview'));
export const UploadModal = lazy(() => import('@/components/documents/UploadModal'));

// Admin components (only import existing components)
// Note: AdminEmployeeForm and BulkUploadModal don't exist in this project

// Loading fallback components
export const ChartLoadingFallback = () => (
  <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse flex items-center justify-center">
    <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
      <Loader2 className="w-6 h-6 animate-spin" />
      <span>Loading chart...</span>
    </div>
  </div>
);

export const ModalLoadingFallback = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 flex items-center space-x-3">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      <span className="text-gray-700 dark:text-gray-300">Loading...</span>
    </div>
  </div>
);

export const ComponentLoadingFallback = () => (
  <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
    <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span>Loading component...</span>
    </div>
  </div>
);

// Wrapper components with Suspense
export const LazyChart = ({ children, ...props }: any) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <ApexChart {...props}>
      {children}
    </ApexChart>
  </Suspense>
);

export const LazyPerformanceDashboard = () => (
  <Suspense fallback={<ComponentLoadingFallback />}>
    <PerformanceDashboard />
  </Suspense>
);

export const LazyDocumentPreview = (props: any) => (
  <Suspense fallback={<ModalLoadingFallback />}>
    <DocumentPreview {...props} />
  </Suspense>
);

export const LazyUploadModal = (props: any) => (
  <Suspense fallback={<ModalLoadingFallback />}>
    <UploadModal {...props} />
  </Suspense>
);

// Removed LazyEmployeeForm and LazyBulkUploadModal as the base components don't exist

// Preload function for critical components
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be needed soon
  if (typeof window !== 'undefined') {
    // Preload chart component after a short delay
    setTimeout(() => {
      import('react-apexcharts').catch(() => {
        // Ignore errors during preload
      });
    }, 2000);

    // Preload document preview after initial load
    setTimeout(() => {
      import('@/components/documents/DocumentPreview').catch(() => {
        // Ignore errors during preload
      });
    }, 3000);
  }
};
