'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import MobileNetworkStatus from '@/components/mobile/MobileNetworkStatus';
import UnifiedErrorBoundary from '@/components/ui/UnifiedErrorBoundary';
import { isMobileDevice, getScreenSize } from '@/utils/mobileDetection';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
}

export default function MobileOptimizedLayout({ children }: MobileOptimizedLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const checkMobile = () => {
      setIsMobile(isMobileDevice());
      setScreenSize(getScreenSize());
    };

    // Check on mount
    checkMobile();

    // Check on resize
    window.addEventListener('resize', checkMobile);
    
    // Add mobile class to body
    try {
      if (isMobileDevice()) {
        document.body.classList.add('mobile-device');
      } else {
        document.body.classList.remove('mobile-device');
      }
    } catch (error) {
      // Ignore DOM manipulation errors during SSR
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Add screen size class to body
  useEffect(() => {
    if (typeof document === 'undefined') return;

    try {
      document.body.classList.remove('mobile', 'tablet', 'desktop');
      document.body.classList.add(screenSize);
    } catch (error) {
      // Ignore DOM manipulation errors during SSR
    }
  }, [screenSize]);

  // Add path-specific classes
  useEffect(() => {
    if (typeof document === 'undefined') return;

    try {
      const pathClass = pathname.replace(/\//g, '-').replace(/^-/, '') || 'home';
      document.body.classList.add(`page-${pathClass}`);
      
      return () => {
        document.body.classList.remove(`page-${pathClass}`);
      };
    } catch (error) {
      // Ignore DOM manipulation errors during SSR
    }
  }, [pathname]);

  return (
    <UnifiedErrorBoundary context="Mobile Layout" showNetworkStatus={true}>
      <div className={`mobile-optimized-layout ${isMobile ? 'mobile' : 'desktop'} ${screenSize}`}>
        <MobileNetworkStatus showWhenOnline={false} position="top" />
        {children}
      </div>
    </UnifiedErrorBoundary>
  );
}



