'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/utils/cn';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight?: number;
  className?: string;
  overscan?: number; // Number of items to render outside visible area
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}

const VirtualList = <T,>({
  items,
  renderItem,
  itemHeight,
  containerHeight = 600,
  className = '',
  overscan = 5,
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent
}: VirtualListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range with overscan
  const visibleRange = useMemo(() => {
    const visibleItemCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      startIndex + visibleItemCount + 2 * overscan
    );

    return { startIndex, endIndex, visibleItemCount };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const { startIndex, endIndex } = visibleRange;

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  // Calculate layout
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  // Handle scroll with throttling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-2 p-4">
      {Array.from({ length: Math.min(10, Math.ceil(containerHeight / itemHeight)) }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded"
          style={{ height: itemHeight - 8 }}
        />
      ))}
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
      {emptyComponent || <div>No items to display</div>}
    </div>
  );

  // Show loading state
  if (loading) {
    return (
      <div
        className={cn('relative overflow-hidden', className)}
        style={{ height: containerHeight }}
      >
        {loadingComponent || <LoadingSkeleton />}
      </div>
    );
  }

  // Show empty state
  if (!items.length) {
    return (
      <div
        className={cn('relative', className)}
        style={{ height: containerHeight }}
      >
        <EmptyState />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn(
        'relative overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
        className
      )}
      style={{ height: containerHeight }}
      role="list"
      aria-label={`Virtual list with ${items.length} items`}
    >
      {/* Total height container */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            return (
              <div
                key={actualIndex}
                style={{ height: itemHeight }}
                className="flex items-center"
                role="listitem"
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Memoized version for better performance
const MemoizedVirtualList = React.memo(VirtualList) as typeof VirtualList;

export default MemoizedVirtualList;

// Hook for easier virtual list usage with common patterns
export function useVirtualList<T>({
  items,
  itemHeight,
  containerHeight = 600,
  overscan = 5,
}: {
  items: T[];
  itemHeight: number;
  containerHeight?: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const visibleItemCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      startIndex + visibleItemCount + 2 * overscan
    );

    return { startIndex, endIndex, visibleItemCount };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const scrollToIndex = useCallback((index: number) => {
    const scrollTop = index * itemHeight;
    setScrollTop(scrollTop);
  }, [itemHeight]);

  const scrollToTop = useCallback(() => {
    setScrollTop(0);
  }, []);

  return {
    visibleRange,
    scrollTop,
    setScrollTop,
    scrollToIndex,
    scrollToTop,
    totalHeight: items.length * itemHeight,
  };
}
