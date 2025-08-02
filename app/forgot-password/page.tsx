import ForgotPassword from '@/app/(auth)/forgot-password';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
} 