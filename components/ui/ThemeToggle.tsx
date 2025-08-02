'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { cn } from '@/utils/cn';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ThemeToggle({ className, size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full transition-all duration-200',
        'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'dark:focus:ring-offset-gray-900',
        sizeClasses[size],
        className
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative">
        <Sun
          className={cn(
            'absolute inset-0 transition-all duration-300',
            iconSizes[size],
            theme === 'light'
              ? 'rotate-0 scale-100 text-yellow-500'
              : 'rotate-90 scale-0 text-gray-400'
          )}
        />
        <Moon
          className={cn(
            'absolute inset-0 transition-all duration-300',
            iconSizes[size],
            theme === 'dark'
              ? 'rotate-0 scale-100 text-blue-400'
              : '-rotate-90 scale-0 text-gray-400'
          )}
        />
      </div>
    </button>
  );
} 