"use client";
import React from "react";
import { ArrowUpIcon, ArrowDownIcon, Users, FileText, AlertTriangle, CheckCircle, Building, Calendar } from "lucide-react";

interface EnhancedDashboardMetricsProps {
  data?: {
    totalEmployees: number;
    totalDocuments: number;
    employeeGrowth: number;
    documentGrowth: number;
    activeEmployees: number;
    inactiveEmployees: number;
    visaExpiringSoon: number;
    visaExpired: number;
    visaValid: number;
    totalCompanies: number;
  };
  loading?: boolean;
}

export const EnhancedDashboardMetrics = ({ data, loading = false }: EnhancedDashboardMetricsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="relative overflow-hidden rounded-xl p-3 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900"></div>
            <div className="relative">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg mb-3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: "TOTAL EMPLOYEES",
      value: data?.totalEmployees?.toLocaleString() || "0",
      change: data?.employeeGrowth || 0,
      icon: Users,
      gradient: "from-[#d3194f]/20 via-[#d3194f]/10 to-[#d3194f]/5",
      iconBg: "bg-[#d3194f]/20",
      iconColor: "text-[#d3194f]",
      valueColor: "text-[#d3194f]",
      accentColor: "bg-[#d3194f]/30",
      subtitle: `${data?.activeEmployees || 0} active`,
      trend: (data?.employeeGrowth ?? 0) >= 0 ? 'up' : 'down'
    },
    {
      label: "TOTAL DOCUMENTS",
      value: data?.totalDocuments?.toLocaleString() || "0",
      change: data?.documentGrowth || 0,
      icon: FileText,
      gradient: "from-green-200/50 via-green-100/30 to-green-50/20",
      iconBg: "bg-green-500/20",
      iconColor: "text-green-600",
      valueColor: "text-green-600",
      accentColor: "bg-green-500/30",
      subtitle: `${data?.totalCompanies || 0} companies`,
      trend: (data?.documentGrowth ?? 0) >= 0 ? 'up' : 'down'
    },
    {
      label: "VISA EXPIRING",
      value: data?.visaExpiringSoon?.toLocaleString() || "0",
      change: 0,
      icon: AlertTriangle,
      gradient: "from-orange-200/50 via-orange-100/30 to-orange-50/20",
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-600",
      valueColor: "text-orange-600",
      accentColor: "bg-orange-500/30",
      subtitle: "Next 30 days",
      trend: 'neutral'
    },
    {
      label: "VISA COMPLIANCE",
      value: data?.visaValid?.toLocaleString() || "0",
      change: 0,
      icon: CheckCircle,
      gradient: "from-blue-200/50 via-blue-100/30 to-blue-50/20",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-600",
      valueColor: "text-blue-600",
      accentColor: "bg-blue-500/30",
      subtitle: `${data?.visaExpired || 0} expired`,
      trend: 'neutral'
    }
  ];

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') {
      return <ArrowUpIcon className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />;
    } else if (trend === 'down') {
      return <ArrowDownIcon className="w-2.5 h-2.5 text-red-600 dark:text-red-400" />;
    }
    return null;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'up') {
      return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400";
    } else if (trend === 'down') {
      return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
    }
    return "bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400";
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;

        return (
          <div
            key={index}
            className="relative overflow-hidden rounded-lg p-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient}`}></div>
            
            {/* Content */}
            <div className="relative">
              {/* Header with Icon and Trend */}
              <div className="flex items-start justify-between mb-2">
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${metric.iconBg}`}>
                  <Icon className={`w-4 h-4 ${metric.iconColor}`} />
                </div>
                {metric.change > 0 && (
                  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${getTrendColor(metric.trend)}`}>
                    {getTrendIcon(metric.trend)}
                    <span className="text-xs font-semibold">
                      {metric.change}%
                    </span>
                  </div>
                )}
              </div>

              {/* Label */}
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                {metric.label}
              </p>

              {/* Value */}
              <p className={`text-lg font-bold ${metric.valueColor} mb-1`}>
                {metric.value}
              </p>

              {/* Subtitle */}
              {metric.subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {metric.subtitle}
                </p>
              )}

              {/* Status Indicators */}
              <div className="flex items-center gap-1.5 mb-1">
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Active</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Live</span>
                </div>
              </div>

              {/* Timestamp */}
              <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
                Updated 2 min ago
              </p>

              {/* Bottom Accent */}
              <div className={`h-0.5 w-full rounded-full ${metric.accentColor} mt-1`}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
