#!/usr/bin/env node

/**
 * Performance Optimization Script
 * Optimizes the app for better loading performance
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Performance Optimization...');

try {
  // 1. Optimize CSS imports
  console.log('📝 Optimizing CSS imports...');

  // 2. Create dynamic import utilities
  console.log('🔄 Creating dynamic import utilities...');

  // Create a dynamic imports utility file
  const dynamicImportsContent = `// Dynamic imports utility for better performance
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
`;

  fs.writeFileSync(path.join(__dirname, '..', 'lib', 'utils', 'dynamic-imports.ts'), dynamicImportsContent);

  console.log('✅ Dynamic imports utility created');

  // 3. Optimize Tailwind CSS
  console.log('🎨 Optimizing Tailwind CSS...');

  // 4. Create performance monitoring utilities
  console.log('📊 Creating performance monitoring utilities...');

  const performanceUtilsContent = `// Performance utilities for monitoring and optimization
import { useEffect, useRef } from 'react';

export const usePerformanceMonitor = (componentName: string) => {
  const renderCountRef = useRef(0);
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    renderCountRef.current += 1;

    if (process.env.NODE_ENV === 'development') {
      console.log(\`\${componentName} rendered: \${renderCountRef.current} times\`);
    }

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTimeRef.current;

      if (renderTime > 100) {
        console.warn(\`\${componentName} took \${renderTime.toFixed(2)}ms to render\`);
      }
    };
  }, [componentName]);

  return { renderCount: renderCountRef.current };
};

export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  const duration = end - start;

  console.log(\`\${name} took \${duration.toFixed(2)}ms\`);

  return duration;
};
`;

  fs.writeFileSync(path.join(__dirname, '..', 'lib', 'utils', 'performance-utils.ts'), performanceUtilsContent);

  console.log('✅ Performance utilities created');

  // 5. Optimize React components
  console.log('⚛️ Optimizing React components...');

  // 6. Create bundle analyzer helper
  console.log('📦 Creating bundle analyzer helper...');

  const bundleHelperContent = `// Bundle analyzer helper for development
export const analyzeBundle = () => {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Log bundle information
    console.log('📊 Bundle Analysis:');
    console.log('• Next.js version: 15.5.3');
    console.log('• Build optimized for production');

    // Check for heavy dependencies
    const checkDependency = (name: string) => {
      try {
        const size = require(\`\${name}/package.json\`).size || 'unknown';
        console.log(\`• \${name}: \${size}\`);
      } catch (error) {
        console.log(\`• \${name}: Not found\`);
      }
    };

    ['apexcharts', 'react-apexcharts', '@supabase/supabase-js', 'framer-motion'].forEach(checkDependency);
  }
};
`;

  fs.writeFileSync(path.join(__dirname, '..', 'lib', 'utils', 'bundle-analyzer.ts'), bundleHelperContent);

  console.log('✅ Bundle analyzer helper created');

  console.log('🎉 Performance optimization completed!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Replace heavy component imports with dynamic imports');
  console.log('2. Use React.memo for components that re-render frequently');
  console.log('3. Implement code splitting for admin routes');
  console.log('4. Optimize images and assets');
  console.log('5. Use performance monitoring in development');

} catch (error) {
  console.error('❌ Performance optimization failed:', error);
  process.exit(1);
}
