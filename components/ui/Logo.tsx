'use client';

import Image from 'next/image';
import { cn } from '@/utils/cn';
import CustomIcon from './CustomIcon';
import { useTheme } from 'next-themes';

interface LogoProps {
  variant?: 'default' | 'white' | 'icon' | 'splash';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  animated?: boolean;
}

export default function Logo({ 
  variant = 'default', 
  size = 'md', 
  className,
  showText = true,
  animated = true
}: LogoProps) {
  const { theme } = useTheme();

  const getLogoPath = () => {
    // Use logo.png for light theme, logo2.png for dark theme
    if (variant === 'default') {
      return theme === 'dark' ? '/assets/logo2.png' : '/assets/logo.png';
    }
    
    switch (variant) {
      case 'white':
        return '/assets/logo2.png';
      case 'icon':
        return '/assets/icon.png';
      case 'splash':
        return '/assets/splash.png';
      default:
        return theme === 'dark' ? '/assets/logo2.png' : '/assets/logo.png';
    }
  };

  const getIconPath = () => {
    return '/assets/icon.png';
  };

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-14 w-14',
    xl: 'h-20 w-20',
  } as const;

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const animationClasses = animated ? 'transition-all duration-300 ease-in-out hover:scale-105' : '';

  if (!showText) {
    return (
      <div className={cn('flex items-center', animationClasses, className)}>
        <Image
          src={getLogoPath()}
          alt="CUBS Technical Logo"
          width={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 56 : 80}
          height={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 56 : 80}
          className={cn('object-contain', sizeClasses[size])}
          sizes="(max-width: 1024px) 56px, 80px"
          priority
        />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center space-x-2', animationClasses, className)}>
      <Image
        src={getLogoPath()}
        alt="CUBS Technical Logo"
        width={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 56 : 80}
        height={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 56 : 80}
        className={cn('object-contain', sizeClasses[size])}
        sizes="(max-width: 1024px) 56px, 80px"
        priority
      />
      <div className={cn('font-bold text-gray-900 dark:text-white transition-colors duration-300', textSizeClasses[size])}>
        CUBS Technical
      </div>
    </div>
  );
}
