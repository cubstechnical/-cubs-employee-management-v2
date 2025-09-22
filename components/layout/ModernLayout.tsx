"use client";
import React, { useState } from "react";
import ModernSidebar from "../dashboard/ModernSidebar";
import DashboardHeader from "../dashboard/DashboardHeader";
import { cn } from "@/utils/cn";

interface ModernLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function ModernLayout({ 
  children, 
  title,
  subtitle 
}: ModernLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-300",
          sidebarCollapsed ? "translate-x-0" : "translate-x-0"
        )}>
          <ModernSidebar 
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Main Content */}
        <div className={cn(
          "flex-1 transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}>
          <div className="p-6">
            {/* Header */}
            <DashboardHeader 
              title={title}
              subtitle={subtitle}
            />
            
            {/* Content */}
            <main>
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
