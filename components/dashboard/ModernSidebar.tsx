"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CUBSLogo from "../ui/CUBSLogo";
import { cn } from "@/utils/cn";
import {
  LayoutDashboard,
  Users,
  FileText,
  Bell,
  Settings,
  BarChart3,
  Calendar,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react";

interface ModernSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    current: true,
  },
  {
    name: "Employees",
    href: "/employees",
    icon: Users,
    current: false,
  },
  {
    name: "Documents",
    href: "/documents",
    icon: FileText,
    current: false,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    current: false,
  },
  {
    name: "Calendar",
    href: "/calendar",
    icon: Calendar,
    current: false,
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
    current: false,
  },
  {
    name: "Security",
    href: "/security",
    icon: Shield,
    current: false,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    current: false,
  },
];

export default function ModernSidebar({ collapsed = false, onToggle }: ModernSidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn(
      "flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        {!collapsed && (
          <CUBSLogo size="md" showText={true} />
        )}
        {collapsed && (
          <CUBSLogo size="md" showText={false} />
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[#d3194f]/10 text-[#d3194f] dark:bg-[#d3194f]/20 dark:text-[#d3194f]"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-[#d3194f]" : "text-gray-500 dark:text-gray-400"
              )} />
              {!collapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button className={cn(
          "flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors",
          collapsed && "justify-center"
        )}>
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
