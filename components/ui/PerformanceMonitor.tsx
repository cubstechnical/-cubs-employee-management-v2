'use client';

import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  X,
  Zap,
  Database,
  HardDrive
} from 'lucide-react';
import { getPerformanceReport, clearPerformanceData, logPerformanceReport } from '@/utils/performance';

interface PerformanceMonitorProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  isVisible = false, 
  onClose 
}) => {
  const [report, setReport] = useState(getPerformanceReport());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setReport(getPerformanceReport());
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isVisible]);

  const handleRefresh = () => {
    setReport(getPerformanceReport());
  };

  const handleClear = () => {
    clearPerformanceData();
    setReport(getPerformanceReport());
  };

  const handleLogReport = () => {
    logPerformanceReport();
  };

  if (!isVisible) return null;

  const getPerformanceColor = (duration: number) => {
    if (duration > 2000) return 'text-red-600';
    if (duration > 1000) return 'text-orange-600';
    if (duration > 500) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getCacheColor = (rate: number) => {
    if (rate > 0.7) return 'text-green-600';
    if (rate > 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-[#d3194f]" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Performance Monitor
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleRefresh}
                variant="ghost"
                size="sm"
                className="p-1"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleLogReport}
                variant="ghost"
                size="sm"
                className="p-1"
              >
                <Database className="w-4 h-4" />
              </Button>
              {onClose && (
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  className="p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Avg Duration
                </span>
              </div>
              <div className={`text-lg font-bold ${getPerformanceColor(report.averageDuration)}`}>
                {report.averageDuration.toFixed(0)}ms
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <HardDrive className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cache Hit
                </span>
              </div>
              <div className={`text-lg font-bold ${getCacheColor(report.cacheHitRate)}`}>
                {(report.cacheHitRate * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Operations Count */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Operations
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {report.totalOperations}
            </span>
          </div>

          {/* Slow Operations Warning */}
          {report.slowOperations.length > 0 && (
            <div className="flex items-center space-x-2 mb-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-700 dark:text-orange-300">
                {report.slowOperations.length} slow operations detected
              </span>
            </div>
          )}

          {/* Expandable Details */}
          <div className="space-y-2">
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {isExpanded ? 'Hide Details' : 'Show Details'}
            </Button>

            {isExpanded && (
              <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                {/* Slow Operations List */}
                {report.slowOperations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Slow Operations:
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {report.slowOperations.slice(0, 5).map((op, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400 truncate">
                            {op.operation}
                          </span>
                          <span className={`font-medium ${getPerformanceColor(op.duration)}`}>
                            {op.duration.toFixed(0)}ms
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {report.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Recommendations:
                    </h4>
                    <ul className="space-y-1">
                      {report.recommendations.map((rec, index) => (
                        <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start space-x-1">
                          <Zap className="w-3 h-3 text-[#d3194f] mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    onClick={handleClear}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Clear Data
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

// Hook to use performance monitor
export const usePerformanceMonitor = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggle = () => setIsVisible(!isVisible);
  const show = () => setIsVisible(true);
  const hide = () => setIsVisible(false);

  return {
    isVisible,
    toggle,
    show,
    hide,
    PerformanceMonitorComponent: () => (
      <PerformanceMonitor 
        isVisible={isVisible} 
        onClose={hide} 
      />
    )
  };
};

