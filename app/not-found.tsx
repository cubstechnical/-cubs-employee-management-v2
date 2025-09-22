import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* 404 Icon */}
        <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Search className="w-12 h-12 text-white" />
        </div>

        {/* Content */}
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. 
          Let&apos;s get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button icon={<ArrowLeft className="w-4 h-4" />}>
            Go Back
          </Button>
          <Link href="/">
            <Button variant="outline" icon={<Home className="w-4 h-4" />}>
              Go Home
            </Button>
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-600">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
} 