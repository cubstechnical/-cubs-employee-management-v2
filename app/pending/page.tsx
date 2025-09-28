import PendingApproval from '@/components/auth/PendingApproval';

// Force dynamic rendering for this page since it may use authentication
export const dynamic = 'force-dynamic';

export default function PendingPage() {
  return <PendingApproval />;
} 