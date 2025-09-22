"use client";
import React from "react";
import { MoreVertical, UserPlus, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { formatDate, timeAgo } from "@/utils/date";

interface RecentActivity {
  id: string;
  type: "employee_added" | "document_uploaded" | "visa_expiring" | "visa_approved" | "employee_updated";
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
  status?: "success" | "warning" | "error" | "info";
}

interface RecentEmployeeActivitiesProps {
  data?: RecentActivity[];
  loading?: boolean;
}

export default function RecentEmployeeActivities({ data, loading = false }: RecentEmployeeActivitiesProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "employee_added":
        return <UserPlus className="w-4 h-4 text-green-600" />;
      case "document_uploaded":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "visa_expiring":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "visa_approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <UserPlus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activities</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Latest employee and system activities</p>
          </div>
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activities = (data || [
    {
      id: "1",
      type: "employee_added" as const,
      title: "New Employee Added",
      description: "Sarah Johnson joined the Engineering team",
      timestamp: new Date().toISOString(),
      user: { name: "Sarah Johnson" },
      status: "success" as const,
    },
    {
      id: "2",
      type: "document_uploaded" as const,
      title: "Document Uploaded",
      description: "Visa application documents uploaded for Michael Chen",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      user: { name: "Michael Chen" },
      status: "info" as const,
    },
    {
      id: "3",
      type: "visa_expiring" as const,
      title: "Visa Expiring Soon",
      description: "John Smith's H-1B visa expires in 15 days",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      user: { name: "John Smith" },
      status: "warning" as const,
    },
  ]).slice(0, 3); // Limit to 3 activities

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activities</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Latest employee and system activities</p>
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex-shrink-0">
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {activity.title}
                </h4>
                {activity.status && (
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {activity.description}
              </p>
              {activity.user && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {activity.user.name}
                </p>
              )}
            </div>
            
            <div className="flex-shrink-0 text-right">
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {timeAgo(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button className="w-full text-sm text-[#d3194f] hover:text-[#e01a5a] font-medium transition-colors">
          View All Activities
        </button>
      </div>
    </div>
  );
}
