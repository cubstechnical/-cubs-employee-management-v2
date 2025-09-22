'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Plus, 
  Users,
  Loader2,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AuditService } from '@/lib/services/audit';

// Enhanced Components
import EmployeeCard from './components/EmployeeCard';
import EnhancedSearch from './components/EnhancedSearch';
import EnhancedFilters from './components/EnhancedFilters';
import BulkActions from './components/BulkActions';
import EnhancedPagination from './components/EnhancedPagination';

// Types
import { 
  Employee, 
  EmployeeCounts, 
  DeleteConfirmationState, 
  BulkActionState, 
  FilterState, 
  SearchState, 
  PaginationState 
} from './types';

// Loading Skeleton Component
const EmployeeCardSkeleton = () => (
  <div className="animate-pulse">
    <Card className="p-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
        <div className="space-y-2">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
        </div>
      </div>
    </Card>
  </div>
);

export const dynamic = 'force-dynamic';

export default function EnhancedEmployeesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Enhanced State Management
  const [searchState, setSearchState] = useState<SearchState>({
    term: '',
    debouncedTerm: '',
    suggestions: [],
    showSuggestions: false,
    highlightedIndex: -1,
    selectedEmployee: null
  });

  const [filterState, setFilterState] = useState<FilterState>({
    status: 'all',
    company: 'all',
    dateRange: null,
    visaStatus: 'all'
  });

  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalEmployees: 0,
    pageSize: 10
  });

  const [bulkState, setBulkState] = useState<BulkActionState>({
    selectedEmployees: new Set(),
    isSelecting: false,
    showBulkActions: false
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>({
    isOpen: false,
    employee: null,
    isDeleting: false
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchState(prev => ({ ...prev, debouncedTerm: prev.term }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchState.term]);

  // Reset pagination when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [searchState.debouncedTerm, filterState]);

  // Optimized Combined Query - Single API call for all data
  const { data: combinedData, isLoading, error } = useQuery({
    queryKey: [
      'employees-combined', 
      searchState.debouncedTerm, 
      filterState, 
      pagination.currentPage
    ],
    queryFn: async () => {
      try {
        console.log('🚀 Fetching combined employee data...');
        
        // Build base query
        let query = supabase
          .from('employee_table')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        // Apply search filter
        if (searchState.debouncedTerm.trim()) {
          const searchPattern = `%${searchState.debouncedTerm.trim()}%`;
          query = query.or(`name.ilike.${searchPattern},email_id.ilike.${searchPattern},company_name.ilike.${searchPattern},trade.ilike.${searchPattern},employee_id.ilike.${searchPattern}`);
        }

        // Apply status filter
        if (filterState.status !== 'all') {
          query = query.eq('is_active', filterState.status === 'active');
        }

        // Apply company filter
        if (filterState.company !== 'all') {
          query = query.eq('company_name', filterState.company);
        }

        // Apply visa status filter
        if (filterState.visaStatus !== 'all') {
          const now = new Date();
          if (filterState.visaStatus === 'expired') {
            query = query.lt('visa_expiry_date', now.toISOString());
          } else if (filterState.visaStatus === 'expiring') {
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            query = query.gte('visa_expiry_date', now.toISOString()).lte('visa_expiry_date', thirtyDaysFromNow.toISOString());
          } else if (filterState.visaStatus === 'valid') {
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            query = query.gt('visa_expiry_date', thirtyDaysFromNow.toISOString());
          }
        }

        // Apply date range filter
        if (filterState.dateRange?.start && filterState.dateRange?.end) {
          query = query.gte('visa_expiry_date', filterState.dateRange.start).lte('visa_expiry_date', filterState.dateRange.end);
        }

        // Apply pagination
        const from = (pagination.currentPage - 1) * pagination.pageSize;
        const to = from + pagination.pageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        if (error) throw error;

        // Get unique companies for filter
        const companiesQuery = supabase
          .from('employee_table')
          .select('company_name')
          .not('company_name', 'is', null)
          .order('company_name');

        const { data: companiesData } = await companiesQuery;
        const companies = [...new Set(companiesData?.map(item => item.company_name) || [])];

        // Calculate counts
        const total = count || 0;
        const activeCount = data?.filter(emp => emp.is_active).length || 0;
        const inactiveCount = total - activeCount;

        const result = {
          employees: data || [],
          companies,
          counts: {
            all: total,
            active: activeCount,
            inactive: inactiveCount
          },
          pagination: {
            currentPage: pagination.currentPage,
            totalPages: Math.ceil(total / pagination.pageSize),
            totalEmployees: total,
            pageSize: pagination.pageSize
          }
        };

        console.log('✅ Combined data fetched successfully:', result);
        return result;
      } catch (err) {
        console.error('❌ Error fetching combined data:', err);
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });

  // Update pagination state when data changes
  useEffect(() => {
    if (combinedData) {
      setPagination(combinedData.pagination);
    }
  }, [combinedData]);

  // Memoized suggestions
  const suggestions = useMemo(() => {
    if (!searchState.term.trim() || searchState.term.length < 2) return [];
    return combinedData?.employees.slice(0, 8) || [];
  }, [combinedData?.employees, searchState.term]);

  // Update suggestions when data changes
  useEffect(() => {
    setSearchState(prev => ({ ...prev, suggestions: suggestions as unknown as Employee[] }));
  }, [suggestions]);

  // Enhanced Event Handlers
  const handleSearchChange = useCallback((term: string) => {
    setSearchState(prev => ({ 
      ...prev, 
      term, 
      showSuggestions: term.length >= 2,
      selectedEmployee: null 
    }));
  }, []);

  const handleSuggestionSelect = useCallback((employee: Employee) => {
    setSearchState(prev => ({
      ...prev,
      selectedEmployee: employee,
      term: employee.name,
      showSuggestions: false
    }));
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchState({
      term: '',
      debouncedTerm: '',
      suggestions: [],
      showSuggestions: false,
      highlightedIndex: -1,
      selectedEmployee: null
    });
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchState.showSuggestions || searchState.suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSearchState(prev => ({
          ...prev,
          highlightedIndex: prev.highlightedIndex < searchState.suggestions.length - 1 
            ? prev.highlightedIndex + 1 : 0
        }));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSearchState(prev => ({
          ...prev,
          highlightedIndex: prev.highlightedIndex > 0 
            ? prev.highlightedIndex - 1 : searchState.suggestions.length - 1
        }));
        break;
      case 'Enter':
        e.preventDefault();
        if (searchState.highlightedIndex >= 0 && searchState.highlightedIndex < searchState.suggestions.length) {
          handleSuggestionSelect(searchState.suggestions[searchState.highlightedIndex]);
        }
        break;
      case 'Escape':
        setSearchState(prev => ({ ...prev, showSuggestions: false, highlightedIndex: -1 }));
        break;
    }
  }, [searchState.showSuggestions, searchState.suggestions, searchState.highlightedIndex, handleSuggestionSelect]);

  const handleFilterChange = useCallback((updates: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterState({
      status: 'all',
      company: 'all',
      dateRange: null,
      visaStatus: 'all'
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  const handleEmployeeSelect = useCallback((employeeId: string, selected: boolean) => {
    setBulkState(prev => {
      const newSelected = new Set(prev.selectedEmployees);
      if (selected) {
        newSelected.add(employeeId);
      } else {
        newSelected.delete(employeeId);
      }
      
      return {
        ...prev,
        selectedEmployees: newSelected,
        showBulkActions: newSelected.size > 0
      };
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = combinedData?.employees.map(emp => emp.id) || [];
    setBulkState(prev => ({
      ...prev,
      selectedEmployees: new Set(allIds as string[]),
      showBulkActions: allIds.length > 0
    }));
  }, [combinedData?.employees]);

  const handleDeselectAll = useCallback(() => {
    setBulkState(prev => ({
      ...prev,
      selectedEmployees: new Set(),
      showBulkActions: false
    }));
  }, []);

  // Delete mutation with audit logging
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const { data: employeeData } = await supabase
        .from('employee_table')
        .select('*')
        .eq('id', employeeId)
        .single();

      const { error } = await supabase
        .from('employee_table')
        .delete()
        .eq('id', employeeId);

      if (error) throw error;

      // Log audit trail
      if (employeeData) {
        const userInfo = await AuditService.getCurrentUserInfo();
        await AuditService.logAudit({
          table_name: 'employee_table',
          record_id: employeeId,
          action: 'DELETE',
          old_values: employeeData,
          new_values: undefined,
          user_id: userInfo.id,
          user_email: userInfo.email,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-combined'] });
      toast.success('Employee deleted successfully!');
      setDeleteConfirmation({ isOpen: false, employee: null, isDeleting: false });
    },
    onError: (error) => {
      toast.error(`Failed to delete employee: ${error.message}`);
      setDeleteConfirmation(prev => ({ ...prev, isDeleting: false }));
    },
  });

  const handleDeleteEmployee = useCallback((employee: Employee) => {
    setDeleteConfirmation({
      isOpen: true,
      employee,
      isDeleting: false
    });
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteConfirmation.employee) {
      setDeleteConfirmation(prev => ({ ...prev, isDeleting: true }));
      deleteEmployeeMutation.mutate(deleteConfirmation.employee.id);
    }
  }, [deleteConfirmation.employee, deleteEmployeeMutation]);

  const cancelDelete = useCallback(() => {
    setDeleteConfirmation({ isOpen: false, employee: null, isDeleting: false });
  }, []);

  const handleBulkDelete = useCallback(() => {
    // Implementation for bulk delete
    toast('Bulk delete functionality coming soon!');
  }, []);

  const handleBulkExport = useCallback(() => {
    // Implementation for bulk export
    toast('Bulk export functionality coming soon!');
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your workforce across all companies
            </p>
          </div>
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <EmployeeCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
        </div>
        <Card className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <Users className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Employees
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {error instanceof Error ? error.message : 'Failed to load employee data'}
          </p>
        </Card>
      </div>
    );
  }

  const hasActiveFilters = filterState.status !== 'all' || 
    filterState.company !== 'all' || 
    filterState.visaStatus !== 'all' || 
    filterState.dateRange !== null;

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#d3194f] to-[#b0173a] bg-clip-text text-transparent">
            Employees
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your workforce across all companies
          </p>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            className="bg-gradient-to-r from-[#d3194f] to-[#b0173a] hover:from-[#b0173a] hover:to-[#d3194f] text-white shadow-lg"
            onClick={() => router.push('/employees/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </motion.div>
      </motion.div>

      {/* Enhanced Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <EnhancedSearch
          searchState={searchState}
          onSearchChange={handleSearchChange}
          onSuggestionSelect={handleSuggestionSelect}
          onClearSearch={handleClearSearch}
          onKeyDown={handleKeyDown}
          onFocus={() => setSearchState(prev => ({ ...prev, showSuggestions: prev.term.length >= 2 }))}
          onBlur={() => setTimeout(() => setSearchState(prev => ({ ...prev, showSuggestions: false })), 200)}
        />
      </motion.div>

      {/* Enhanced Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <EnhancedFilters
          filterState={filterState}
          employeeCounts={combinedData?.counts || { all: 0, active: 0, inactive: 0 }}
          companies={combinedData?.companies as string[] || []}
          onStatusChange={(status) => handleFilterChange({ status })}
          onCompanyChange={(company) => handleFilterChange({ company })}
          onDateRangeChange={(dateRange) => handleFilterChange({ dateRange })}
          onVisaStatusChange={(visaStatus) => handleFilterChange({ visaStatus })}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </motion.div>

      {/* Search Results Info */}
      <AnimatePresence>
        {(searchState.selectedEmployee || searchState.term || hasActiveFilters) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  {searchState.selectedEmployee ? (
                    <>
                      Showing: <strong>{searchState.selectedEmployee.name}</strong>
                    </>
                  ) : (
                    <>
                      {searchState.term ? `Searching for "${searchState.term}"` : ''}
                      {hasActiveFilters && ' • Filters applied'}
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {combinedData?.employees.length || 0} result{(combinedData?.employees.length || 0) !== 1 ? 's' : ''}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSearch}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-900/30"
                >
                  Clear
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Employee List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid gap-4"
      >
        <AnimatePresence mode="popLayout">
          {combinedData?.employees.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="p-8 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Employees Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchState.term ? 'Try adjusting your search criteria' : 'Get started by adding your first employee'}
                </p>
                <Button 
                  className="bg-gradient-to-r from-[#d3194f] to-[#b0173a] hover:from-[#b0173a] hover:to-[#d3194f] text-white"
                  onClick={() => router.push('/employees/new')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              </Card>
            </motion.div>
          ) : (
            combinedData?.employees.map((employee, index) => (
              <EmployeeCard
                key={employee.id as string}
                employee={employee as unknown as Employee}
                onDelete={handleDeleteEmployee}
                onSelect={handleEmployeeSelect}
                isSelected={bulkState.selectedEmployees.has(employee.id as string)}
                index={index}
              />
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Enhanced Pagination */}
      {combinedData && (
        <EnhancedPagination
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}

      {/* Bulk Actions */}
      <BulkActions
        bulkState={bulkState}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onBulkDelete={handleBulkDelete}
        onBulkExport={handleBulkExport}
        totalEmployees={combinedData?.employees.length || 0}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Employee
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {deleteConfirmation.employee?.name}
                  </span>
                  ?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Employee ID: {deleteConfirmation.employee?.employee_id}
                </p>
              </div>
              
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={cancelDelete}
                  disabled={deleteConfirmation.isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={confirmDelete}
                  disabled={deleteConfirmation.isDeleting}
                >
                  {deleteConfirmation.isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
