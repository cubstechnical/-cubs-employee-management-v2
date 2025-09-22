"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { MoreVertical, TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface VisaComplianceScoreProps {
  score?: number;
  loading?: boolean;
}

export default function VisaComplianceScore({ score = 87, loading = false }: VisaComplianceScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!loading && score > 0) {
      // Reset animated score to 0 first
      setAnimatedScore(0);
      
      // Start animation after a brief delay
      const timer = setTimeout(() => {
        let startTime: number;
        const duration = 2000; // 2 seconds for smoother animation
        
        const animate = (currentTime: number) => {
          if (!startTime) startTime = currentTime;
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Use easeOutQuart for smoother animation
          const easeOutQuart = 1 - Math.pow(1 - progress, 4);
          const currentScore = Math.round(score * easeOutQuart);
          
          setAnimatedScore(currentScore);
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setAnimatedScore(score);
          }
        };
        
        requestAnimationFrame(animate);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [score, loading]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#10b981"; // Green
    if (score >= 75) return "#d3194f"; // CUBS Primary
    if (score >= 60) return "#f97316"; // Orange
    return "#ef4444"; // Red
  };

  const getScoreStatus = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Attention";
  };

  const options: ApexOptions = {
    colors: [getScoreColor(animatedScore)],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 280,
      sparkline: {
        enabled: true,
      },
      animations: {
        enabled: true,
        speed: 1000,
        animateGradually: {
          enabled: true,
          delay: 100
        },
        dynamicAnimation: {
          enabled: true,
          speed: 500
        }
      },
    },
    plotOptions: {
        radialBar: {
          startAngle: -85,
          endAngle: 85,
          hollow: {
            size: "75%",
          },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: "32px",
            fontWeight: "600",
            offsetY: -35,
            color: "#1D2939",
            formatter: function (val) {
              return Math.round(val || 0) + "%"; // Ensure no undefined values
            },
          },
        },
      },
    },
    fill: {
      type: "solid",
      colors: [getScoreColor(animatedScore)],
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Progress"],
  };

  const series = [animatedScore];

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <div className="flex justify-between">
            <div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
            </div>
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="relative mt-8">
            <div className="h-[330px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
              <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Monthly Compliance Target
            </h3>
            <p className="mt-1 font-normal text-gray-500 text-sm dark:text-gray-400">
              Visa compliance target for this month
            </p>
          </div>
          <div className="relative inline-block">
            <button onClick={toggleDropdown} className="dropdown-toggle">
              <MoreVertical className="w-5 h-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
            </button>
            {isOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <div className="py-1">
                  <button
                    onClick={closeDropdown}
                    className="flex w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    View Details
                  </button>
                  <button
                    onClick={closeDropdown}
                    className="flex w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="relative">
          <div className="max-h-[330px]">
            <ReactApexChart
              options={options}
              series={series}
              type="radialBar"
              height={330}
            />
          </div>

          <span className={`absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full px-3 py-1 text-xs font-medium ${
            score >= 90 
              ? "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-500"
              : score >= 75
              ? "bg-[#d3194f]/10 text-[#d3194f] dark:bg-[#d3194f]/20 dark:text-[#d3194f]"
              : score >= 60
              ? "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-500"
              : "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-500"
          }`}>
            {score >= 90 ? "+5%" : score >= 75 ? "+2%" : score >= 60 ? "-3%" : "-8%"}
          </span>
        </div>
        <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
          {score >= 90 
            ? "Excellent compliance rate! All visa requirements are being met efficiently."
            : score >= 75
            ? "Good compliance rate. Continue monitoring visa renewals and documentation."
            : score >= 60
            ? "Fair compliance rate. Some attention needed for visa management."
            : "Compliance needs immediate attention. Review visa statuses and renewals."
          }
        </p>
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        <div>
          <p className="mb-1 text-center text-gray-500 text-xs dark:text-gray-400 sm:text-sm">
            Target
          </p>
          <div className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            95%
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-xs dark:text-gray-400 sm:text-sm">
            Current
          </p>
          <div className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {score}%
            {score >= 90 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
          </div>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-xs dark:text-gray-400 sm:text-sm">
            Status
          </p>
          <div className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {getScoreStatus(score)}
            <div className={`w-2 h-2 rounded-full ${
              score >= 90 
                ? "bg-green-500" 
                : score >= 75
                ? "bg-[#d3194f]"
                : score >= 60
                ? "bg-orange-500"
                : "bg-red-500"
            }`}></div>
          </div>
        </div>
      </div>
    </div>
  );
}








