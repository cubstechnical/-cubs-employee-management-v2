'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { log } from '@/lib/utils/productionLogger';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    log.info('Login page temporarily disabled for debugging - redirecting to dashboard');
    // Auto-redirect to dashboard for debugging
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d3194f] mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
