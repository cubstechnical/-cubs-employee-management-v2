import Callback from '@/app/(auth)/callback';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function CallbackPage() {
  return <Callback />;
} 