'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import AuthService, { LoginCredentials } from '@/lib/services/auth';
import { useAuth } from '@/lib/contexts/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import toast from 'react-hot-toast';
import Image from 'next/image';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Preload background image for better performance
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      setBackgroundLoaded(true);
    };
    img.onerror = () => {
      console.warn('Background image failed to load, using fallback');
      setBackgroundLoaded(true); // Still show the page with fallback
    };
    img.src = '/assets/bg1.webp';
  }, []);

  useEffect(() => {
    // Check if user is already logged in with enhanced session persistence
    const checkAuth = async () => {
      try {
        // First check if we have stored user data in localStorage
        if (typeof window !== 'undefined') {
          const sessionPersisted = localStorage.getItem('cubs_session_persisted');
          const lastLogin = localStorage.getItem('cubs_last_login');
          const storedUserEmail = localStorage.getItem('cubs_user_email');
          const storedUserId = localStorage.getItem('cubs_user_id');

          // If session was persisted and last login was within 24 hours, try to maintain it
          if (sessionPersisted === 'true' && lastLogin && storedUserEmail) {
            const lastLoginTime = new Date(lastLogin);
            const now = new Date();
            const hoursSinceLogin = (now.getTime() - lastLoginTime.getTime()) / (1000 * 60 * 60);

            if (hoursSinceLogin < 24) {
              // Try to get current user from session
              const user = await AuthService.getCurrentUser();
              if (user) {
                console.log('✅ Found valid session, redirecting to dashboard');
                router.push('/dashboard');
                return;
              } else {
                // Try to recover session if we have stored user data
                console.log('🔄 Attempting session recovery with stored data');
                try {
                  // If we have stored user data but no active session, try to refresh
                  const { session } = await AuthService.getSession();
                  if (session && session.user) {
                    console.log('✅ Recovered session, redirecting to dashboard');
                    router.push('/dashboard');
                    return;
                  }
                } catch (recoveryError) {
                  console.warn('Session recovery failed:', recoveryError);
                }
              }
            } else {
              // Session expired, clear stored data
              console.log('⏰ Session expired, clearing stored data');
              localStorage.removeItem('cubs_session_persisted');
              localStorage.removeItem('cubs_last_login');
              localStorage.removeItem('cubs_user_email');
              localStorage.removeItem('cubs_user_id');
            }
          }
        }

        // Final fallback: standard auth check
        const user = await AuthService.getCurrentUser();
        if (user) {
          console.log('✅ Standard auth check found user, redirecting to dashboard');
          router.push('/dashboard');
        } else {
          console.log('ℹ️ No authenticated user found, staying on login page');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Clear potentially corrupted session data but don't redirect
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cubs_session_persisted');
          localStorage.removeItem('cubs_last_login');
          localStorage.removeItem('cubs_user_email');
          localStorage.removeItem('cubs_user_id');
        }
      }
    };
    checkAuth();
  }, [router]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      // Check network connectivity for mobile
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        toast.error('No internet connection. Please check your network and try again.');
        return;
      }

      // Use AuthContext signIn method which properly updates the context
      await signIn(data.email, data.password);

      // Enhanced session persistence with error handling
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cubs_session_persisted', 'true');
          localStorage.setItem('cubs_last_login', new Date().toISOString());
          // Store user info for persistence across page refreshes
          const currentUser = await AuthService.getCurrentUser();
          if (currentUser) {
            localStorage.setItem('cubs_user_email', currentUser.email);
            localStorage.setItem('cubs_user_id', currentUser.id);
          }
        } catch (storageError) {
          console.warn('Failed to save session data to localStorage:', storageError);
        }
      }

      toast.success('Login successful! Redirecting...');

      // Small delay to ensure context is updated before redirect
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);

    } catch (error) {
      console.error('Login error:', error);
      // Better error handling for mobile with more specific messages
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          toast.error('Login timeout. Please check your connection and try again.');
        } else if (error.message.includes('network')) {
          toast.error('Network error. Please check your internet connection.');
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please check your email and click the confirmation link before signing in.');
        } else {
          toast.error(`Login failed: ${error.message}`);
        }
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await AuthService.resetPassword(email);
      
      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Password reset email sent! Check your inbox.');
      setIsForgotPassword(false);
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-start pt-8 pb-4 px-4 login-background-image relative safe-area-all overflow-y-auto ${
        backgroundLoaded ? 'loaded' : 'loading'
      }`}
      style={{
        contain: 'layout style paint',
        willChange: 'transform',
        transform: 'translateZ(0)',
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div className="w-full max-w-sm mobile-optimized flex-1 flex flex-col justify-center min-h-0">
        {/* Logo */}
        <div className="login-logo-container-image mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/assets/cubs.webp"
              alt="CUBS Logo"
              width={120}
              height={120}
              className="login-logo-image drop-shadow-lg"
              priority
            />
          </div>
          <p className="text-white dark:text-white mt-2 font-bold text-lg text-center drop-shadow-lg bg-black bg-opacity-30 px-4 py-2 rounded-lg backdrop-blur-sm">
            Employee Management Portal
          </p>
        </div>

        <Card className="p-6 login-card-image max-w-sm shadow-2xl">
          {!isForgotPassword ? (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Sign In
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Enter your credentials to access your account
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                    error={errors.email?.message}
                    icon={<Mail className="w-4 h-4" />}
                    {...register('email')}
                  />
                </div>

                <div>
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    error={errors.password?.message}
                    icon={<Lock className="w-4 h-4" />}
                    endIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    {...register('password')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don&apos;t have an account?{' '}
                  <a
                    href="/register"
                    className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                  >
                    Create one here
                  </a>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Reset Password
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Enter your email to receive a password reset link
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                    icon={<Mail className="w-4 h-4" />}
                    id="reset-email"
                  />
                </div>

                <Button
                  onClick={() => {
                    const email = (document.getElementById('reset-email') as HTMLInputElement)?.value;
                    handleForgotPassword(email);
                  }}
                  className="w-full"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <div className="flex justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <Link 
              href="/privacy" 
              className="underline hover:text-gray-700 dark:hover:text-gray-300"
            >
              Privacy Policy
            </Link>
            <span>•</span>
            <Link 
              href="/terms" 
              className="underline hover:text-gray-700 dark:hover:text-gray-300"
            >
              Terms of Service
            </Link>
            <span>•</span>
            <Link 
              href="/contact" 
              className="underline hover:text-gray-700 dark:hover:text-gray-300"
            >
              Contact Support
            </Link>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2025 CUBS Technical. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Developed by{' '}
            <a
              href="https://chocosoftdev.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700 dark:hover:text-gray-300"
            >
              ChocoSoft Dev
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
