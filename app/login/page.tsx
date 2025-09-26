'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import AuthService, { LoginCredentials } from '@/lib/services/auth';
import { useAuth } from '@/lib/contexts/SimpleAuthContext';
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
    // Enhanced auth check for iPhone 13 and mobile devices
    const checkAuth = async () => {
      try {
        // Quick timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 4000)
        );

        const authPromise = (async () => {
          // Enhanced mobile/iPhone detection
          const isMobile = typeof window !== 'undefined' && window.Capacitor;
          const isIPhone = typeof window !== 'undefined' && /iPhone/.test(navigator.userAgent || '');
          const isIPhoneApp = isIPhone && !/Safari/.test(navigator.userAgent || '');
          
          // For mobile/iPhone devices, try multiple approaches
          if (isMobile || isIPhone || isIPhoneApp) {
            console.log('Login: Mobile/iPhone device detected', { isMobile, isIPhone, isIPhoneApp });
            try {
              // Try session first for mobile/iPhone
              const { session } = await AuthService.getSession();
              if (session) {
                const user = await AuthService.getCurrentUser();
                return user;
              }
            } catch (sessionError) {
              console.log('Mobile/iPhone session check failed, trying direct user fetch:', sessionError);
            }
          }
          
          // Fallback to direct user fetch
          return await AuthService.getCurrentUser();
        })();

        const user = await Promise.race([authPromise, timeoutPromise]) as any;

        if (user) {
          console.log('✅ User found, redirecting to dashboard');
          router.push('/dashboard');
        } else {
          console.log('ℹ️ No user found, staying on login page');
        }
      } catch (error) {
        console.log('Auth check failed (non-critical):', error);
        // Don't redirect on error - just stay on login page
      }
    };

    // Longer delay for mobile devices to ensure proper initialization
    const delay = typeof window !== 'undefined' && window.Capacitor ? 1000 : 500;
    const timer = setTimeout(checkAuth, delay);
    return () => clearTimeout(timer);
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

      toast.success('Login successful! Redirecting...');

      // Simple redirect without complex session handling
      router.push('/dashboard');

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
      className={`min-h-screen flex flex-col items-center justify-center py-4 px-4 login-background-image relative safe-area-all overflow-y-auto ${
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
      <div className="w-full max-w-sm mobile-optimized flex flex-col items-center space-y-6">
        {/* Logo */}
        <div className="login-logo-container-image text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Image
                src="/assets/cubs.webp"
                alt="CUBS Logo"
                width={120}
                height={120}
                className="login-logo-image drop-shadow-lg"
                priority
                style={{ width: '120px', height: '120px' }}
                onError={(e) => {
                  console.log('Logo failed to load, using fallback');
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              {/* Fallback logo */}
              <div className="hidden w-[120px] h-[120px] bg-[#d3194f] rounded-full flex items-center justify-center text-white font-bold text-2xl">
                CUBS
              </div>
            </div>
          </div>
          <p className="text-white dark:text-white mt-2 font-bold text-lg text-center drop-shadow-lg bg-black bg-opacity-50 px-4 py-2 rounded-lg backdrop-blur-sm">
            Employee Management Portal
          </p>
        </div>

        <Card className="w-full p-6 login-card-image shadow-2xl">
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
