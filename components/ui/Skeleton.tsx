import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        className
      )}
      style={{
        width: width || '100%',
        height: height || '1rem',
      }}
    />
  );
}

export function DocumentSkeleton() {
  return (
    <div className="group cursor-pointer">
      <div className="relative p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:scale-105">
        {/* Folder/File Icon Skeleton */}
        <div className="flex justify-center mb-4">
          <Skeleton className="w-20 h-16 rounded-xl" />
        </div>
        
        {/* Name Skeleton */}
        <div className="text-center">
          <Skeleton className="h-4 mb-2" />
          <Skeleton className="h-3 w-3/4 mx-auto" />
        </div>
      </div>
    </div>
  );
}

export function DocumentGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <DocumentSkeleton key={index} />
      ))}
    </div>
  );
} 
