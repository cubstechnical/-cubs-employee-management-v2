'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, Calendar, User, Building2, FileText } from 'lucide-react';
import { useDebounce } from '@/hooks/usePerformance';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface SearchFilters {
  searchTerm: string;
  fileType: string;
  dateRange: string;
  employeeId: string;
  companyName: string;
}

interface DocumentSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  loading?: boolean;
  className?: string;
}

export default function DocumentSearch({ 
  onSearch, 
  onClear, 
  loading = false,
  className = '' 
}: DocumentSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    fileType: 'all',
    dateRange: 'all',
    employeeId: '',
    companyName: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);

  // Trigger search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm !== filters.searchTerm) {
      setFilters(prev => ({ ...prev, searchTerm: debouncedSearchTerm }));
    }
  }, [debouncedSearchTerm, filters.searchTerm]);

  // Trigger search when filters change
  useEffect(() => {
    onSearch(filters);
  }, [filters, onSearch]);

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({
      searchTerm: '',
      fileType: 'all',
      dateRange: 'all',
      employeeId: '',
      companyName: ''
    });
    onClear();
  }, [onClear]);

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== 'all'
  );

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Main Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search documents by name, employee, or company..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2"
            disabled={loading}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex items-center space-x-2"
              disabled={loading}
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* File Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>File Type</span>
              </label>
              <select
                value={filters.fileType}
                onChange={(e) => handleFilterChange('fileType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                disabled={loading}
              >
                <option value="all">All Types</option>
                <option value="pdf">PDF</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="document">Documents</option>
                <option value="archive">Archives</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Date Range</span>
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                disabled={loading}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>

            {/* Employee Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Employee ID</span>
              </label>
              <Input
                type="text"
                placeholder="Enter employee ID"
                value={filters.employeeId}
                onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Company Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span>Company</span>
              </label>
              <Input
                type="text"
                placeholder="Enter company name"
                value={filters.companyName}
                onChange={(e) => handleFilterChange('companyName', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
            {filters.searchTerm && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded text-xs">
                Search: "{filters.searchTerm}"
              </span>
            )}
            {filters.fileType !== 'all' && (
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded text-xs">
                Type: {filters.fileType}
              </span>
            )}
            {filters.dateRange !== 'all' && (
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded text-xs">
                Date: {filters.dateRange}
              </span>
            )}
            {filters.employeeId && (
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 rounded text-xs">
                Employee: {filters.employeeId}
              </span>
            )}
            {filters.companyName && (
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded text-xs">
                Company: {filters.companyName}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}



