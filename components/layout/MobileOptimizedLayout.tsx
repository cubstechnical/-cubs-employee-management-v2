'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { isMobileDevice, getScreenSize } from '@/utils/mobileDetection';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
}

export default function MobileOptimizedLayout({ children }: MobileOptimizedLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice());
      setScreenSize(getScreenSize());
    };

    // Check on mount
    checkMobile();

    // Check on resize
    window.addEventListener('resize', checkMobile);
    
    // Add mobile class to body
    if (isMobileDevice()) {
      document.body.classList.add('mobile-device');
    } else {
      document.body.classList.remove('mobile-device');
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Add screen size class to body
  useEffect(() => {
    document.body.classList.remove('mobile', 'tablet', 'desktop');
    document.body.classList.add(screenSize);
  }, [screenSize]);

  // Add path-specific classes
  useEffect(() => {
    const pathClass = pathname.replace(/\//g, '-').replace(/^-/, '') || 'home';
    document.body.classList.add(`page-${pathClass}`);
    
    return () => {
      document.body.classList.remove(`page-${pathClass}`);
    };
  }, [pathname]);

  return (
    <div className={`mobile-optimized-layout ${isMobile ? 'mobile' : 'desktop'} ${screenSize}`}>
      {children}
    </div>
  );
}


