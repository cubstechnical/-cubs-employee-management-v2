"use client";
import React from "react";
import CUBSLogo from "../ui/CUBSLogo";
import { Bell, Search, Settings, User } from "lucide-react";

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
}

export default function DashboardHeader({
  title = "Employee Management Dashboard",
  subtitle = "Overview of your employee data and system activities",
  showSearch = true,
  showNotifications = true,
  showUserMenu = true
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-4">
        <CUBSLogo size="lg" showText={true} />
        <div className="hidden sm:block">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Search */}
        {showSearch && (
          <div className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search employees, documents..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d3194f] focus:border-transparent"
            />
          </div>
        )}

        {/* Notifications */}
        {showNotifications && (
          <button className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-[#d3194f] rounded-full"></span>
          </button>
        )}

        {/* Settings */}
        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <Settings className="h-5 w-5" />
        </button>

        {/* User Menu */}
        {showUserMenu && (
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">admin@cubstechnical.com</p>
            </div>
            <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-[#d3194f] to-[#b0173a] rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
