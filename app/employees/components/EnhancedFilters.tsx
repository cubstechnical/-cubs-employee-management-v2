'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { 
  Building, 
  Filter, 
  Calendar,
  Shield,
  ChevronDown,
  X
} from 'lucide-react';
import { FilterState, EmployeeCounts, buttonVariants } from '../types';

interface EnhancedFiltersProps {
  filterState: FilterState;
  employeeCounts: EmployeeCounts;
  companies: string[];
  onStatusChange: (status: FilterState['status']) => void;
  onCompanyChange: (company: string) => void;
  onDateRangeChange: (dateRange: FilterState['dateRange']) => void;
  onVisaStatusChange: (visaStatus: FilterState['visaStatus']) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const EnhancedFilters = memo(({
  filterState,
  employeeCounts,
  companies,
  onStatusChange,
  onCompanyChange,
  onDateRangeChange,
  onVisaStatusChange,
  onClearFilters,
  hasActiveFilters
}: EnhancedFiltersProps) => {
  return (
    <div className="space-y-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filters
          </h3>
        </div>
        {hasActiveFilters && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClearFilters}
            className="text-xs text-[#d3194f] hover:text-[#b0173a] flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear all
          </motion.button>
        )}
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Company Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Building className="w-3 h-3" />
            Company
          </label>
          <div className="relative">
            <select
              value={filterState.company}
              onChange={(e) => onCompanyChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d3194f]/20 focus:border-[#d3194f] transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="all">All Companies</option>
              {companies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Status
          </label>
          <div className="flex gap-1">
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                variant={filterState.status === 'all' ? 'primary' : 'outline'}
                onClick={() => onStatusChange('all')}
                size="sm"
                className="text-xs"
              >
                All ({employeeCounts.all})
              </Button>
            </motion.div>
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                variant={filterState.status === 'active' ? 'primary' : 'outline'}
                onClick={() => onStatusChange('active')}
                size="sm"
                className="text-xs"
              >
                Active ({employeeCounts.active})
              </Button>
            </motion.div>
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                variant={filterState.status === 'inactive' ? 'primary' : 'outline'}
                onClick={() => onStatusChange('inactive')}
                size="sm"
                className="text-xs"
              >
                Inactive ({employeeCounts.inactive})
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Visa Status Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Visa Status
          </label>
          <div className="relative">
            <select
              value={filterState.visaStatus}
              onChange={(e) => onVisaStatusChange(e.target.value as FilterState['visaStatus'])}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d3194f]/20 focus:border-[#d3194f] transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="all">All Visa Status</option>
              <option value="valid">Valid</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Visa Expiry
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={filterState.dateRange?.start || ''}
              onChange={(e) => onDateRangeChange({
                start: e.target.value,
                end: filterState.dateRange?.end || ''
              })}
              className="flex-1 px-2 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d3194f]/20 focus:border-[#d3194f] transition-all duration-200"
              placeholder="Start date"
            />
            <input
              type="date"
              value={filterState.dateRange?.end || ''}
              onChange={(e) => onDateRangeChange({
                start: filterState.dateRange?.start || '',
                end: e.target.value
              })}
              className="flex-1 px-2 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d3194f]/20 focus:border-[#d3194f] transition-all duration-200"
              placeholder="End date"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 p-3 bg-gradient-to-r from-[#d3194f]/5 to-[#b0173a]/5 rounded-lg border border-[#d3194f]/20"
        >
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Active filters:
          </span>
          {filterState.status !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#d3194f]/10 text-[#d3194f]">
              Status: {filterState.status}
            </span>
          )}
          {filterState.company !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#d3194f]/10 text-[#d3194f]">
              Company: {filterState.company}
            </span>
          )}
          {filterState.visaStatus !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#d3194f]/10 text-[#d3194f]">
              Visa: {filterState.visaStatus}
            </span>
          )}
          {filterState.dateRange && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#d3194f]/10 text-[#d3194f]">
              Date range: {filterState.dateRange.start} - {filterState.dateRange.end}
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
});

EnhancedFilters.displayName = 'EnhancedFilters';

export default EnhancedFilters;


