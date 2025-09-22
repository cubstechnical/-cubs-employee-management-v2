'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RoutePreloaderProps {
  routes?: string[];
}

/**
 * Preloads critical routes for smooth navigation
 * This helps reduce perceived load times when navigating between pages
 */
export function RoutePreloader({ routes = [] }: RoutePreloaderProps) {
  const router = useRouter();

  useEffect(() => {
    // Default critical routes to preload
    const criticalRoutes = [
      '/dashboard',
      '/employees',
      '/documents',
      '/notifications',
      '/settings',
      ...routes
    ];

    // Preload routes after initial page load
    const preloadTimer = setTimeout(() => {
      criticalRoutes.forEach(route => {
        router.prefetch(route);
      });
    }, 1000);

    return () => clearTimeout(preloadTimer);
  }, [router, routes]);

  return null; // This component doesn't render anything
}

export default RoutePreloader;
