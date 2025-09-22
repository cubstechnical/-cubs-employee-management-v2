"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { MoreVertical } from "lucide-react";
import { useState } from "react";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface VisaStatisticsChartProps {
  data?: {
    categories: string[];
    valid: number[];
    expiring: number[];
    expired: number[];
    processing: number[];
  };
  loading?: boolean;
}

export default function VisaStatisticsChart({ data, loading = false }: VisaStatisticsChartProps) {
  const [selectedView, setSelectedView] = useState("bar");

  const options: ApexOptions = {
    colors: ["#10b981", "#f59e0b", "#ef4444", "#d3194f"],
    chart: {
      fontFamily: "Inter, sans-serif",
      type: selectedView as any,
      height: 350,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 8,
        borderRadiusApplication: "end",
      },
      pie: {
        donut: {
          size: "70%",
        },
      },
    },
    dataLabels: {
      enabled: selectedView === "pie",
      formatter: (val) => `${val}%`,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: data?.categories || ["H-1B", "L-1A", "L-1B", "E-3", "TN", "O-1"],
      labels: {
        style: {
          colors: "#6b7280",
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#6b7280",
          fontSize: "12px",
        },
        formatter: (value) => value.toLocaleString(),
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

  const series = selectedView === "pie" 
    ? [
        data?.valid.reduce((a, b) => a + b, 0) || 0,
        data?.expiring.reduce((a, b) => a + b, 0) || 0,
        data?.expired.reduce((a, b) => a + b, 0) || 0,
        data?.processing.reduce((a, b) => a + b, 0) || 0,
      ]
    : [
        {
          name: "Valid",
          data: data?.valid || [12, 19, 3, 5, 2, 3],
        },
        {
          name: "Expiring Soon",
          data: data?.expiring || [8, 15, 7, 12, 6, 9],
        },
        {
          name: "Expired",
          data: data?.expired || [2, 3, 1, 4, 1, 2],
        },
        {
          name: "Processing",
          data: data?.processing || [5, 8, 2, 6, 3, 4],
        },
      ];

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Visa Status Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Distribution of visa statuses across all employees</p>
          </div>
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="h-[350px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Visa Status Analytics</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Distribution of visa statuses across all employees</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setSelectedView("bar")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedView === "bar"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Bar
            </button>
            <button
              onClick={() => setSelectedView("pie")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedView === "pie"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Pie
            </button>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="h-[350px]">
        <ReactApexChart
          options={options}
          series={series}
          type={selectedView as any}
          height="100%"
        />
      </div>
    </div>
  );
}
