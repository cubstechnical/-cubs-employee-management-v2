"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { MoreVertical } from "lucide-react";
import { useState, useEffect, useMemo, useCallback, memo, useRef } from "react";
import { DashboardService, CompanyStats } from "@/lib/services/dashboard";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface EmployeeGrowthChartProps {
  data?: {
    companies: string[];
    employees: number[];
  };
  loading?: boolean;
}

const EmployeeGrowthChart = memo(function EmployeeGrowthChart({ data, loading = false }: EmployeeGrowthChartProps) {
  const [companyStats, setCompanyStats] = useState<CompanyStats[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  // Memoize the fallback data to prevent recreation on every render
  const fallbackData = useMemo(() => [
    { company_name: 'CUBS', employee_count: 45, document_count: 120, visa_expiring_count: 3 },
    { company_name: 'CUBS CONTRACTING', employee_count: 32, document_count: 85, visa_expiring_count: 2 },
    { company_name: 'AL MACEN', employee_count: 28, document_count: 70, visa_expiring_count: 1 },
    { company_name: 'RUKIN AL ASHBAL', employee_count: 15, document_count: 40, visa_expiring_count: 1 },
    { company_name: 'GOLDEN CUBS', employee_count: 12, document_count: 30, visa_expiring_count: 0 },
    { company_name: 'FLUID ENGINEERING', employee_count: 8, document_count: 20, visa_expiring_count: 0 },
    { company_name: 'AL HANA TOURS & TRAVELS', employee_count: 6, document_count: 15, visa_expiring_count: 0 },
    { company_name: 'AL ASHBAL AJMAN', employee_count: 4, document_count: 10, visa_expiring_count: 0 },
    { company_name: 'ASHBAL AL KHALEEJ', employee_count: 3, document_count: 8, visa_expiring_count: 0 },
  ], []);

  // Memoize the fetch function to prevent recreation
  const fetchCompanyStats = useCallback(async () => {
    try {
      setIsDataLoading(true);
      setError(null);
      
      const result = await DashboardService.getCompanyStats();
      if (result.error) {
        console.warn('Company stats service returned error:', result.error);
        setError(result.error);
      }
      
      if (result.stats && result.stats.length > 0) {
        // Convert DashboardService CompanyStats to the format expected by the chart
        setCompanyStats(result.stats);
        console.log('✅ Company stats loaded:', result.stats.length, 'companies');
      } else {
        console.log('⚠️ No company stats, using fallback data');
        setCompanyStats(fallbackData);
      }
    } catch (error) {
      console.error('Error fetching company stats:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setCompanyStats(fallbackData);
    } finally {
      setIsDataLoading(false);
    }
  }, [fallbackData]); // Include fallbackData dependency

  // Fetch real company data from Supabase - only once
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchCompanyStats();
    }
  }, [fetchCompanyStats]);

  const options: ApexOptions = useMemo(() => {
    
    return {
      colors: ["#d3194f"],
      chart: {
        fontFamily: "Inter, sans-serif",
        type: "bar",
        height: 280,
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
        },
        spacing: 8,
      },
    plotOptions: {
      bar: {
        horizontal: true, // Back to horizontal for better company name display
        barHeight: "60%",
        borderRadius: 8,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      labels: {
        style: {
          colors: "#6b7280",
          fontSize: "12px",
        },
        formatter: (value) => value.toLocaleString(),
      },
    },
    yaxis: {
      labels: {
        show: true,
        style: {
          colors: "#374151",
          fontSize: "10px",
          fontWeight: "600",
        },
        rotate: 0,
        offsetX: 10,
        maxWidth: 150,
        trim: false,
        formatter: function(value: any) {
          // Split long company names into multiple lines
          if (typeof value === 'string' && value.length > 15) {
            const words = value.split(' ');
            if (words.length > 2) {
              // Split into two lines for better readability
              const mid = Math.ceil(words.length / 2);
              const line1 = words.slice(0, mid).join(' ');
              const line2 = words.slice(mid).join(' ');
              return [line1, line2];
            }
          }
          return String(value);
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: (val) => val.toLocaleString(),
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      fontSize: "14px",
      fontFamily: "Inter, sans-serif",
      markers: {
        size: 8,
      },
    },
    grid: {
      borderColor: "#f3f4f6",
      strokeDashArray: 3,
    },
    };
  }, []);

  const series = useMemo(() => [
    {
      name: "Employees",
      data: companyStats.length > 0 ? companyStats.map(stat => ({
        x: stat.company_name,
        y: stat.employee_count
      })) : [{ x: 'Loading...', y: 0 }],
    },
  ], [companyStats]);

  // Debug logging (can be removed in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Chart loaded with', companyStats.length, 'companies');
  }


  if (loading || isDataLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Companies</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Number of employees per company</p>
          </div>
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="h-[280px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d3194f] mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading company data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Companies</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Number of employees per company</p>
          </div>
        </div>
        <div className="h-[280px] bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-sm text-red-600 dark:text-red-400">Error loading company data</p>
            <p className="text-xs text-red-500 dark:text-red-500 mt-1">{error}</p>
            <button 
              onClick={() => {
                hasFetched.current = false;
                fetchCompanyStats();
              }}
              className="text-xs text-red-600 hover:underline mt-2"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Companies</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Number of employees per company</p>
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-gray-400 mt-1">
              Debug: {companyStats.length} companies loaded
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => window.location.reload()}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Refresh data"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
      
        <div className="h-[280px]">
          {companyStats.length > 0 ? (
            <ReactApexChart
              options={options}
              series={series}
              type="bar"
              height="100%"
              key={`chart-${companyStats.length}`}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 mb-2">📊</div>
                <p className="text-sm text-gray-500">No company data available</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="text-xs text-[#d3194f] hover:underline mt-2"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
    </div>
  );
});

export default EmployeeGrowthChart;

