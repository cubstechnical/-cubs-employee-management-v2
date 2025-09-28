import Settings from '@/components/dashboard/Settings';

// Force dynamic rendering for this page since it uses authentication
export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return <Settings />;
} 