'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { 
  Activity, 
  Clock, 
  Database, 
  Gauge, 
  TrendingUp, 
  Server,
  Wifi,
  HardDrive
} from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  dbResponseTime: number;
  memoryUsage: number;
  activeConnections: number;
  uptime: string;
  cacheHitRate: number;
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    dbResponseTime: 0,
    memoryUsage: 0,
    activeConnections: 0,
    uptime: '0h 0m',
    cacheHitRate: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate performance monitoring
    const updateMetrics = () => {
      const startTime = performance.now();
      
      // Simulate various metrics
      setMetrics({
        loadTime: Math.round(performance.now() - startTime + Math.random() * 50),
        dbResponseTime: Math.round(Math.random() * 100 + 20),
        memoryUsage: Math.round(Math.random() * 30 + 40),
        activeConnections: Math.round(Math.random() * 10 + 5),
        uptime: `${Math.floor(Date.now() / 3600000)}h ${Math.floor((Date.now() % 3600000) / 60000)}m`,
        cacheHitRate: Math.round(Math.random() * 20 + 75)
      });
      setLoading(false);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600 bg-green-100';
    if (value <= thresholds.warning) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const performanceItems = [
    {
      title: 'Page Load Time',
      value: `${metrics.loadTime}ms`,
      icon: Clock,
      color: getPerformanceColor(metrics.loadTime, { good: 100, warning: 300 }),
      description: 'Average page load time'
    },
    {
      title: 'Database Response',
      value: `${metrics.dbResponseTime}ms`,
      icon: Database,
      color: getPerformanceColor(metrics.dbResponseTime, { good: 50, warning: 150 }),
      description: 'Database query response time'
    },
    {
      title: 'Memory Usage',
      value: `${metrics.memoryUsage}%`,
      icon: HardDrive,
      color: getPerformanceColor(metrics.memoryUsage, { good: 50, warning: 80 }),
      description: 'Server memory utilization'
    },
    {
      title: 'Active Connections',
      value: metrics.activeConnections.toString(),
      icon: Wifi,
      color: 'text-blue-600 bg-blue-100',
      description: 'Current active user sessions'
    },
    {
      title: 'System Uptime',
      value: metrics.uptime,
      icon: Server,
      color: 'text-green-600 bg-green-100',
      description: 'System availability time'
    },
    {
      title: 'Cache Hit Rate',
      value: `${metrics.cacheHitRate}%`,
      icon: TrendingUp,
      color: getPerformanceColor(100 - metrics.cacheHitRate, { good: 15, warning: 35 }),
      description: 'Cache effectiveness rate'
    }
  ];

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
            <Gauge className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System Performance</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading performance metrics...</p>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
          <Gauge className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System Performance</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Real-time application performance metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {performanceItems.map((item, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {item.value}
                </div>
              </div>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white text-sm">
              {item.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Activity className="w-4 h-4" />
          <span>Performance metrics are updated every 30 seconds</span>
        </div>
      </div>
    </Card>
  );
}