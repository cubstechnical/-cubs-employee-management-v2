
'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Simple admin navigation for now
const AdminNavigation = () => (
  <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
    <div className="p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Panel</h2>
      <nav className="mt-4 space-y-2">
        <a href="/admin/dashboard" className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          Dashboard
        </a>
        <a href="/admin/employees" className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          Employees
        </a>
        <a href="/admin/documents" className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          Documents
        </a>
        <a href="/admin/users" className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          Users
        </a>
        <a href="/admin/settings" className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          Settings
        </a>
      </nav>
    </div>
  </div>
);

const AdminHeader = () => (
  <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">CUBS Admin</h1>
    <div className="flex items-center space-x-4">
      <span className="text-sm text-gray-600 dark:text-gray-300">Admin Panel</span>
    </div>
  </header>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Suspense fallback={<div className="w-64 bg-gray-200 dark:bg-gray-700 animate-pulse h-full"></div>}>
        <AdminNavigation />
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


