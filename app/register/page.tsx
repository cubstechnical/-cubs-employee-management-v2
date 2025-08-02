import Register from '@/app/(auth)/register';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RegisterPage() {
  return <Register />;
} 