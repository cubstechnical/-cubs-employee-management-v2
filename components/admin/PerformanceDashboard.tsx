'use client';

import { useState, useEffect, useMemo } from 'react';
import { Monitor, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

interface PerformanceIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  value: number;
  recommendation: string;
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Simulate performance metrics for demo
  useEffect(() => {
    const simulateMetrics = () => {
      const mockMetrics: PerformanceMetrics = {
        loadTime: Math.random() * 2000 + 800,
        firstContentfulPaint: Math.random() * 1500 + 600,
        largestContentfulPaint: Math.random() * 3000 + 1200,
        totalBlockingTime: Math.random() * 400 + 100,
        cumulativeLayoutShift: Math.random() * 0.2 + 0.01,
        timeToInteractive: Math.random() * 2500 + 1500
      };
      setMetrics(mockMetrics);
    };

    simulateMetrics();
    const interval = setInterval(simulateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const performanceScore = useMemo(() => {
    if (!metrics) return 0;
    
    let score = 100;
    
    // LCP scoring
    if (metrics.largestContentfulPaint > 4000) score -= 30;
    else if (metrics.largestContentfulPaint > 2500) score -= 15;
    
    // FCP scoring
    if (metrics.firstContentfulPaint > 3000) score -= 20;
    else if (metrics.firstContentfulPaint > 1800) score -= 10;
    
    // TBT scoring
    if (metrics.totalBlockingTime > 600) score -= 20;
    else if (metrics.totalBlockingTime > 300) score -= 10;
    
    // CLS scoring
    if (metrics.cumulativeLayoutShift > 0.25) score -= 20;
    else if (metrics.cumulativeLayoutShift > 0.1) score -= 10;
    
    return Math.max(0, score);
  }, [metrics]);

  const performanceIssues = useMemo(() => {
    if (!metrics) return [];
    
    const issues: PerformanceIssue[] = [];
    
    if (metrics.largestContentfulPaint > 2500) {
      issues.push({
        type: 'LCP',
        severity: metrics.largestContentfulPaint > 4000 ? 'high' : 'medium',
        message: 'Largest Contentful Paint is too slow',
        value: metrics.largestContentfulPaint,
        recommendation: 'Optimize images, reduce server response time, eliminate render-blocking resources'
      });
    }
    
    if (metrics.firstContentfulPaint > 1800) {
      issues.push({
        type: 'FCP',
        severity: metrics.firstContentfulPaint > 3000 ? 'high' : 'medium',
        message: 'First Contentful Paint is too slow',
        value: metrics.firstContentfulPaint,
        recommendation: 'Minimize critical resources, optimize CSS delivery, reduce server response time'
      });
    }
    
    if (metrics.totalBlockingTime > 300) {
      issues.push({
        type: 'TBT',
        severity: metrics.totalBlockingTime > 600 ? 'high' : 'medium',
        message: 'Total Blocking Time is too high',
        value: metrics.totalBlockingTime,
        recommendation: 'Break up long tasks, optimize JavaScript execution, use web workers'
      });
    }
    
    if (metrics.cumulativeLayoutShift > 0.1) {
      issues.push({
        type: 'CLS',
        severity: metrics.cumulativeLayoutShift > 0.25 ? 'high' : 'medium',
        message: 'Cumulative Layout Shift is too high',
        value: metrics.cumulativeLayoutShift,
        recommendation: 'Set explicit dimensions for images and media, avoid inserting content above existing content'
      });
    }
    
    return issues;
  }, [metrics]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (!metrics) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-48"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-500 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
            <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Dashboard</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Real-time performance monitoring</p>
          </div>
        </div>
        
        {/* Performance Score */}
        <div className={`text-center px-4 py-2 rounded-xl ${getScoreBgColor(performanceScore)}`}>
          <div className={`text-2xl font-bold ${getScoreColor(performanceScore)}`}>
            {performanceScore}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Score</div>
        </div>
      </div>

      {/* Core Web Vitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* LCP */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">LCP</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              metrics.largestContentfulPaint <= 2500 ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
              metrics.largestContentfulPaint <= 4000 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
              'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {metrics.largestContentfulPaint <= 2500 ? 'Good' : metrics.largestContentfulPaint <= 4000 ? 'Needs Improvement' : 'Poor'}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {metrics.largestContentfulPaint.toFixed(0)}ms
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Target: &lt;2.5s</div>
        </div>

        {/* FCP */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">FCP</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              metrics.firstContentfulPaint <= 1800 ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
              metrics.firstContentfulPaint <= 3000 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
              'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {metrics.firstContentfulPaint <= 1800 ? 'Good' : metrics.firstContentfulPaint <= 3000 ? 'Needs Improvement' : 'Poor'}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {metrics.firstContentfulPaint.toFixed(0)}ms
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Target: &lt;1.8s</div>
        </div>

        {/* TBT */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">TBT</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              metrics.totalBlockingTime <= 300 ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
              metrics.totalBlockingTime <= 600 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
              'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {metrics.totalBlockingTime <= 300 ? 'Good' : metrics.totalBlockingTime <= 600 ? 'Needs Improvement' : 'Poor'}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {metrics.totalBlockingTime.toFixed(0)}ms
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Target: &lt;300ms</div>
        </div>

        {/* CLS */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CLS</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              metrics.cumulativeLayoutShift <= 0.1 ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
              metrics.cumulativeLayoutShift <= 0.25 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
              'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {metrics.cumulativeLayoutShift <= 0.1 ? 'Good' : metrics.cumulativeLayoutShift <= 0.25 ? 'Needs Improvement' : 'Poor'}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {metrics.cumulativeLayoutShift.toFixed(3)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Target: &lt;0.1</div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Load Time</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {metrics.loadTime.toFixed(0)}ms
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time to Interactive</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {metrics.timeToInteractive.toFixed(0)}ms
          </div>
        </div>
      </div>

      {/* Performance Issues */}
      {performanceIssues.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span>Performance Issues Found</span>
          </h4>
          
          {performanceIssues.map((issue, index) => (
            <div key={index} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(issue.severity)}`}>
                    {issue.severity.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{issue.type}</span>
                </div>
                <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                  {issue.value.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{issue.message}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Recommendation:</strong> {issue.recommendation}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Optimization Tips */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center space-x-2">
          <TrendingUp className="w-4 h-4" />
          <span>Quick Optimization Tips</span>
        </h4>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Use Next.js Image component for optimized images</li>
          <li>• Implement lazy loading for below-the-fold content</li>
          <li>• Use React.memo and useCallback to prevent unnecessary re-renders</li>
          <li>• Enable gzip compression on your server</li>
          <li>• Consider using a CDN for static assets</li>
        </ul>
      </div>
    </div>
  );
}
