import PendingApproval from '@/app/(auth)/pending-approval';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function PendingApprovalPage() {
  return <PendingApproval />;
}
