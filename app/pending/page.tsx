import Pending from '@/app/(auth)/pending';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function PendingPage() {
  return <Pending />;
} 