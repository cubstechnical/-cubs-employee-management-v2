'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { cn } from '@/utils/cn';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient' | 'minimal';
}

export default function ThemeToggle({ className, size = 'md', variant = 'default' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  } as const;

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  } as const;

  const getVariantClasses = () => {
    switch (variant) {
      case 'gradient':
        return cn(
          'bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500',
          'dark:from-[#d3194f] dark:to-[#b0173a] dark:hover:from-[#e01a5a] dark:hover:to-[#c0183f]',
          'shadow-lg hover:shadow-xl transform hover:scale-105'
        );
      case 'minimal':
        return 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700';
      default:
        return 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md';
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex items-center justify-center rounded-xl transition-all duration-300 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-[#d3194f] focus:ring-offset-2',
        'dark:focus:ring-offset-gray-900',
        sizeClasses[size],
        getVariantClasses(),
        className
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative flex items-center justify-center">
        <Sun
          className={cn(
            'absolute transition-all duration-300 ease-in-out',
            iconSizes[size],
            theme === 'light'
              ? 'rotate-0 scale-100 opacity-100 text-orange-500'
              : 'rotate-180 scale-0 opacity-0'
          )}
        />
        <Moon
          className={cn(
            'absolute transition-all duration-300 ease-in-out',
            iconSizes[size],
            theme === 'dark'
              ? 'rotate-0 scale-100 opacity-100 text-[#d3194f]'
              : '-rotate-180 scale-0 opacity-0'
          )}
        />
      </div>
    </button>
  );
} 
