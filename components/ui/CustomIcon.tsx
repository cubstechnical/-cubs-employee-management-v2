'use client';

import Image from 'next/image';
import { cn } from '@/utils/cn';

interface CustomIconProps {
  name: 'cubs' | 'logo' | 'splash';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function CustomIcon({ name, size = 'md', className }: CustomIconProps) {
  const getIconPath = () => {
    switch (name) {
      case 'cubs':
        return '/assets/icon.svg';
      case 'logo':
        return '/assets/logo.png';
      case 'splash':
        return '/assets/splash.png';
      default:
        return '/assets/icon.svg';
    }
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  if (name === 'cubs') {
    return (
      <svg 
        width={size === 'sm' ? 16 : size === 'md' ? 24 : size === 'lg' ? 32 : 48}
        height={size === 'sm' ? 16 : size === 'md' ? 24 : size === 'lg' ? 32 : 48}
        viewBox="0 0 512 512" 
        xmlns="http://www.w3.org/2000/svg"
        className={cn('inline-block', sizeClasses[size], className)}
      >
        <rect width="100%" height="100%" fill="currentColor" className="text-red-600 dark:text-red-400"/>
        <text 
          x="50%" 
          y="50%" 
          textAnchor="middle" 
          dy="0.3em" 
          fill="white" 
          fontFamily="Arial, sans-serif" 
          fontSize={size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96} 
          fontWeight="bold"
        >
          CUBS
        </text>
      </svg>
    );
  }

  const dimension = size === 'sm' ? 16 : size === 'md' ? 24 : size === 'lg' ? 32 : 48;
  return (
    <Image
      src={getIconPath()}
      alt={`${name} icon`}
      width={dimension}
      height={dimension}
      className={cn('object-contain', sizeClasses[size], className)}
      priority={false}
    />
  );
} 
