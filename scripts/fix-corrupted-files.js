#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing corrupted files...');

// Fix EnhancedFilters.tsx
const enhancedFiltersContent = `'use client';

import React, { memo } from 'react';
import Button from '@/components/ui/Button';
import { 
  Building, 
  Filter, 
  Calendar,
  X,
  Check
} from 'lucide-react';
import { FilterState } from '../types';

interface EnhancedFiltersProps {
  filterState: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  companies: string[];
  statuses: string[];
}

const EnhancedFilters = memo(({
  filterState,
  onFilterChange,
  onClearFilters,
  companies,
  statuses
}: EnhancedFiltersProps) => {
  const hasActiveFilters = 
    filterState.status !== 'all' ||
    filterState.company !== 'all' ||
    filterState.visaStatus !== 'all' ||
    filterState.dateRange;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[#d3194f]" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filters
          </h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <select
            value={filterState.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d3194f] focus:border-transparent"
          >
            <option value="all">All Status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Company Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Company
          </label>
          <select
            value={filterState.company}
            onChange={(e) => onFilterChange({ company: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d3194f] focus:border-transparent"
          >
            <option value="all">All Companies</option>
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>

        {/* Visa Status Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Visa Status
          </label>
          <select
            value={filterState.visaStatus}
            onChange={(e) => onFilterChange({ visaStatus: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d3194f] focus:border-transparent"
          >
            <option value="all">All Visa Status</option>
            <option value="valid">Valid</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Date Range
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={filterState.dateRange?.from || ''}
              onChange={(e) => onFilterChange({ 
                dateRange: { 
                  ...filterState.dateRange, 
                  from: e.target.value 
                } 
              })}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d3194f] focus:border-transparent"
            />
            <input
              type="date"
              value={filterState.dateRange?.to || ''}
              onChange={(e) => onFilterChange({ 
                dateRange: { 
                  ...filterState.dateRange, 
                  to: e.target.value 
                } 
              })}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d3194f] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2 p-3 bg-gradient-to-r from-[#d3194f]/5 to-[#b0173a]/5 rounded-lg border border-[#d3194f]/20">
            {filterState.status !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#d3194f]/10 text-[#d3194f] text-xs rounded-full">
                Status: {filterState.status}
                <button
                  onClick={() => onFilterChange({ status: 'all' })}
                  className="ml-1 hover:bg-[#d3194f]/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterState.company !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#d3194f]/10 text-[#d3194f] text-xs rounded-full">
                Company: {filterState.company}
                <button
                  onClick={() => onFilterChange({ company: 'all' })}
                  className="ml-1 hover:bg-[#d3194f]/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterState.visaStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#d3194f]/10 text-[#d3194f] text-xs rounded-full">
                Visa: {filterState.visaStatus}
                <button
                  onClick={() => onFilterChange({ visaStatus: 'all' })}
                  className="ml-1 hover:bg-[#d3194f]/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterState.dateRange && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#d3194f]/10 text-[#d3194f] text-xs rounded-full">
                Date: {filterState.dateRange.from} - {filterState.dateRange.to}
                <button
                  onClick={() => onFilterChange({ dateRange: null })}
                  className="ml-1 hover:bg-[#d3194f]/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

EnhancedFilters.displayName = 'EnhancedFilters';

export default EnhancedFilters;`;

fs.writeFileSync('app/employees/components/EnhancedFilters.tsx', enhancedFiltersContent);
console.log('✅ Fixed: EnhancedFilters.tsx');

// Fix EnhancedPagination.tsx
const enhancedPaginationContent = `'use client';

import React, { memo } from 'react';
import Button from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PaginationState, buttonVariants } from '../types';

interface EnhancedPaginationProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  totalItems: number;
  isLoading?: boolean;
}

const EnhancedPagination = memo(({
  pagination,
  onPageChange,
  onPageSizeChange,
  totalItems,
  isLoading = false
}: EnhancedPaginationProps) => {
  const totalPages = Math.ceil(totalItems / pagination.pageSize);
  const startItem = (pagination.currentPage - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.currentPage * pagination.pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, pagination.currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={pagination.currentPage === 1 || isLoading}
            className="p-2"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1 || isLoading}
            className="p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-1">
          {pageNumbers.map((page) => (
            <Button
              key={page}
              variant={page === pagination.currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
              disabled={isLoading}
              className="min-w-[40px]"
            >
              {page}
            </Button>
          ))}
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === totalPages || isLoading}
            className="p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={pagination.currentPage === totalPages || isLoading}
            className="p-2"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">Show:</span>
        <select
          value={pagination.pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          disabled={isLoading}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d3194f] focus:border-transparent"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  );
});

EnhancedPagination.displayName = 'EnhancedPagination';

export default EnhancedPagination;`;

fs.writeFileSync('app/employees/components/EnhancedPagination.tsx', enhancedPaginationContent);
console.log('✅ Fixed: EnhancedPagination.tsx');

// Fix EnhancedSearch.tsx
const enhancedSearchContent = `'use client';

import React, { memo, useRef, useEffect } from 'react';
import Input from '@/components/ui/Input';
import { Search, X } from 'lucide-react';
import { Employee, SearchState, suggestionVariants } from '../types';

interface EnhancedSearchProps {
  searchState: SearchState;
  onSearchChange: (query: string) => void;
  onSuggestionSelect: (suggestion: Employee) => void;
  onClearSearch: () => void;
  suggestions: Employee[];
  isLoading?: boolean;
}

const EnhancedSearch = memo(({
  searchState,
  onSearchChange,
  onSuggestionSelect,
  onClearSearch,
  suggestions,
  isLoading = false
}: EnhancedSearchProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchState.isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchState.isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClearSearch();
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search employees..."
          value={searchState.query}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
        />
        {searchState.query && (
          <button
            onClick={onClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Enhanced Search Suggestions */}
      {searchState.isOpen && searchState.query && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#d3194f] mx-auto"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => onSuggestionSelect(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {suggestion.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {suggestion.employee_id} • {suggestion.company_name}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {suggestion.trade}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No results found</p>
            </div>
          )}
        </div>
      )}

      {/* Search Results Summary */}
      {searchState.query && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {suggestions.length > 0 ? (
            <span>Found {suggestions.length} result{suggestions.length !== 1 ? 's' : ''}</span>
          ) : (
            <span>No results for "{searchState.query}"</span>
          )}
        </div>
      )}
    </div>
  );
});

EnhancedSearch.displayName = 'EnhancedSearch';

export default EnhancedSearch;`;

fs.writeFileSync('app/employees/components/EnhancedSearch.tsx', enhancedSearchContent);
console.log('✅ Fixed: EnhancedSearch.tsx');

console.log('🎉 All corrupted files fixed!');
