import React, { useEffect, useRef } from 'react';

// Performance utilities for monitoring and optimization
export const usePerformanceMonitor = (componentName: string) => {
  const renderCountRef = useRef(0);
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    renderCountRef.current += 1;

    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered: ${renderCountRef.current} times`);
    }

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTimeRef.current;

      if (renderTime > 100) {
        console.warn(`${componentName} took ${renderTime.toFixed(2)}ms to render`);
      }
    };
  }, [componentName]);

  return { renderCount: renderCountRef.current };
};

export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  const duration = end - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`${name} took ${duration.toFixed(2)}ms`);
  }

  return duration;
};

// Performance monitoring hook with React.memo integration
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  const WrappedComponent = React.memo(Component);

  const MonitoredComponent = (props: P) => {
    const renderCountRef = useRef(0);
    const startTimeRef = useRef(performance.now());

    useEffect(() => {
      renderCountRef.current += 1;

      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTimeRef.current;

        if (renderTime > 50) {
          console.warn(`${componentName} took ${renderTime.toFixed(2)}ms to render (render #${renderCountRef.current})`);
        }
      };
    });

    return <WrappedComponent {...props} />;
  };

  MonitoredComponent.displayName = `withPerformanceMonitoring(${componentName})`;

  return MonitoredComponent;
};
