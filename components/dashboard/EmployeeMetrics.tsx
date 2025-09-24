"use client";
import React, { useMemo } from "react";
import { ArrowUpIcon, Users, FileText } from "lucide-react";

interface EmployeeMetricsProps {
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

const EmployeeMetricsComponent = ({ data, loading = false }: EmployeeMetricsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[...Array(2)].map((_, i) => (
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

  const metrics = useMemo(() => [
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
      subtitle: `${data?.activeEmployees || 0} active, ${data?.inactiveEmployees || 0} inactive`
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
      subtitle: `Across ${data?.totalCompanies || 0} companies`
    }
  ], [data?.totalEmployees, data?.employeeGrowth, data?.activeEmployees, data?.inactiveEmployees, data?.totalDocuments, data?.documentGrowth, data?.totalCompanies]);

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;

        return (
          <div
            key={index}
            className="relative overflow-hidden rounded-lg p-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
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
                <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">
                  <ArrowUpIcon className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                    {metric.change}%
                  </span>
                </div>
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

export const EmployeeMetrics = React.memo(EmployeeMetricsComponent);
EmployeeMetrics.displayName = 'EmployeeMetrics';

export default EmployeeMetrics;






