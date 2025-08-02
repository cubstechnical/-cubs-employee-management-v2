'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import { 
  Loader2,
  CheckCircle,
  XCircle,
  Building2
} from 'lucide-react';
import { AuthService } from '@/lib/services/auth';
import toast from 'react-hot-toast';

export default function Callback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const urlError = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (urlError) {
        setStatus('error');
        setMessage(errorDescription || 'Authentication failed');
        toast.error('Authentication failed');
        return;
      }

      // Handle OAuth callback
      const { session, error } = await AuthService.handleCallback();

      if (error) {
        setStatus('error');
        setMessage(error.message || 'Authentication failed');
        toast.error('Authentication failed');
        return;
      }

      if (session) {
        setStatus('success');
        setMessage('Authentication successful! Redirecting...');
        toast.success('Welcome back!');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setStatus('error');
        setMessage('No session found');
        toast.error('Authentication failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An unexpected error occurred');
      toast.error('Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 dark:bg-primary-500 rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CUBS Technical</h1>
        </div>

        <Card className="p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Authenticating...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {message}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Success!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {message}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Authentication Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {message}
              </p>
              <button
                onClick={() => router.push('/login')}
                className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
              >
                Back to Login
              </button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
} 

