'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import AuthService, { LoginCredentials } from '@/lib/services/auth';
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
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const user = await AuthService.getCurrentUser();
      if (user) {
        router.push('/dashboard');
      }
    };
    checkAuth();
  }, [router]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      const credentials: LoginCredentials = {
        email: data.email,
        password: data.password,
      };

      const { user, error } = await AuthService.signIn(credentials);

      if (error) {
        toast.error(error.message);
        return;
      }

      if (user) {
        toast.success(`Welcome back, ${user.name || user.email}!`);
        router.push('/dashboard');
      }
    } catch (error) {

      toast.error('An unexpected error occurred');
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

      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center login-background p-4 relative">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="login-logo-container">
          <div className="flex justify-center mb-4">
            <Image
              src="/assets/cubs.webp"
              alt="CUBS Logo"
              width={120}
              height={120}
              className="login-logo"
              priority
            />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2 font-bold text-xl text-center">
            Employee Management Portal
          </p>
        </div>

        <Card className="p-8 login-card">
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
        <div className="text-center mt-8 space-y-1">
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