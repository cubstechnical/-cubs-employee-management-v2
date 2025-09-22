import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  'data-testid'?: string;
}

export default function Card({ children, className, padding = 'md', shadow = 'md', onClick, 'data-testid': dataTestId }: CardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-apple dark:shadow-apple-dark',
    lg: 'shadow-apple-lg dark:shadow-apple-lg-dark',
  };

  return (
    <div 
      className={cn(
        'bg-white dark:bg-gray-800 rounded-apple border border-gray-200 dark:border-gray-700',
        'transition-all duration-300 ease-in-out hover:shadow-apple-lg dark:hover:shadow-apple-lg-dark',
        'hover:-translate-y-1 hover:scale-[1.01]',
        paddingClasses[padding],
        shadowClasses[shadow],
        className
      )}
      onClick={onClick}
      data-testid={dataTestId}
    >
      {children}
    </div>
  );
} 
