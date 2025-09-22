'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  itemWidth: number;
  containerHeight: number;
  containerWidth: number;
  overscan?: number;
}

export function VirtualGrid<T>({
  items,
  renderItem,
  itemHeight,
  itemWidth,
  containerHeight,
  containerWidth,
  overscan = 5
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const itemsPerRow = Math.floor(containerWidth / itemWidth);
  const totalRows = Math.ceil(items.length / itemsPerRow);
  const totalHeight = totalRows * itemHeight;

  const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endRow = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);

  const visibleItems: T[] = [];
  for (let row = startRow; row < endRow; row++) {
    for (let col = 0; col < itemsPerRow; col++) {
      const index = row * itemsPerRow + col;
      if (index < items.length) {
        visibleItems.push(items[index]);
      }
    }
  }

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        height: containerHeight,
        width: containerWidth,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          width: '100%',
          position: 'relative'
        }}
      >
        {visibleItems.map((item, index) => {
          const globalIndex = startRow * itemsPerRow + index;
          const row = Math.floor(globalIndex / itemsPerRow);
          const col = globalIndex % itemsPerRow;
          
          return (
            <div
              key={globalIndex}
              style={{
                position: 'absolute',
                top: row * itemHeight,
                left: col * itemWidth,
                width: itemWidth,
                height: itemHeight
              }}
            >
              {renderItem(item, globalIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
} 
