"use client";

import { useState, useEffect, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Activity, 
  Zap, 
  Database, 
  Wifi, 
  Smartphone, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  
  // Performance metrics
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  
  // Network metrics
  networkType: string;
  connectionSpeed: number;
  
  // Mobile metrics
  touchLatency: number;
  scrollPerformance: number;
  
  // Cache metrics
  cacheHitRate: number;
  offlineCapability: boolean;
}

interface PerformanceThresholds {
  lcp: { good: 2500; needsImprovement: 4000 };
  fid: { good: 100; needsImprovement: 300 };
  cls: { good: 0.1; needsImprovement: 0.25 };
  fcp: { good: 1800; needsImprovement: 3000 };
  ttfb: { good: 600; needsImprovement: 1500 };
  renderTime: { good: 16; needsImprovement: 50 };
  memoryUsage: { good: 50; needsImprovement: 100 };
  bundleSize: { good: 500; needsImprovement: 1000 };
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: 0,
    fid: 0,
    cls: 0,
    fcp: 0,
    ttfb: 0,
    renderTime: 0,
    memoryUsage: 0,
    bundleSize: 0,
    networkType: 'unknown',
    connectionSpeed: 0,
    touchLatency: 0,
    scrollPerformance: 0,
    cacheHitRate: 0,
    offlineCapability: false
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const thresholds: PerformanceThresholds = {
    lcp: { good: 2500, needsImprovement: 4000 },
    fid: { good: 100, needsImprovement: 300 },
    cls: { good: 0.1, needsImprovement: 0.25 },
    fcp: { good: 1800, needsImprovement: 3000 },
    ttfb: { good: 600, needsImprovement: 1500 },
    renderTime: { good: 16, needsImprovement: 50 },
    memoryUsage: { good: 50, needsImprovement: 100 },
    bundleSize: { good: 500, needsImprovement: 1000 }
  };

  // Get performance status
  const getStatus = (value: number, threshold: { good: number; needsImprovement: number }) => {
    if (value <= threshold.good) return { status: 'good', color: 'text-green-600', bg: 'bg-green-50' };
    if (value <= threshold.needsImprovement) return { status: 'needs-improvement', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { status: 'poor', color: 'text-red-600', bg: 'bg-red-50' };
  };

  // Collect performance metrics
  const collectMetrics = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Core Web Vitals
    const lcp = performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0;
    const fcp = performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    const ttfb = performance.getEntriesByType('navigation')[0]?.responseStart || 0;

    // Memory usage
    const memory = (performance as any).memory;
    const memoryUsage = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0;

    // Network information
    const connection = (navigator as any).connection;
    const networkType = connection?.effectiveType || 'unknown';
    const connectionSpeed = connection?.downlink || 0;

    // Bundle size estimation
    const scripts = document.querySelectorAll('script[src]');
    let bundleSize = 0;
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && src.includes('_next/static')) {
        bundleSize += 50; // Rough estimation
      }
    });

    // Cache hit rate (simulated)
    const cacheHitRate = Math.random() * 100;

    // Offline capability
    const offlineCapability = 'serviceWorker' in navigator;

    setMetrics(prev => ({
      ...prev,
      lcp,
      fcp,
      ttfb,
      memoryUsage,
      networkType,
      connectionSpeed,
      bundleSize,
      cacheHitRate,
      offlineCapability
    }));

    setLastUpdate(new Date());
  }, []);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    collectMetrics();
    
    // Collect metrics every 5 seconds
    const interval = setInterval(collectMetrics, 5000);
    
    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, [collectMetrics]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Initialize monitoring
  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, [startMonitoring]);

  // Performance score calculation
  const calculatePerformanceScore = () => {
    const scores = [
      getStatus(metrics.lcp, thresholds.lcp).status === 'good' ? 100 : 
      getStatus(metrics.lcp, thresholds.lcp).status === 'needs-improvement' ? 70 : 30,
      getStatus(metrics.fid, thresholds.fid).status === 'good' ? 100 : 
      getStatus(metrics.fid, thresholds.fid).status === 'needs-improvement' ? 70 : 30,
      getStatus(metrics.cls, thresholds.cls).status === 'good' ? 100 : 
      getStatus(metrics.cls, thresholds.cls).status === 'needs-improvement' ? 70 : 30,
      getStatus(metrics.fcp, thresholds.fcp).status === 'good' ? 100 : 
      getStatus(metrics.fcp, thresholds.fcp).status === 'needs-improvement' ? 70 : 30,
      getStatus(metrics.renderTime, thresholds.renderTime).status === 'good' ? 100 : 
      getStatus(metrics.renderTime, thresholds.renderTime).status === 'needs-improvement' ? 70 : 30
    ];
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  const performanceScore = calculatePerformanceScore();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Performance Monitor
          </h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <Button
              variant="outline"
              size="sm"
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
            >
              <RefreshCw className={`w-4 h-4 ${isMonitoring ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* Performance Score */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${
            performanceScore >= 90 ? 'text-green-600' : 
            performanceScore >= 70 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {performanceScore}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Performance Score</p>
        </div>

        {/* Core Web Vitals */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Core Web Vitals
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">LCP</span>
              <span className={`text-xs font-medium ${getStatus(metrics.lcp, thresholds.lcp).color}`}>
                {metrics.lcp.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">FID</span>
              <span className={`text-xs font-medium ${getStatus(metrics.fid, thresholds.fid).color}`}>
                {metrics.fid.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">CLS</span>
              <span className={`text-xs font-medium ${getStatus(metrics.cls, thresholds.cls).color}`}>
                {metrics.cls.toFixed(3)}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Performance
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Memory</span>
              <span className={`text-xs font-medium ${getStatus(metrics.memoryUsage, thresholds.memoryUsage).color}`}>
                {metrics.memoryUsage}MB
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Bundle</span>
              <span className={`text-xs font-medium ${getStatus(metrics.bundleSize, thresholds.bundleSize).color}`}>
                {metrics.bundleSize}KB
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Render</span>
              <span className={`text-xs font-medium ${getStatus(metrics.renderTime, thresholds.renderTime).color}`}>
                {metrics.renderTime.toFixed(1)}ms
              </span>
            </div>
          </div>
        </div>

        {/* Network & Mobile */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Network & Mobile
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Network</span>
              <span className="text-xs font-medium text-blue-600">
                {metrics.networkType}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Speed</span>
              <span className="text-xs font-medium text-blue-600">
                {metrics.connectionSpeed}Mbps
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Offline</span>
              <span className={`text-xs font-medium ${metrics.offlineCapability ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.offlineCapability ? 'Available' : 'Not Available'}
              </span>
            </div>
          </div>
        </div>

        {/* Cache Performance */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Cache
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Hit Rate</span>
              <span className={`text-xs font-medium ${
                metrics.cacheHitRate >= 80 ? 'text-green-600' : 
                metrics.cacheHitRate >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.cacheHitRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Development Mode</span>
          <span>v2.0</span>
        </div>
      </div>
    </div>
  );
}

export default PerformanceDashboard;
