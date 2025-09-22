"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { TrendingUp, Calendar, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface VisaExpiryTrendChartProps {
  data?: {
    months: string[];
    expiring: number[];
    expired: number[];
    renewed: number[];
  };
  loading?: boolean;
}

export default function VisaExpiryTrendChart({ data, loading = false }: VisaExpiryTrendChartProps) {
  const [animatedData, setAnimatedData] = useState({
    expiring: [0, 0, 0, 0, 0, 0],
    expired: [0, 0, 0, 0, 0, 0],
    renewed: [0, 0, 0, 0, 0, 0],
  });

  useEffect(() => {
    if (data && !loading) {
      // Animate the data loading
      const animateData = (targetData: number[], key: keyof typeof animatedData) => {
        const steps = 20;
        const stepSize = targetData.map(val => val / steps);
        let currentStep = 0;

        const interval = setInterval(() => {
          currentStep++;
          setAnimatedData(prev => ({
            ...prev,
            [key]: prev[key].map((val, index) => val + stepSize[index])
          }));

          if (currentStep >= steps) {
            clearInterval(interval);
            setAnimatedData(prev => ({
              ...prev,
              [key]: targetData
            }));
          }
        }, 50);

        return interval;
      };

      // Animate each series with a slight delay
      const intervals = [
        animateData(data.expiring, 'expiring'),
        setTimeout(() => animateData(data.expired, 'expired'), 200),
        setTimeout(() => animateData(data.renewed, 'renewed'), 400),
      ];

      return () => {
        intervals.forEach(interval => {
          if (typeof interval === 'number') {
            clearTimeout(interval);
          } else {
            clearInterval(interval);
          }
        });
      };
    }
  }, [data, loading]);

  const options: ApexOptions = {
    colors: ["#d3194f", "#ef4444", "#10b981"],
    chart: {
      fontFamily: "Inter, sans-serif",
      type: "area",
      height: 350,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: data?.months || ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      labels: {
        style: {
          colors: "#6b7280",
          fontSize: "12px",
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
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
    tooltip: {
      y: {
        formatter: (val) => val.toLocaleString(),
      },
      theme: 'dark',
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
      xaxis: {
        lines: {
          show: false,
        },
      },
    },
  };

  const series = [
    {
      name: "Expiring Soon",
      data: animatedData.expiring,
    },
    {
      name: "Expired",
      data: animatedData.expired,
    },
    {
      name: "Renewed",
      data: animatedData.renewed,
    },
  ];

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Visa Expiry Trends</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Monthly visa status changes and renewals</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="h-[350px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Visa Expiry Trends</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Monthly visa status changes and renewals</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <TrendingUp className="w-4 h-4 text-[#d3194f]" />
            <span className="text-gray-600 dark:text-gray-400">
              {data?.expiring ? `+${data.expiring[data.expiring.length - 1] || 0}` : '+0'} this month
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span className="text-gray-600 dark:text-gray-400">
              {data?.expiring ? data.expiring.reduce((a, b) => a + b, 0) : 0} expiring
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-gray-600 dark:text-gray-400">
              {data?.expired ? data.expired.reduce((a, b) => a + b, 0) : 0} expired
            </span>
          </div>
        </div>
      </div>
      
      <div className="h-[350px]">
        <ReactApexChart
          options={options}
          series={series}
          type="area"
          height="100%"
        />
      </div>
    </div>
  );
}
