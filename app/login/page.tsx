'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { log } from '@/lib/utils/productionLogger';
import { isCapacitorApp } from '@/utils/mobileDetection';
// import { useMobileCrashDetection } from '@/hooks/useMobileCrashDetection'; // Temporarily disabled to prevent hanging

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false); // Start with false to prevent loading
  const [logoFailed, setLogoFailed] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);

  // Initialize mobile crash detection
  // useMobileCrashDetection(); // Temporarily disabled to prevent hanging
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const checkAuth = useCallback(async () => {
    // Skip auth check if already checking or if we're in a redirect loop
    if (isCheckingAuth) {
      return;
    }
    
    setIsCheckingAuth(true);
    
    try {

      // Use the same authentication logic for both web and mobile
      // If it works in web/PWA, it should work in mobile too
      // Reduced timeout to prevent hanging on mobile
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timeout')), 1000)
      );

      const authPromise = AuthService.getCurrentUser();
      const user = await Promise.race([authPromise, timeoutPromise]) as any;

      if (user) {
        // Check if we're already on the login page to prevent redirect loops
        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          log.info('✅ User already authenticated, redirecting to dashboard');
          
          // Android Capacitor fix: Use router.replace for in-app navigation
          if (isCapacitorApp()) {
            log.info('Login checkAuth: Using router.replace for Capacitor redirect');
            router.replace('/dashboard');
          } else {
            router.push('/dashboard');
          }
        } else {
          log.info('ℹ️ User authenticated but already on login page, staying here');
          setIsCheckingAuth(false);
        }
      } else {
        log.info('ℹ️ No authenticated user found, showing login form');
        setIsCheckingAuth(false);
      }
    } catch (error) {
      log.info('Auth check failed (non-critical):', error);
      // Don't redirect on error - just stay on login page
      setIsCheckingAuth(false);
    }
  }, [router, isCheckingAuth]);

  useEffect(() => {
    // Skip auth check on mobile to prevent loading screens
    if (isCapacitorApp()) {
      setIsCheckingAuth(false);
      return;
    }

    // Only check auth once on mount
    const timer = setTimeout(() => {
      checkAuth();
    }, 200);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount, checkAuth is stable

  // Handle keyboard open/close on mobile to improve UX
  useEffect(() => {
    if (typeof window === 'undefined' || !isCapacitorApp()) return;

    // Detect keyboard open/close
    const handleResize = () => {
      // On mobile, if viewport height reduces significantly, keyboard is likely open
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const heightDiff = windowHeight - viewportHeight;
      
      // If height difference is > 150px, keyboard is likely open
      setIsKeyboardOpen(heightDiff > 150);
    };

    // Listen for resize events
    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);

    // Focus event - scroll input into view
    const handleFocus = (e: FocusEvent) => {
      const target = e.target;
      if (target && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
        // Small delay to let keyboard open first
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };

    document.addEventListener('focusin', handleFocus);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocus);
    };
  }, []);

  // Listen for user changes after login attempt
  useEffect(() => {
    if (loginAttempted && user && user.id) {
      log.info('Login page: User detected after login attempt, redirecting...');
      toast.success('Login successful! Redirecting...');
      
      // Android Capacitor fix: Use router.replace for in-app navigation
      if (isCapacitorApp()) {
        log.info('Login page: Using router.replace for Capacitor redirect (useEffect)');
        setTimeout(() => {
          router.replace('/dashboard');
        }, 100);
      } else {
        router.push('/dashboard');
      }
      
      setLoginAttempted(false);
    }
  }, [user, loginAttempted, router]);

  // Timeout fallback for login verification
  useEffect(() => {
    if (loginAttempted) {
      const timeout = setTimeout(() => {
        if (loginAttempted) {
          log.warn('Login page: Timeout waiting for user state update');
          toast.error('Authentication verification failed. Please try logging in again.');
          setLoginAttempted(false);
          setIsLoading(false);
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loginAttempted]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      log.info('Login page: Starting login process...', { email: data.email });

      // Use AuthContext signIn method which properly updates the context
      await signIn(data.email, data.password);

      log.info('Login page: Login successful, setting login attempted flag...');
      setLoginAttempted(true);

      // Wait a bit for the user state to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // If user is already available, redirect immediately
      if (user && user.id) {
        log.info('Login page: User already available, redirecting immediately');
        toast.success('Login successful! Redirecting...');
        
        // Android Capacitor fix: Use router.replace for in-app navigation  
        if (isCapacitorApp()) {
          log.info('Login page: Using router.replace for Capacitor redirect');
          router.replace('/dashboard');
        } else {
          router.push('/dashboard');
        }
        
        setLoginAttempted(false);
        return;
      }

      // Otherwise, the useEffect will handle the redirect when user state updates
      log.info('Login page: Waiting for user state to update...');

    } catch (error) {
      log.error('Login page: Login error:', error);
      // Enhanced error handling with mobile-specific messages
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please check your email and click the confirmation link before signing in.');
        } else if (error.message.includes('Too many login attempts')) {
          toast.error('Too many login attempts. Please wait a few minutes before trying again.');
        } else if (error.message.includes('Authentication service unavailable')) {
          toast.error('Authentication service is temporarily unavailable. Please try again later.');
        } else {
          toast.error('Login failed. Please try again.');
        }
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (formEmail?: string) => {
    let email = formEmail;

    // Safely access DOM only on client side
    if (!email && typeof document !== 'undefined') {
      const emailInput = document.getElementById('reset-email') as HTMLInputElement;
      email = emailInput?.value;
    }

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
      log.error('Password reset error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d3194f] mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-login">
      <div
        className="min-h-screen overflow-y-auto flex flex-col items-center py-8 px-4 login-background-image relative safe-area-all"
        style={{
          scrollBehavior: 'smooth',
          backgroundColor: '#111827', // Ensure no white background
          minHeight: '100vh',
          height: 'auto' // Allow height to grow beyond viewport
        }}
      >
      <div className="w-full max-w-sm mobile-optimized flex flex-col items-center space-y-2 my-auto">
        {/* Logo removed for mobile */}
        {!isCapacitorApp() && (
          <div className="login-logo-container-image text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                {!logoFailed ? (
                  <Image
                    src="/assets/cubs.webp"
                    alt="CUBS Logo"
                    width={120}
                    height={120}
                    className="login-logo-image"
                    priority
                    style={{ width: '120px', height: '120px' }}
                    onError={() => {
                      log.info('Logo failed to load, using fallback');
                      setLogoFailed(true);
                    }}
                  />
                ) : (
                  <div className="w-[120px] h-[120px] bg-[#d3194f] rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    CUBS
                  </div>
                )}
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mt-1 font-semibold text-sm text-center px-3 py-1 rounded-lg whitespace-nowrap">
              Employee Management Portal
            </p>
          </div>
        )}

        <Card className={`w-full ${isKeyboardOpen ? 'p-4' : 'p-6'} login-card-image transition-all duration-300`}>
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
                    if (typeof document !== 'undefined') {
                      const email = (document.getElementById('reset-email') as HTMLInputElement)?.value;
                      handleForgotPassword(email);
                    }
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

        {/* Footer - High Contrast for Dark Background */}
        <div className="text-center mt-8 space-y-2">
          <div className="flex justify-center space-x-4 text-xs text-white/80">
            <Link 
              href="/privacy" 
              className="underline hover:text-white transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <span className="text-white/60">•</span>
            <Link 
              href="/terms" 
              className="underline hover:text-white transition-colors duration-200"
            >
              Terms of Service
            </Link>
            <span className="text-white/60">•</span>
            <Link 
              href="/contact" 
              className="underline hover:text-white transition-colors duration-200"
            >
              Contact Support
            </Link>
          </div>
          <p className="text-sm text-white/70">
            © 2025 CUBS Technical. All rights reserved.
          </p>
          <p className="text-xs text-white/70">
            Developed by{' '}
            <a
              href="https://chocosoftdev.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white transition-colors duration-200 font-medium"
            >
              ChocoSoft Dev
            </a>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
