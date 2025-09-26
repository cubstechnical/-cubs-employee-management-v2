
'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Lazy load admin components for better performance
const AdminSidebar = dynamic(() => import('@/components/admin/AdminSidebar'), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-full w-64"></div>
});

const AdminHeader = dynamic(() => import('@/components/admin/AdminHeader'), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16"></div>
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Suspense fallback={<div className="w-64 bg-gray-200 dark:bg-gray-700 animate-pulse h-full"></div>}>
        <AdminSidebar />
      </Suspense>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Suspense fallback={<div className="h-16 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>}>
          <AdminHeader />
        </Suspense>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}


