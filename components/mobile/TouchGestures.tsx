"use client";

import { useEffect, useRef, useState } from 'react';

interface TouchGestureProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  longPressDelay?: number;
}

export function TouchGestures({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onLongPress,
  children,
  className = '',
  threshold = 50,
  longPressDelay = 500
}: TouchGestureProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number; time: number } | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);

  // Haptic feedback for mobile devices
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startPos = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    
    setTouchStart(startPos);
    setTouchEnd(null);
    setIsLongPress(false);

    // Start long press timer
    const timer = setTimeout(() => {
      setIsLongPress(true);
      if (onLongPress) {
        triggerHaptic('medium');
        onLongPress();
      }
    }, longPressDelay);
    
    setLongPressTimer(timer);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.touches[0];
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });

    // Cancel long press if user moves finger
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Handle touch end
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchEnd) return;

    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    // Don't trigger swipe if it was a long press
    if (isLongPress) {
      setTouchStart(null);
      setTouchEnd(null);
      setIsLongPress(false);
      return;
    }

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const deltaTime = touchEnd.time - touchStart.time;

    // Determine if it's a swipe or tap
    const isSwipe = Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold;
    const isQuickTouch = deltaTime < 300;

    if (isSwipe) {
      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > threshold && onSwipeRight) {
          triggerHaptic('light');
          onSwipeRight();
        } else if (deltaX < -threshold && onSwipeLeft) {
          triggerHaptic('light');
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > threshold && onSwipeDown) {
          triggerHaptic('light');
          onSwipeDown();
        } else if (deltaY < -threshold && onSwipeUp) {
          triggerHaptic('light');
          onSwipeUp();
        }
      }
    } else if (isQuickTouch && onTap) {
      // Quick tap
      triggerHaptic('light');
      onTap();
    }

    // Reset touch state
    setTouchStart(null);
    setTouchEnd(null);
    setIsLongPress(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  return (
    <div
      ref={elementRef}
      className={`touch-manipulation ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        touchAction: 'manipulation', // Optimize touch performance
        WebkitTouchCallout: 'none', // Disable iOS callout
        WebkitUserSelect: 'none', // Disable text selection
        userSelect: 'none'
      }}
    >
      {children}
    </div>
  );
}

// Swipeable employee card component
interface SwipeableEmployeeCardProps {
  employee: {
    id: string;
    name: string;
    company_name: string;
    is_active: boolean;
  };
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  children: React.ReactNode;
}

export function SwipeableEmployeeCard({
  employee,
  onEdit,
  onDelete,
  onView,
  children
}: SwipeableEmployeeCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);

  const handleSwipeLeft = () => {
    setSwipeOffset(-100);
    setIsSwipeActive(true);
    
    // Auto-reset after showing actions
    setTimeout(() => {
      setSwipeOffset(0);
      setIsSwipeActive(false);
    }, 2000);
  };

  const handleSwipeRight = () => {
    setSwipeOffset(100);
    setIsSwipeActive(true);
    
    // Auto-reset after showing actions
    setTimeout(() => {
      setSwipeOffset(0);
      setIsSwipeActive(false);
    }, 2000);
  };

  const handleTap = () => {
    if (!isSwipeActive) {
      onView();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Action buttons */}
      <div className="absolute inset-y-0 right-0 flex items-center bg-red-500 text-white px-4 z-10">
        <button
          onClick={onDelete}
          className="flex items-center gap-2 text-sm font-medium"
        >
          🗑️ Delete
        </button>
      </div>
      
      <div className="absolute inset-y-0 left-0 flex items-center bg-blue-500 text-white px-4 z-10">
        <button
          onClick={onEdit}
          className="flex items-center gap-2 text-sm font-medium"
        >
          ✏️ Edit
        </button>
      </div>

      {/* Main card */}
      <TouchGestures
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        onTap={handleTap}
        className="relative z-20 bg-white dark:bg-gray-800 transition-transform duration-200 ease-out"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          touchAction: 'pan-y'
        }}
      >
        {children}
      </TouchGestures>
    </div>
  );
}

export default TouchGestures;
