'use client';

import Settings from '@/components/dashboard/Settings';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function SettingsPage() {
  return (
    <AuthenticatedLayout requireAuth={true}>
      <Settings />
    </AuthenticatedLayout>
  );
} 