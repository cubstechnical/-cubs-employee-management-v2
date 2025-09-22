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
            // Retry failed requests 2 times
            retry: 2,
            // Don't refetch on window focus by default
            refetchOnWindowFocus: false,
            // Don't refetch on reconnect by default
            refetchOnReconnect: false,
            // Enable background refetch for better UX
            refetchOnMount: true,
            // Reduce network requests
            refetchInterval: false,
            // Optimize for performance
            notifyOnChangeProps: ['data', 'error'],
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
            // Optimize mutation performance
            networkMode: 'online',
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
