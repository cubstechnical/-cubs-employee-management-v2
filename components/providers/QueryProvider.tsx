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
            // Cache data for 10 minutes by default (increased for better performance)
            staleTime: 10 * 60 * 1000,
            // Keep data in cache for 30 minutes (increased for better performance)
            gcTime: 30 * 60 * 1000,
            // Retry failed requests 2 times, with exponential backoff
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors (client errors)
              if (error?.status >= 400 && error?.status < 500) return false;
              // Retry network errors up to 2 times
              return failureCount < 2;
            },
            // Mobile-optimized: Don't refetch on window focus by default
            refetchOnWindowFocus: false,
            // Mobile-optimized: Don't refetch on reconnect by default
            refetchOnReconnect: false,
            // Enable background refetch for better UX
            refetchOnMount: true,
            // Reduce network requests - disabled by default
            refetchInterval: false,
            // Optimize for performance and mobile data usage
            notifyOnChangeProps: ['data', 'error'],
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
