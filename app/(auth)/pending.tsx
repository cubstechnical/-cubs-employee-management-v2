'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Mail, 
  Clock,
  RefreshCw,
  Building2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { AuthService } from '@/lib/services/auth';
import toast from 'react-hot-toast';

export default function Pending() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Get email from session or localStorage
    const userEmail = localStorage.getItem('pendingEmail') || '';
    setEmail(userEmail);

    // Check if user is already verified
    checkVerificationStatus();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const checkVerificationStatus = async () => {
    try {
      const sessionData = await AuthService.getSession();
      if (sessionData.session?.user?.email_confirmed_at) {
        toast.success('Email verified! Redirecting to dashboard...');
        localStorage.removeItem('pendingEmail');
        router.push('/dashboard');
      }
    } catch (error) {
      // User not verified yet, stay on this page
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('No email address found');
      return;
    }

    setLoading(true);
    try {
      const { error } = await AuthService.resendVerification(email);
      
      if (error) {
        toast.error(error.message || 'Failed to send verification email');
      } else {
        toast.success('Verification email sent! Check your inbox.');
        setCountdown(60); // 60 second cooldown
      }
    } catch (error) {
      toast.error('Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    checkVerificationStatus();
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
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Verify Your Email
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We've sent a verification email to <strong className="text-gray-900 dark:text-white">{email}</strong>
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-left">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                What to do next:
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Check your email inbox</li>
                <li>• Click the verification link</li>
                <li>• Return here to continue</li>
              </ul>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="flex-1"
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Check Status
              </Button>
              
              <Button
                onClick={handleResendEmail}
                disabled={loading || countdown > 0}
                className="flex-1"
                icon={<Mail className="w-4 h-4" />}
              >
                {countdown > 0 ? `${countdown}s` : 'Resend Email'}
              </Button>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-500">
              Didn't receive the email? Check your spam folder or try resending.
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 

