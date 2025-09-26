'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Optimized cache data for 2 minutes for fresher data
            staleTime: 2 * 60 * 1000,
            // Reduced cache time to 10 minutes for better memory usage
            gcTime: 10 * 60 * 1000,
            // Reduced retry attempts for faster failures
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors (client errors)
              if (error?.status >= 400 && error?.status < 500) return false;
              // Retry network errors only once for faster response
              return failureCount < 1;
            },
            // Mobile-optimized: Don't refetch on window focus by default
            refetchOnWindowFocus: false,
            // Mobile-optimized: Re-enabled for mobile reliability
            refetchOnReconnect: true,
            // Always refetch on mount for consistency
            refetchOnMount: 'always',
            // Reduce network requests - disabled by default
            refetchInterval: false,
            // Added isLoading for better UX
            notifyOnChangeProps: ['data', 'error', 'isLoading'],
            // Mobile optimization: reduce refetch interval to save data
            refetchIntervalInBackground: false,
            // Add network timeout for mobile connections
            networkMode: 'online',
          },
          mutations: {
            // Retry failed mutations once
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors
              if (error?.status >= 400 && error?.status < 500) return false;
              return failureCount < 1;
            },
            // Optimize mutation performance for mobile
            networkMode: 'online',
            // Add timeout for mobile network conditions
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
